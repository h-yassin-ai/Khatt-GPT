'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Note: Direct file upload via Server Action is subject to body size limits (default ~1MB/4MB often in Vercel)
// For a batch uploader of 50 images, the standard practice is to use pre-signed URLs or direct Supabase Storage JS Client from the browser.
// So this Server Action only handles DB metadata creation.

export async function createManuscriptRecord({
    title, description, source, segmentsCount, coverUrl, pdfUrl
}: { title: string, description: string, source: string, segmentsCount: number, coverUrl: string, pdfUrl?: string }) {

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthenticated" }

    const { data, error } = await supabase.from('manuscripts').insert({
        title,
        description,
        source,
        uploaded_by: user.id,
        total_segments: segmentsCount,
        cover_image_url: coverUrl
    }).select('id').single()

    if (error) return { error: error.message }
    return { id: data.id }
}

export async function bulkInsertSegments(manuscriptId: string, segmentDetails: { image_url: string, order_index: number }[]) {
    const supabase = await createClient()

    // Add the manuscript_id to each
    const toInsert = segmentDetails.map(s => ({
        ...s,
        manuscript_id: manuscriptId,
        status: 'pending',
        transcription_count: 0
    }))

    const { error } = await supabase.from('segments').insert(toInsert)

    if (error) return { error: error.message }

    revalidatePath('/admin/manuscripts')
    return { success: true }
}

export async function deleteManuscript(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthenticated' }

    // Storage cleanup: list and remove files under manuscripts/{id}/
    const { data: files } = await supabase.storage.from('manuscripts').list(id, { limit: 1000 })
    if (files && files.length > 0) {
        const paths = files.map((f: any) => `${id}/${f.name}`)
        await supabase.storage.from('manuscripts').remove(paths)
    }

    const { error } = await supabase.from('manuscripts').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/manuscripts')
    return { success: true }
}

export async function updateManuscriptReferenceText(manuscriptId: string, url: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthenticated' }

    const { error } = await supabase.from('manuscripts').update({ reference_text_url: url }).eq('id', manuscriptId)
    if (error) return { error: error.message }

    revalidatePath(`/admin/manuscripts/${manuscriptId}`)
    return { success: true }
}

export async function updateManuscriptTitle(id: string, title: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthenticated' }

    const { error } = await supabase.from('manuscripts').update({ title }).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/manuscripts')
    revalidatePath(`/admin/manuscripts/${id}`)
    return { success: true }
}
