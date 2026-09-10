'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createManuscriptRecord } from '../manuscripts/actions'

function isAdminEmail(email?: string | null) {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()).filter(Boolean) || []
    return !email && adminEmails.includes(email)
}

async function requireAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthenticated' as const }
    if (!isAdminEmail(user.email)) return { error: 'Unauthorized' as const }

    return { supabase, user }
}

export async function getProposals(filterStatus?: string) {
    const admin = await requireAdmin()
    if ('error' in admin) return { error: admin.error, proposals: [] }

    let query = admin.supabase
        .from('manuscript_proposals')
        .select('*')
        .order('created_at', { ascending: false })

    if (filterStatus && filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
    }

    const { data, error } = await query

    if (error) {
        console.warn('Error fetching manuscript proposals:', error.message)
        return { proposals: [], error: error.message }
    }

    return { proposals: data || [], error: null }
}

export async function approveProposalAndCreateManuscript(proposalId: string) {
    const admin = await requireAdmin()
    if ('error' in admin) return { error: admin.error }

    // 1. Fetch proposal
    const { data: proposal, error: fetchError } = await admin.supabase
        .from('manuscript_proposals')
        .select('*')
        .eq('id', proposalId)
        .single()

    if (fetchError || !proposal) {
        return { error: 'Proposal not found' }
    }

    // 2. Build scholarly description from proposal metadata
    const notesArr = []
    if (proposal.proposer_name) {
        notesArr.push(`Proposé par : ${proposal.proposer_name}${proposal.proposer_affiliation ? ` (${proposal.proposer_affiliation})` : ''}`)
    }
    if (proposal.scholarly_justification) {
        notesArr.push(`Intérêt scientifique : ${proposal.scholarly_justification}`)
    }
    if (proposal.facsimile_url) {
        notesArr.push(`Source numérique originale : ${proposal.facsimile_url}`)
    }

    // 3. Create official manuscript
    const result = await createManuscriptRecord({
        title: proposal.title,
        source: proposal.institution || '',
        author: proposal.author || '',
        shelfmark: proposal.shelfmark || '',
        scriptType: proposal.script_type || '',
        century: proposal.century || '',
        description: notesArr.join('\n\n'),
        segmentsCount: 0,
        coverUrl: proposal.sample_image_url || '',
        pdfUrl: (proposal.facsimile_url && proposal.facsimile_url.endsWith('.pdf')) ? proposal.facsimile_url : undefined
    })

    if (result.error || !result.id) {
        return { error: result.error || 'Failed to create manuscript' }
    }

    // 4. Update proposal status to approved
    await admin.supabase
        .from('manuscript_proposals')
        .update({
            status: 'approved',
            created_manuscript_id: result.id,
            reviewed_at: new Date().toISOString(),
            reviewed_by: admin.user.id
        })
        .eq('id', proposalId)

    revalidatePath('/admin/proposals')
    revalidatePath('/admin/manuscripts')
    return { success: true, manuscriptId: result.id }
}

export async function rejectProposal(proposalId: string, adminNotes?: string) {
    const admin = await requireAdmin()
    if ('error' in admin) return { error: admin.error }

    const { error } = await admin.supabase
        .from('manuscript_proposals')
        .update({
            status: 'rejected',
            admin_notes: adminNotes?.trim() || null,
            reviewed_at: new Date().toISOString(),
            reviewed_by: admin.user.id
        })
        .eq('id', proposalId)

    if (error) return { error: error.message }

    revalidatePath('/admin/proposals')
    return { success: true }
}
