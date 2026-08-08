import { ManuscriptCatalog } from '@/components/ManuscriptCatalog'
import { getManuscriptCatalog } from '@/lib/manuscripts'

export default async function BrowsePage({ searchParams }: { searchParams: Promise<{ query?: string }> }) {
    const { query = '' } = await searchParams
    const { manuscripts, summary, available } = await getManuscriptCatalog(query)

    return (
        <ManuscriptCatalog
            manuscripts={manuscripts}
            summary={summary}
            query={query}
            detailBasePath="/browse"
            contributorActions
            available={available}
        />
    )
}
