'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import JSZip from 'jszip'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@/utils/supabase/client'
import { bulkInsertPagesWithSegments } from './pages/actions'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { UploadCloud, FileArchive, X, Loader2 } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'

interface BulkUploadPagesModalProps {
    manuscriptId: string
    currentMaxOrder: number
}

export default function BulkUploadPagesModal({ manuscriptId, currentMaxOrder }: BulkUploadPagesModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [statusText, setStatusText] = useState('')
    const router = useRouter()
    const { toast } = useToast()
    const { t, lang } = useLanguage()
    const supabase = useMemo(() => createClient(), [])

    const parsePolygonFromXML = async (zip: JSZip, xmlPath: string, segmentFileName?: string) => {
        try {
            const xmlText = await zip.files[xmlPath].async('string')
            const parser = new DOMParser()
            const xmlDoc = parser.parseFromString(xmlText, "text/xml")

            let selectedLine = null

            // 1. Precise matching using index from filename (e.g. page_1_line_5.png -> index="5")
            if (segmentFileName) {
                const fileName = segmentFileName.split('/').pop() || ""
                const lineMatch = fileName.match(/line_(\d+)/i)
                if (lineMatch) {
                    const indexVal = lineMatch[1]
                    selectedLine = xmlDoc.querySelector(`line[index="${indexVal}"], TextLine[index="${indexVal}"]`)
                }

                // Fallback to ID matching if index didn't work
                if (!selectedLine) {
                    const pureName = fileName.split('.').shift()
                    selectedLine = xmlDoc.querySelector(`[id*="${pureName}"], [ID*="${pureName}"]`)
                }
            }

            // 2. Extract coordinates
            const lineElement = selectedLine || xmlDoc.querySelector('line') || xmlDoc.querySelector('TextLine')
            const polygonElement = lineElement?.querySelector('polygon') || lineElement?.querySelector('Polygon') || lineElement?.querySelector('Coords')

            if (polygonElement) {
                const pointsAttr = polygonElement.getAttribute('points') || polygonElement.getAttribute('POINTS')
                if (pointsAttr) {
                    // Normalize the points string: replace commas with spaces, then filter empty strings
                    const coords = pointsAttr.replace(/,/g, ' ').trim().split(/\s+/).map(Number).filter(n => !isNaN(n))

                    // Group into {x, y} pairs
                    const pairs = []
                    for (let i = 0; i < coords.length; i += 2) {
                        if (i + 1 < coords.length) {
                            pairs.push({ x: coords[i], y: coords[i + 1] })
                        }
                    }
                    return pairs.length > 0 ? pairs : null
                }
            }
            return null
        } catch (e) {
            console.error("Error parsing XML:", e)
            return null
        }
    }

    const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        setProgress(0)
        setStatusText(t('admin.reading_zip'))

        try {
            const zip = new JSZip()
            const contents = await zip.loadAsync(file)
            const allFiles = Object.keys(contents.files).filter(name => {
                const basename = name.split('/').pop() || ''
                return !basename.startsWith('.') && !name.includes('__MACOSX')
            })

            // Group files by folder
            const folderGroups: Record<string, string[]> = {}
            allFiles.forEach(name => {
                if (contents.files[name].dir) return
                const parts = name.split('/')
                if (parts.length > 1) {
                    const folder = parts[0]
                    if (!folderGroups[folder]) folderGroups[folder] = []
                    folderGroups[folder].push(name)
                } else {
                    // Files in root (if any)
                    if (!folderGroups['root']) folderGroups['root'] = []
                    folderGroups['root'].push(name)
                }
            })

            const folders = Object.keys(folderGroups).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
            const fullSubmissionData: any[] = []

            let currentOrder = currentMaxOrder

            for (const folder of folders) {
                const files = folderGroups[folder]

                // 1. Find Page Image (The one not having "line" in name, or the shortest name, or strictly "page.png")
                const images = files
                    .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
                    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
                if (images.length === 0) continue

                // Heuristic: the shortest name or exactly named folder name .png is the main page
                const mainPageImage = images.reduce((a, b) => a.split('/').pop()!.length <= b.split('/').pop()!.length ? a : b)
                const segmentImages = images
                    .filter(f => f !== mainPageImage)
                    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

                setStatusText(t('admin.processing_folder', { folder }))

                // Upload Page Image
                const pageBlob = await contents.files[mainPageImage].async('blob')
                const pageExt = mainPageImage.split('.').pop()
                const pagePath = `${manuscriptId}/pages/${uuidv4()}.${pageExt}`
                const { error: pageUploadError } = await supabase.storage.from('manuscripts').upload(pagePath, pageBlob)
                if (pageUploadError) throw new Error(`Could not upload ${mainPageImage}: ${pageUploadError.message}`)
                const { data: { publicUrl: pageUrl } } = supabase.storage.from('manuscripts').getPublicUrl(pagePath)

                currentOrder++
                const pageRecord = {
                    image_url: pageUrl,
                    order_index: currentOrder,
                    label: folder
                }

                // Process Segments
                const segments: any[] = []
                for (let i = 0; i < segmentImages.length; i++) {
                    const segImgPath = segmentImages[i]
                    const segBaseName = segImgPath.split('.').slice(0, -1).join('.')
                    const xmlPath = files.find(f => f.startsWith(segBaseName) && f.endsWith('.xml'))

                    const segBlob = await contents.files[segImgPath].async('blob')
                    const segExt = segImgPath.split('.').pop()
                    const segStoragePath = `${manuscriptId}/segments/${uuidv4()}.${segExt}`

                    const { error: segmentUploadError } = await supabase.storage.from('manuscripts').upload(segStoragePath, segBlob)
                    if (segmentUploadError) throw new Error(`Could not upload ${segImgPath}: ${segmentUploadError.message}`)
                    const { data: { publicUrl: segUrl } } = supabase.storage.from('manuscripts').getPublicUrl(segStoragePath)

                    // Try segment-specific XML first, then fall back to a "page" XML from the same folder
                    let activeXmlPath = xmlPath
                    if (!activeXmlPath) {
                        activeXmlPath = files.find(f => !f.includes('line') && f.endsWith('.xml'))
                    }

                    const polygon = activeXmlPath ? await parsePolygonFromXML(contents, activeXmlPath, segImgPath) : null

                    segments.push({
                        image_url: segUrl,
                        order_index: i + 1,
                        polygon: polygon
                    })
                }

                fullSubmissionData.push({
                    page: pageRecord,
                    segments: segments
                })

                setProgress(Math.round((fullSubmissionData.length / folders.length) * 100))
            }

            if (fullSubmissionData.length > 0) {
                setStatusText(t('admin.saving_database'))
                const res = await bulkInsertPagesWithSegments(manuscriptId, fullSubmissionData)
                if (res.error) throw new Error(res.error)

                toast({ title: t('admin.success'), description: t('admin.upload_summary', { pages: fullSubmissionData.length, segments: fullSubmissionData.reduce((acc, p) => acc + p.segments.length, 0) }) })
                setIsOpen(false)
                router.refresh()
            } else {
                throw new Error(t('admin.no_valid_zip'))
            }

        } catch (err: any) {
            console.error(err)
            toast({ title: t('admin.upload_failed'), description: err.message, variant: 'destructive' })
        } finally {
            setUploading(false)
            setProgress(0)
            setStatusText('')
        }
    }

    if (!isOpen) {
        return (
            <Button onClick={() => setIsOpen(true)} variant="outline" className="gap-2">
                <FileArchive className="w-4 h-4" />
                {t('admin.bulk_upload')}
            </Button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 flex flex-col gap-6 relative animate-in zoom-in-95 duration-200" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <button
                    onClick={() => !uploading && setIsOpen(false)}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-semibold">{t('admin.bulk_title')}</h2>
                    <p className="text-sm text-muted-foreground">{t('admin.bulk_desc')}</p>
                </div>

                {!uploading ? (
                    <div className="border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors rounded-xl p-10 flex flex-col items-center justify-center text-center relative cursor-pointer">
                        <input
                            type="file"
                            accept=".zip"
                            onChange={handleZipUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <UploadCloud className="w-10 h-10 text-primary/60 mb-4" />
                        <p className="font-medium text-primary">{t('admin.select_zip')}</p>
                        <p className="text-xs text-muted-foreground mt-2">{t('admin.max_recommended')}</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 py-6 text-center">
                        <div className="flex justify-center">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <p className="font-medium">{statusText}</p>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">{t('admin.complete', { count: progress })}</p>
                        </div>
                    </div>
                )}

                <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    disabled={uploading}
                    className="w-full"
                >
                    {t('admin.cancel')}
                </Button>
            </div>
        </div>
    )
}
