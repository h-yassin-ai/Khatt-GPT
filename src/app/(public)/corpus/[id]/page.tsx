import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ManuscriptResearchRecord } from '@/components/ManuscriptResearchRecord'
import { getManuscriptRecord } from '@/lib/manuscripts'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const manuscript = await getManuscriptRecord(id)
    return manuscript
        ? {
            title: `${manuscript.title} | Corpus Khatt-GPT`,
            description: manuscript.description || `Notice scientifique ${manuscript.source || 'du corpus Khatt-GPT'}.`,
        }
        : { title: 'Manuscrit introuvable | Khatt-GPT' }
}

export default async function PublicManuscriptRecordPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const manuscript = await getManuscriptRecord(id)
    if (!manuscript) notFound()

    return (
        <div className="px-4 pt-8 sm:px-6">
            <ManuscriptResearchRecord record={manuscript} backHref="/corpus" contributorActions={false} />
        </div>
    )
}
