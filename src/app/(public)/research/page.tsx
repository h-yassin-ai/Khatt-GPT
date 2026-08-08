import type { Metadata } from 'next'
import { getManuscriptCatalog } from '@/lib/manuscripts'
import { ResearchPageClient } from './ResearchPageClient'

export const metadata: Metadata = {
    title: 'Méthodologie & recherche | Khatt-GPT',
    description: 'Méthodologie de segmentation, transcription collaborative, consensus, validation et réutilisation du corpus Khatt-GPT.',
}

export default async function ResearchPage() {
    const { summary, available } = await getManuscriptCatalog()
    return <ResearchPageClient summary={summary} summaryAvailable={available} />
}
