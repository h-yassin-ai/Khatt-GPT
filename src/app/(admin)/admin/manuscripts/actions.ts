'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Note: Direct file upload via Server Action is subject to body size limits (default ~1MB/4MB often in Vercel)
// For a batch uploader of 50 images, the standard practice is to use pre-signed URLs or direct Supabase Storage JS Client from the browser.
// So this Server Action only handles DB metadata creation.

function isAdminEmail(email?: string | null) {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()).filter(Boolean) || []
    return !!email && adminEmails.includes(email)
}

async function requireAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthenticated' as const }
    if (!isAdminEmail(user.email)) return { error: 'Unauthorized' as const }

    return { supabase, user }
}

function normalizeOptionalUrl(url?: string) {
    const trimmed = url?.trim()
    if (!trimmed) return null

    try {
        const parsed = new URL(trimmed)
        if (!['http:', 'https:'].includes(parsed.protocol)) return null
        return parsed.toString()
    } catch {
        return null
    }
}

function resourceMigrationError(column: 'pdf_url' | 'reference_text_url') {
    return `La colonne ${column} manque dans la base. Exécutez docs/migration_manuscript_resources.sql dans Supabase, puis réessayez.`
}

async function ensureResourceColumn(supabase: any, manuscriptId: string, column: 'pdf_url' | 'reference_text_url') {
    const { error } = await supabase
        .from('manuscripts')
        .select(`id, ${column}`)
        .eq('id', manuscriptId)
        .maybeSingle()

    return error ? resourceMigrationError(column) : null
}

export async function checkManuscriptResourceColumn(manuscriptId: string, column: 'pdf_url' | 'reference_text_url') {
    const admin = await requireAdmin()
    if ('error' in admin) return { error: admin.error }

    const error = await ensureResourceColumn(admin.supabase, manuscriptId, column)
    return error ? { error } : { success: true }
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

export async function createManuscriptRecord({
    title, description, source, segmentsCount, coverUrl, pdfUrl
}: { title: string, description: string, source: string, segmentsCount: number, coverUrl: string, pdfUrl?: string }) {

    const admin = await requireAdmin()
    if ('error' in admin) return { error: admin.error }

    const safeTitle = title.trim()
    if (!safeTitle) return { error: 'Title is required.' }

    const safePdfUrl = normalizeOptionalUrl(pdfUrl)
    if (pdfUrl?.trim() && !safePdfUrl) return { error: 'PDF URL must be a valid http(s) URL.' }

    const insertPayload: Record<string, unknown> = {
        title: safeTitle,
        description: description.trim(),
        source: source.trim(),
        uploaded_by: admin.user.id,
        total_segments: Math.max(0, segmentsCount || 0),
        cover_image_url: coverUrl.trim(),
    }
    if (safePdfUrl) insertPayload.pdf_url = safePdfUrl

    const { data, error } = await admin.supabase.from('manuscripts').insert(insertPayload).select('id').single()

    if (error) return { error: error.message }
    return { id: data.id }
}

export async function bulkInsertSegments(manuscriptId: string, segmentDetails: { image_url: string, order_index: number }[]) {
    const admin = await requireAdmin()
    if ('error' in admin) return { error: admin.error }

    // Add the manuscript_id to each
    const toInsert = segmentDetails.map(s => ({
        ...s,
        manuscript_id: manuscriptId,
        status: 'pending',
        transcription_count: 0
    }))

    const { error } = await admin.supabase.from('segments').insert(toInsert)

    if (error) return { error: error.message }

    await syncManuscriptSegmentCount(admin.supabase, manuscriptId)

    revalidatePath('/admin/manuscripts')
    return { success: true }
}

export async function deleteManuscript(id: string) {
    const admin = await requireAdmin()
    if ('error' in admin) return { error: admin.error }

    // Storage cleanup: list and remove files under manuscripts/{id}/
    const { data: files } = await admin.supabase.storage.from('manuscripts').list(id, { limit: 1000 })
    if (files && files.length > 0) {
        const paths = files.map((f: any) => `${id}/${f.name}`)
        await admin.supabase.storage.from('manuscripts').remove(paths)
    }

    const { error } = await admin.supabase.from('manuscripts').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/manuscripts')
    return { success: true }
}

export async function updateManuscriptReferenceText(manuscriptId: string, url: string) {
    const admin = await requireAdmin()
    if ('error' in admin) return { error: admin.error }

    const safeUrl = normalizeOptionalUrl(url)
    if (url.trim() && !safeUrl) return { error: 'Reference text URL must be a valid http(s) URL.' }

    const migrationError = await ensureResourceColumn(admin.supabase, manuscriptId, 'reference_text_url')
    if (migrationError) return { error: migrationError }

    const { error } = await admin.supabase.from('manuscripts').update({ reference_text_url: safeUrl }).eq('id', manuscriptId)
    if (error) return { error: error.message }

    revalidatePath(`/admin/manuscripts/${manuscriptId}`)
    return { success: true }
}

export async function updateManuscriptTitle(id: string, title: string) {
    const admin = await requireAdmin()
    if ('error' in admin) return { error: admin.error }

    const safeTitle = title.trim()
    if (!safeTitle) return { error: 'Title is required.' }

    const { error } = await admin.supabase.from('manuscripts').update({ title: safeTitle }).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/manuscripts')
    revalidatePath(`/admin/manuscripts/${id}`)
    return { success: true }
}

export async function updateManuscriptMetadata(
    id: string,
    fields: { title: string, source?: string, description?: string }
) {
    const admin = await requireAdmin()
    if ('error' in admin) return { error: admin.error }

    const safeTitle = fields.title.trim()
    if (!safeTitle) return { error: 'Title is required.' }

    const { error } = await admin.supabase
        .from('manuscripts')
        .update({
            title: safeTitle,
            source: fields.source?.trim() || null,
            description: fields.description?.trim() || null,
        })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/manuscripts')
    revalidatePath(`/admin/manuscripts/${id}`)
    return { success: true }
}

export async function updateManuscriptPdfUrl(manuscriptId: string, url: string) {
    const admin = await requireAdmin()
    if ('error' in admin) return { error: admin.error }

    const safeUrl = normalizeOptionalUrl(url)
    if (url.trim() && !safeUrl) return { error: 'PDF URL must be a valid http(s) URL.' }

    const migrationError = await ensureResourceColumn(admin.supabase, manuscriptId, 'pdf_url')
    if (migrationError) return { error: migrationError }

    const { error } = await admin.supabase.from('manuscripts').update({ pdf_url: safeUrl }).eq('id', manuscriptId)
    if (error) return { error: error.message }

    revalidatePath(`/admin/manuscripts/${manuscriptId}`)
    return { success: true }
}

export async function uploadManuscriptPdf(manuscriptId: string, formData: FormData) {
    const admin = await requireAdmin()
    if ('error' in admin) return { error: admin.error }

    const file = formData.get('file') as File
    if (!file) return { error: 'No file provided' }

    const migrationError = await ensureResourceColumn(admin.supabase, manuscriptId, 'pdf_url')
    if (migrationError) return { error: migrationError }

    const fileExt = file.name.split('.').pop()
    const fileName = `manuscript_${Date.now()}.${fileExt}`
    const filePath = `${manuscriptId}/${fileName}`

    const { error: uploadError } = await admin.supabase.storage
        .from('manuscripts')
        .upload(filePath, file)

    if (uploadError) return { error: uploadError.message }

    const { data: { publicUrl } } = admin.supabase.storage
        .from('manuscripts')
        .getPublicUrl(filePath)

    return await updateManuscriptPdfUrl(manuscriptId, publicUrl)
}
