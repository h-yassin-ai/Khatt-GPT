'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPage({
    manuscriptId, imageUrl, orderIndex, label
}: { manuscriptId: string, imageUrl: string, orderIndex: number, label?: string }) {
    const supabase = await createClient()

    const { data, error } = await supabase.from('pages').insert({
        manuscript_id: manuscriptId,
        image_url: imageUrl,
        order_index: orderIndex,
        label: label || `Page ${orderIndex}`
    }).select('id').single()

    if (error) return { error: error.message }

    revalidatePath(`/admin/manuscripts/${manuscriptId}`)
    return { id: data.id }
}

export async function updatePage(pageId: string, manuscriptId: string, fields: { label?: string, order_index?: number, image_url?: string }) {
    const supabase = await createClient()
    const { error } = await supabase.from('pages').update(fields).eq('id', pageId)
    if (error) return { error: error.message }
    revalidatePath(`/admin/manuscripts/${manuscriptId}`)
    return { success: true }
}

export async function deletePage(pageId: string, manuscriptId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('pages').delete().eq('id', pageId)
    if (error) return { error: error.message }
    revalidatePath(`/admin/manuscripts/${manuscriptId}`)
    return { success: true }
}

export async function bulkInsertSegmentsForPage(pageId: string, manuscriptId: string, segmentDetails: { image_url: string, order_index: number }[]) {
    const supabase = await createClient()

    const toInsert = segmentDetails.map(s => ({
        ...s,
        page_id: pageId,
        manuscript_id: manuscriptId,
        status: 'pending',
        transcription_count: 0
    }))

    const { error } = await supabase.from('segments').insert(toInsert)

    if (error) return { error: error.message }

    revalidatePath(`/admin/manuscripts/${manuscriptId}`)
    revalidatePath(`/admin/manuscripts/${manuscriptId}/pages/${pageId}`)
    return { success: true }
}

export async function deleteSegment(segmentId: string, manuscriptId: string, pageId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('segments').delete().eq('id', segmentId)
    if (error) return { error: error.message }
    revalidatePath(`/admin/manuscripts/${manuscriptId}/pages/${pageId}`)
    return { success: true }
}

export async function reorderSegments(segments: { id: string, order_index: number }[], manuscriptId: string, pageId: string) {
    const supabase = await createClient()

    for (const seg of segments) {
        await supabase.from('segments').update({ order_index: seg.order_index }).eq('id', seg.id)
    }

    revalidatePath(`/admin/manuscripts/${manuscriptId}/pages/${pageId}`)
    return { success: true }
}

export async function bulkInsertPages(manuscriptId: string, pages: { image_url: string, order_index: number, label: string }[]) {
    const supabase = await createClient()

    const toInsert = pages.map(p => ({
        ...p,
        manuscript_id: manuscriptId
    }))

    const { error } = await supabase.from('pages').insert(toInsert)

    if (error) return { error: error.message }

    revalidatePath(`/admin/manuscripts/${manuscriptId}`)
    return { success: true }
}

export async function bulkInsertPagesWithSegments(manuscriptId: string, fullData: {
    page: { image_url: string, order_index: number, label: string },
    segments: { image_url: string, order_index: number, polygon?: any }[]
}[]) {
    const supabase = await createClient()

    for (const item of fullData) {
        // 1. Insert Page
        const { data: pageData, error: pageError } = await supabase.from('pages').insert({
            manuscript_id: manuscriptId,
            image_url: item.page.image_url,
            order_index: item.page.order_index,
            label: item.page.label
        }).select('id').single()

        if (pageError) return { error: `Error inserting page ${item.page.label}: ${pageError.message}` }

        // 2. Insert Segments for this page
        if (item.segments.length > 0) {
            const segmentsToInsert = item.segments.map(s => ({
                page_id: pageData.id,
                manuscript_id: manuscriptId,
                image_url: s.image_url,
                order_index: s.order_index,
                polygon: s.polygon,
                status: 'pending',
                transcription_count: 0
            }))

            const { error: segError } = await supabase.from('segments').insert(segmentsToInsert)
            if (segError) return { error: `Error inserting segments for page ${item.page.label}: ${segError.message}` }
        }
    }

    revalidatePath(`/admin/manuscripts/${manuscriptId}`)
    return { success: true }
}

