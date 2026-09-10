'use server'

import { createClient } from '@/utils/supabase/server'

export type ProposalPayload = {
    title: string
    author?: string
    institution?: string
    shelfmark?: string
    scriptType?: string
    century?: string
    facsimileUrl?: string
    sampleImageUrl?: string
    proposerName: string
    proposerEmail: string
    proposerAffiliation?: string
    scholarlyJustification?: string
}

export async function submitManuscriptProposal(payload: ProposalPayload) {
    const title = payload.title?.trim()
    const proposerName = payload.proposerName?.trim()
    const proposerEmail = payload.proposerEmail?.trim()

    if (!title) {
        return { error: 'Le titre du manuscrit est requis.' }
    }
    if (!proposerName) {
        return { error: 'Le nom du proposant ou chercheur est requis.' }
    }
    if (!proposerEmail || !proposerEmail.includes('@')) {
        return { error: 'Une adresse e-mail valide est requise pour le suivi.' }
    }

    if (payload.facsimileUrl?.trim()) {
        try {
            const url = new URL(payload.facsimileUrl.trim())
            if (!['http:', 'https:'].includes(url.protocol)) {
                return { error: 'Le lien du fac-similé doit être une URL valide (http ou https).' }
            }
        } catch {
            return { error: 'Le lien du fac-similé est invalide.' }
        }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('manuscript_proposals')
        .insert({
            title,
            author: payload.author?.trim() || null,
            institution: payload.institution?.trim() || null,
            shelfmark: payload.shelfmark?.trim() || null,
            script_type: payload.scriptType?.trim() || null,
            century: payload.century?.trim() || null,
            facsimile_url: payload.facsimileUrl?.trim() || null,
            sample_image_url: payload.sampleImageUrl?.trim() || null,
            proposer_name: proposerName,
            proposer_email: proposerEmail,
            proposer_affiliation: payload.proposerAffiliation?.trim() || null,
            scholarly_justification: payload.scholarlyJustification?.trim() || null,
            status: 'pending'
        })
        .select('id')
        .single()

    if (error) {
        console.error('Error submitting manuscript proposal:', error)
        if (error.message && (error.message.includes('relation') || error.code === '42P01')) {
            return { error: "La table des propositions n'est pas encore migrée dans Supabase. Veuillez exécuter docs/migration_manuscript_proposals.sql." }
        }
        return { error: error.message }
    }

    return { success: true, id: data.id }
}
