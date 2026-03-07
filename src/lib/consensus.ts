import { createClient } from '@/utils/supabase/server'

// Simple Levenshtein distance calculation
export function levenshteinDistance(s1: string, s2: string): number {
    if (s1.length === 0) return s2.length
    if (s2.length === 0) return s1.length

    const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null))

    for (let i = 0; i <= s1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= s2.length; j++) matrix[j][0] = j

    for (let j = 1; j <= s2.length; j++) {
        for (let i = 1; i <= s1.length; i++) {
            const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1, // deletion
                matrix[j - 1][i] + 1, // insertion
                matrix[j - 1][i - 1] + indicator // substitution
            )
        }
    }
    return matrix[s2.length][s1.length]
}

export function computeSimilarity(s1: string, s2: string): number {
    const distance = levenshteinDistance(s1, s2)
    const maxLength = Math.max(s1.length, s2.length)
    if (maxLength === 0) return 1.0
    return 1 - (distance / maxLength)
}

export function normalizeText(text: string): string {
    if (!text) return ''
    // Basic normalization for Arabic text
    return text
        .trim()
        .replace(/\s+/g, ' ')
        // Normalize forms of Alef
        .replace(/[أإآ]/g, 'ا')
        // Remove tatweel
        .replace(/ـ/g, '')
}

export async function computeConsensus(segmentId: string) {
    const supabase = await createClient()

    // Fetch segment details
    const { data: segment } = await supabase
        .from('segments')
        .select('id, min_transcriptions, status')
        .eq('id', segmentId)
        .single()

    if (!segment) return { error: "Segment not found" }
    if (segment.status === 'validated' || segment.status === 'conflict') return { success: true, reason: 'already processed' }

    // Fetch all transcriptions for this segment
    const { data: transcriptions } = await supabase
        .from('transcriptions')
        .select('id, text, contributor_id')
        .eq('segment_id', segmentId)

    if (!transcriptions || transcriptions.length < segment.min_transcriptions) {
        return { success: true, reason: 'not enough transcriptions' }
    }

    // Normalize
    const items = transcriptions.map(t => ({
        ...t,
        normalizedText: normalizeText(t.text)
    }))

    const n = items.length
    let validPairs = 0
    const totalPairs = (n * (n - 1)) / 2

    // Pairwise similarity
    const similarities: number[][] = Array(n).fill(null).map(() => Array(n).fill(0))
    const averageDistances = Array(n).fill(0)

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const sim = computeSimilarity(items[i].normalizedText, items[j].normalizedText)
            similarities[i][j] = sim
            similarities[j][i] = sim
            if (sim > 0.85) {
                validPairs++
            }
        }
    }

    const consensusRatio = validPairs / totalPairs

    if (consensusRatio >= (2 / 3)) {
        // We have consensus
        // Find the most "central" transcription (highest average similarity to others)
        let bestIdx = 0
        let maxAvgSim = -1

        for (let i = 0; i < n; i++) {
            let sumSim = 0
            for (let j = 0; j < n; j++) {
                if (i !== j) sumSim += similarities[i][j]
            }
            const avgSim = sumSim / (n - 1)
            averageDistances[i] = avgSim
            if (avgSim > maxAvgSim) {
                maxAvgSim = avgSim
                bestIdx = i
            }
        }

        const bestTranscription = items[bestIdx]

        await supabase.from('segments').update({
            consensus_text: bestTranscription.text, // keep original text of best match
            consensus_score: maxAvgSim,
            consensus_reached_at: new Date().toISOString(),
            status: 'validated'
        }).eq('id', segmentId)

        // Mark that winning transcription as validated
        await supabase.from('transcriptions')
            .update({ is_validated: true })
            .eq('id', bestTranscription.id)

        return { success: true, result: 'validated' }
    } else {
        // Conflict
        await supabase.from('segments').update({
            status: 'conflict'
        }).eq('id', segmentId)

        return { success: true, result: 'conflict' }
    }
}
