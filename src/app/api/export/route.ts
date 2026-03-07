import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import archiver from 'archiver'
import { PassThrough } from 'stream'

export async function GET(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format')

    // Fetch validated transcriptions and their segments
    const { data: records, error } = await supabase
        .from('transcriptions')
        .select(`
      text,
      segments ( image_url, consensus_score )
    `)
        .eq('is_validated', true)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format into flat array for AI training
    const dataset = records.map((r, i) => {
        const seg: any = Array.isArray(r.segments) ? r.segments[0] : r.segments
        const difficulty = seg?.consensus_score ? +(1 - seg.consensus_score).toFixed(2) : 0
        return {
            id: i.toString().padStart(5, '0'),
            image_url: seg?.image_url,
            text: r.text,
            difficulty
        }
    })

    if (format === 'zip') {
        const passThrough = new PassThrough()
        const archive = archiver('zip', { zlib: { level: 9 } })

        archive.on('error', (err) => console.error('Archiver error:', err))
        archive.pipe(passThrough)

        const readableStream = new ReadableStream({
            start(controller) {
                passThrough.on('data', (chunk) => controller.enqueue(chunk))
                passThrough.on('end', () => controller.close())
                passThrough.on('error', (err) => controller.error(err))
            }
        })

            // Process archive asynchronously
            ; (async () => {
                try {
                    let metadataLines = ''
                    for (const item of dataset) {
                        if (item.image_url) {
                            try {
                                const imgRes = await fetch(item.image_url)
                                if (imgRes.ok) {
                                    const ab = await imgRes.arrayBuffer()
                                    const ext = item.image_url.split('.').pop() || 'jpg'
                                    const filename = `images/${item.id}.${ext}`
                                    archive.append(Buffer.from(ab), { name: filename })

                                    metadataLines += JSON.stringify({ file_name: filename, text: item.text, difficulty: item.difficulty }) + '\n'
                                }
                            } catch (e) {
                                console.error('Fetch image fail:', item.image_url)
                            }
                        }
                    }

                    archive.append(metadataLines, { name: 'metadata.jsonl' })
                    archive.append("# Waraka Dataset\nValidated Maghrebi manuscript segments and transcriptions.", { name: 'README.md' })
                    await archive.finalize()
                } catch (err) {
                    console.error("Archive gen err:", err)
                    archive.abort()
                }
            })()

        const filename = `waraka_dataset_${new Date().toISOString().split('T')[0]}.zip`

        await supabase.from('export_logs').insert({
            admin_id: user.id,
            format: 'zip',
            record_count: dataset.length
        })

        return new NextResponse(readableStream as any, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        })
    }

    const filename = `waraka_dataset_${new Date().toISOString().split('T')[0]}.json`
    const jsonDataset = dataset.map(({ id, ...rest }) => rest)

    await supabase.from('export_logs').insert({
        admin_id: user.id,
        format: 'json',
        record_count: dataset.length
    })

    // Return as downloadable file
    return new NextResponse(JSON.stringify(jsonDataset, null, 2), {
        headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${filename}"`
        }
    })
}
