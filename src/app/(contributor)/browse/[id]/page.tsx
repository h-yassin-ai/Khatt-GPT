import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ManuscriptResearchRecord } from '@/components/ManuscriptResearchRecord'
import { getManuscriptRecord } from '@/lib/manuscripts'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const manuscript = await getManuscriptRecord(id)
    return manuscript
        ? { title: `${manuscript.title} | Khatt-GPT`, description: manuscript.description || 'Notice scientifique du manuscrit.' }
        : { title: 'Manuscrit introuvable | Khatt-GPT' }
}

export default async function ContributorManuscriptRecordPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const manuscript = await getManuscriptRecord(id)
    if (!manuscript) notFound()

    return <ManuscriptResearchRecord record={manuscript} backHref="/browse" contributorActions />
}
