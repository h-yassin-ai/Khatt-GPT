'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

function isAdminEmail(email?: string | null) {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()).filter(Boolean) || []
    return !!email && adminEmails.includes(email)
}

async function requireAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthenticated' as const }
    if (!isAdminEmail(user.email)) return { error: 'Unauthorized' as const }

    return { supabase }
}

async function syncManuscriptSegmentCount(supabase: any, manuscriptId: string) {
    const { count } = await supabase
        .from('segments')
        .select('*', { count: 'exact', head: true })
        .eq('manuscript_id', manuscriptId)

    await supabase
        .from('manuscripts')
        .update({ total_segments: count || 0 })
        .eq('id', manuscriptId)
}

export async function createPage({
    manuscriptId, imageUrl, orderIndex, label
}: { manuscriptId: string, imageUrl: string, orderIndex: number, label?: string }) {
    const admin = await requireAdmin()
    if ('error' in admin) return { error: admin.error }

    if (!imageUrl.trim()) return { error: 'Page image URL is required.' }
    const safeOrderIndex = Math.max(1, Number.isFinite(orderIndex) ? Math.trunc(orderIndex) : 1)

    const { data, error } = await admin.supabase.from('pages').insert({
        manuscript_id: manuscriptId,
        image_url: imageUrl.trim(),
        order_index: safeOrderIndex,
        label: label?.trim() || `Page ${safeOrderIndex}`
    }).select('id').single()

    if (error) return { error: error.message }

    revalidatePath(`/admin/manuscripts/${manuscriptId}`)
    return { id: data.id }
}

export async function updatePage(pageId: string, manuscriptId: string, fields: { label?: string, order_index?: number, image_url?: string }) {
    const admin = await requireAdmin()
    if ('error' in admin) return { error: admin.error }

    const updateFields: { label?: string, order_index?: number, image_url?: string } = {}
    if (fields.label !== undefined) updateFields.label = fields.label.trim()
    if (fields.image_url !== undefined) updateFields.image_url = fields.image_url.trim()
    if (fields.order_index !== undefined) updateFields.order_index = Math.max(1, Math.trunc(fields.order_index))

    const { error } = await admin.supabase.from('pages').update(updateFields).eq('id', pageId)
    if (error) return { error: error.message }
    revalidatePath(`/admin/manuscripts/${manuscriptId}`)
    return { success: true }
}

export async function deletePage(pageId: string, manuscriptId: string) {
    const admin = await requireAdmin()
    if ('error' in admin) return { error: admin.error }

    const { error } = await admin.supabase.from('pages').delete().eq('id', pageId)
    if (error) return { error: error.message }

    await syncManuscriptSegmentCount(admin.supabase, manuscriptId)

    revalidatePath(`/admin/manuscripts/${manuscriptId}`)
    return { success: true }
}

export async function bulkInsertSegmentsForPage(pageId: string, manuscriptId: string, segmentDetails: { image_url: string, order_index: number }[]) {
    const admin = await requireAdmin()
    if ('error' in admin) return { error: admin.error }
    if (segmentDetails.length === 0) return { error: 'No line images were provided.' }

    const toInsert = segmentDetails.map(s => ({
        image_url: s.image_url.trim(),
        order_index: Math.max(1, Math.trunc(s.order_index)),
        page_id: pageId,
        manuscript_id: manuscriptId,
        status: 'pending',
        transcription_count: 0
    }))

    const { error } = await admin.supabase.from('segments').insert(toInsert)

    if (error) return { error: error.message }

    await syncManuscriptSegmentCount(admin.supabase, manuscriptId)

    revalidatePath(`/admin/manuscripts/${manuscriptId}`)
    revalidatePath(`/admin/manuscripts/${manuscriptId}/pages/${pageId}`)
    return { success: true }
}

export async function deleteSegment(segmentId: string, manuscriptId: string, pageId: string) {
    const admin = await requireAdmin()
    if ('error' in admin) return { error: admin.error }

    const { error } = await admin.supabase.from('segments').delete().eq('id', segmentId)
    if (error) return { error: error.message }

    await syncManuscriptSegmentCount(admin.supabase, manuscriptId)

    revalidatePath(`/admin/manuscripts/${manuscriptId}/pages/${pageId}`)
    return { success: true }
}

export async function reorderSegments(segments: { id: string, order_index: number }[], manuscriptId: string, pageId: string) {
    const admin = await requireAdmin()
    if ('error' in admin) return { error: admin.error }

    for (const seg of segments) {
        await admin.supabase.from('segments').update({ order_index: Math.max(1, Math.trunc(seg.order_index)) }).eq('id', seg.id)
    }

    revalidatePath(`/admin/manuscripts/${manuscriptId}/pages/${pageId}`)
    return { success: true }
}

export async function bulkInsertPages(manuscriptId: string, pages: { image_url: string, order_index: number, label: string }[]) {
    const admin = await requireAdmin()
    if ('error' in admin) return { error: admin.error }
    if (pages.length === 0) return { error: 'No pages were provided.' }

    const toInsert = pages.map(p => ({
        image_url: p.image_url.trim(),
        order_index: Math.max(1, Math.trunc(p.order_index)),
        label: p.label.trim(),
        manuscript_id: manuscriptId
    }))

    const { error } = await admin.supabase.from('pages').insert(toInsert)

    if (error) return { error: error.message }

    await syncManuscriptSegmentCount(admin.supabase, manuscriptId)

    revalidatePath(`/admin/manuscripts/${manuscriptId}`)
    return { success: true }
}

export async function bulkInsertPagesWithSegments(manuscriptId: string, fullData: {
    page: { image_url: string, order_index: number, label: string },
    segments: { image_url: string, order_index: number, polygon?: any }[]
}[]) {
    const admin = await requireAdmin()
    if ('error' in admin) return { error: admin.error }
    if (fullData.length === 0) return { error: 'No pages were provided.' }

    const insertedPageIds: string[] = []

    for (const item of fullData) {
        // 1. Insert Page
        const { data: pageData, error: pageError } = await admin.supabase.from('pages').insert({
            manuscript_id: manuscriptId,
            image_url: item.page.image_url.trim(),
            order_index: Math.max(1, Math.trunc(item.page.order_index)),
            label: item.page.label.trim()
        }).select('id').single()

        if (pageError) {
            if (insertedPageIds.length > 0) await admin.supabase.from('pages').delete().in('id', insertedPageIds)
            return { error: `Error inserting page ${item.page.label}: ${pageError.message}` }
        }

        insertedPageIds.push(pageData.id)

        // 2. Insert Segments for this page
        if (item.segments.length > 0) {
            const segmentsToInsert = item.segments.map(s => ({
                page_id: pageData.id,
                manuscript_id: manuscriptId,
                image_url: s.image_url.trim(),
                order_index: Math.max(1, Math.trunc(s.order_index)),
                polygon: s.polygon,
                status: 'pending',
                transcription_count: 0
            }))

            const { error: segError } = await admin.supabase.from('segments').insert(segmentsToInsert)
            if (segError) {
                await admin.supabase.from('pages').delete().in('id', insertedPageIds)
                return { error: `Error inserting segments for page ${item.page.label}: ${segError.message}` }
            }
        }
    }

    await syncManuscriptSegmentCount(admin.supabase, manuscriptId)

    revalidatePath(`/admin/manuscripts/${manuscriptId}`)
    return { success: true }
}

