import 'server-only'

import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'

type RawSegment = {
    id: string
    status: string | null
    image_url: string | null
    order_index: number | null
    segmentation_issue_reported?: boolean | null
}

type RawPage = {
    id: string
    image_url: string | null
    order_index: number | null
    created_at?: string | null
    segments?: RawSegment[] | null
}

type RawManuscript = {
    id: string
    title: string
    source: string | null
    description: string | null
    cover_image_url: string | null
    total_segments: number | null
    created_at: string
    pdf_url?: string | null
    reference_text_url?: string | null
    pages?: RawPage[] | null
    segments?: RawSegment[] | null
}

export type ManuscriptCatalogItem = {
    id: string
    title: string
    source: string | null
    description: string | null
    coverImageUrl: string | null
    createdAt: string
    hasPdf: boolean
    hasReferenceText: boolean
    pageCount: number
    totalSegments: number
    validatedSegments: number
    reviewSegments: number
    conflictSegments: number
    progress: number
}

export type ManuscriptCatalogSummary = {
    manuscripts: number
    pages: number
    segments: number
    validated: number
}

export type ManuscriptCatalogResult = {
    manuscripts: ManuscriptCatalogItem[]
    summary: ManuscriptCatalogSummary
    available: boolean
}

export type ManuscriptPageRecord = {
    id: string
    imageUrl: string | null
    orderIndex: number
    lineCount: number
    validatedCount: number
    issueCount: number
}

export type ManuscriptResearchRecord = ManuscriptCatalogItem & {
    pdfUrl: string | null
    referenceTextUrl: string | null
    pages: ManuscriptPageRecord[]
    qualityScore: number
    qualityChecks: {
        source: boolean
        description: boolean
        pageImages: boolean
        referenceText: boolean
        validatedData: boolean
    }
}

function cleanSearchQuery(value: string) {
    return value
        .trim()
        .slice(0, 100)
        .replace(/[,%()"'\\]/g, ' ')
        .replace(/\s+/g, ' ')
}

function catalogSelect(includeOptionalColumns: boolean) {
    return includeOptionalColumns
        ? `
            id,
            title,
            source,
            description,
            cover_image_url,
            total_segments,
            created_at,
            pdf_url,
            reference_text_url,
            pages (id, image_url, order_index),
            segments (id, status, image_url, order_index)
        `
        : `
            id,
            title,
            source,
            description,
            cover_image_url,
            total_segments,
            created_at,
            pages (id, image_url, order_index),
            segments (id, status, image_url, order_index)
        `
}

function orderedPages(pages: RawPage[] | null | undefined) {
    return [...(pages || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
}

function orderedSegments(segments: RawSegment[] | null | undefined) {
    return [...(segments || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
}

function toCatalogItem(manuscript: RawManuscript): ManuscriptCatalogItem {
    const pages = orderedPages(manuscript.pages)
    const segments = orderedSegments(manuscript.segments)
    const totalSegments = Math.max(manuscript.total_segments || 0, segments.length)
    const validatedSegments = segments.filter((segment) => segment.status === 'validated').length
    const reviewSegments = segments.filter((segment) => !['validated', 'archived'].includes(segment.status || '')).length
    const conflictSegments = segments.filter((segment) => segment.status === 'conflict').length
    const progress = totalSegments > 0 ? Math.round((validatedSegments / totalSegments) * 100) : 0

    return {
        id: manuscript.id,
        title: manuscript.title,
        source: manuscript.source,
        description: manuscript.description,
        coverImageUrl: pages[0]?.image_url || manuscript.cover_image_url || segments[0]?.image_url || null,
        createdAt: manuscript.created_at,
        hasPdf: Boolean(manuscript.pdf_url),
        hasReferenceText: Boolean(manuscript.reference_text_url),
        pageCount: pages.length,
        totalSegments,
        validatedSegments,
        reviewSegments,
        conflictSegments,
        progress,
    }
}

export async function getManuscriptCatalog(search = ''): Promise<ManuscriptCatalogResult> {
    const supabase = await createClient()
    const query = cleanSearchQuery(search)

    const buildRequest = (includeOptionalColumns: boolean) => {
        const requestBuilder: any = supabase.from('manuscripts').select(catalogSelect(includeOptionalColumns) as any)
        return requestBuilder
            .order('created_at', { ascending: false })
            .order('order_index', { referencedTable: 'pages', ascending: true })
            .order('order_index', { referencedTable: 'segments', ascending: true })
    }

    let request: any = buildRequest(false)
    if (query) {
        request = request.or(`title.ilike.%${query}%,source.ilike.%${query}%,description.ilike.%${query}%`)
    }

    let { data, error } = await request
    if (error) {
        console.warn('Unable to load manuscript catalog:', error.message)
        return {
            manuscripts: [],
            summary: { manuscripts: 0, pages: 0, segments: 0, validated: 0 },
            available: false,
        }
    }

    const rawManuscripts = ((data || []) as RawManuscript[])
    if (rawManuscripts.length > 0) {
        const { data: resources } = await supabase
            .from('manuscripts')
            .select('id, pdf_url, reference_text_url')
            .in('id', rawManuscripts.map((manuscript) => manuscript.id))
        if (resources) {
            const resourceById = new Map((resources as Array<{ id: string; pdf_url?: string | null; reference_text_url?: string | null }>).map((resource) => [resource.id, resource]))
            rawManuscripts.forEach((manuscript) => Object.assign(manuscript, resourceById.get(manuscript.id)))
        }
    }
    const manuscripts = rawManuscripts.map(toCatalogItem)
    const summary = manuscripts.reduce<ManuscriptCatalogSummary>(
        (totals, manuscript) => ({
            manuscripts: totals.manuscripts + 1,
            pages: totals.pages + manuscript.pageCount,
            segments: totals.segments + manuscript.totalSegments,
            validated: totals.validated + manuscript.validatedSegments,
        }),
        { manuscripts: 0, pages: 0, segments: 0, validated: 0 }
    )

    return { manuscripts, summary, available: true }
}

export const getManuscriptRecord = cache(async (id: string): Promise<ManuscriptResearchRecord | null> => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return null

    const supabase = await createClient()
    const recordSelect = (mode: 'all' | 'resources' | 'base') => mode === 'all' ? `
            id,
            title,
            source,
            description,
            cover_image_url,
            total_segments,
            created_at,
            pdf_url,
            reference_text_url,
            pages (
                id,
                image_url,
                order_index,
                created_at,
                segments (id, status, image_url, order_index, segmentation_issue_reported)
            )
        ` : mode === 'resources' ? `
            id,
            title,
            source,
            description,
            cover_image_url,
            total_segments,
            created_at,
            pdf_url,
            reference_text_url,
            pages (
                id,
                image_url,
                order_index,
                created_at,
                segments (id, status, image_url, order_index)
            )
        ` : `
            id,
            title,
            source,
            description,
            cover_image_url,
            total_segments,
            created_at,
            pages (
                id,
                image_url,
                order_index,
                created_at,
                segments (id, status, image_url, order_index, segmentation_issue_reported)
            )
        `
    let { data, error } = await supabase
        .from('manuscripts')
        .select(recordSelect('base') as any)
        .eq('id', id)
        .maybeSingle()

    if (error) {
        console.warn('Unable to load manuscript record:', error.message)
        return null
    }
    if (!data) return null

    const { data: resources } = await supabase
        .from('manuscripts')
        .select('pdf_url, reference_text_url')
        .eq('id', id)
        .maybeSingle()
    if (resources) Object.assign(data, resources)

    const manuscript = data as unknown as RawManuscript
    const pages = orderedPages(manuscript.pages)
    const segments = pages.flatMap((page) => orderedSegments(page.segments))
    const catalogItem = toCatalogItem({ ...manuscript, pages, segments })
    const pageRecords = pages.map<ManuscriptPageRecord>((page) => {
        const pageSegments = orderedSegments(page.segments)
        return {
            id: page.id,
            imageUrl: page.image_url,
            orderIndex: page.order_index || 0,
            lineCount: pageSegments.length,
            validatedCount: pageSegments.filter((segment) => segment.status === 'validated').length,
            issueCount: pageSegments.filter((segment) => segment.status === 'conflict' || segment.segmentation_issue_reported).length,
        }
    })

    const qualityChecks = {
        source: Boolean(manuscript.source?.trim()),
        description: Boolean(manuscript.description?.trim()),
        pageImages: pageRecords.some((page) => Boolean(page.imageUrl)),
        referenceText: Boolean(manuscript.reference_text_url),
        validatedData: catalogItem.validatedSegments > 0,
    }
    const passedChecks = Object.values(qualityChecks).filter(Boolean).length

    return {
        ...catalogItem,
        pdfUrl: manuscript.pdf_url ?? null,
        referenceTextUrl: manuscript.reference_text_url ?? null,
        pages: pageRecords,
        qualityChecks,
        qualityScore: Math.round((passedChecks / Object.keys(qualityChecks).length) * 100),
    }
})
