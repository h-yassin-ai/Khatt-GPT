'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

function isAdminEmail(email?: string | null) {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()).filter(Boolean) || []
    return Boolean(email && adminEmails.includes(email))
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
    title, description, source, segmentsCount, coverUrl, pdfUrl,
    author, shelfmark, scriptType, century, license, iiifManifestUrl
}: { 
    title: string
    description: string
    source: string
    segmentsCount: number
    coverUrl: string
    pdfUrl?: string
    author?: string
    shelfmark?: string
    scriptType?: string
    century?: string
    license?: string
    iiifManifestUrl?: string
}) {
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
    if (author?.trim()) insertPayload.author = author.trim()
    if (shelfmark?.trim()) insertPayload.shelfmark = shelfmark.trim()
    if (scriptType?.trim()) insertPayload.script_type = scriptType.trim()
    if (century?.trim()) insertPayload.century = century.trim()
    if (license?.trim()) insertPayload.license = license.trim()
    if (iiifManifestUrl?.trim()) insertPayload.iiif_manifest_url = iiifManifestUrl.trim()

    let { data, error } = await admin.supabase.from('manuscripts').insert(insertPayload).select('id').single()

    // Fallback if optional columns don't exist yet
    if (error && (error.message.includes('column') || error.code === '42703')) {
        const basePayload = {
            title: safeTitle,
            description: description.trim(),
            source: source.trim(),
            uploaded_by: admin.user.id,
            total_segments: Math.max(0, segmentsCount || 0),
            cover_image_url: coverUrl.trim(),
        }
        if (safePdfUrl) Object.assign(basePayload, { pdf_url: safePdfUrl })
        const fallback = await admin.supabase.from('manuscripts').insert(basePayload).select('id').single()
        data = fallback.data
        error = fallback.error
    }

    if (error || !data) return { error: error?.message || 'Erreur lors de la création du manuscrit' }
    return { id: data.id }
}

export async function bulkInsertSegments(manuscriptId: string, segmentDetails: { image_url: string, order_index: number }[]) {
    const admin = await requireAdmin()
    if ('error' in admin) return { error: admin.error }

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
