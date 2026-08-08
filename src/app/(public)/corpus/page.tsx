import type { Metadata } from 'next'
import { ManuscriptCatalog } from '@/components/ManuscriptCatalog'
import { getManuscriptCatalog } from '@/lib/manuscripts'

export const metadata: Metadata = {
    title: 'Corpus de manuscrits | Khatt-GPT',
    description: 'Catalogue scientifique du corpus collaboratif de manuscrits arabes de Khatt-GPT.',
}

export default async function PublicCorpusPage({ searchParams }: { searchParams: Promise<{ query?: string }> }) {
    const { query = '' } = await searchParams
    const { manuscripts, summary, available } = await getManuscriptCatalog(query)

    return (
        <div className="px-4 pt-8 sm:px-6">
            <ManuscriptCatalog
                manuscripts={manuscripts}
                summary={summary}
                query={query}
                detailBasePath="/corpus"
                contributorActions={false}
                available={available}
            />
        </div>
    )
}
