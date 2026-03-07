'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { updateDisplayName, deleteTranscription, updateTranscription } from './actions'
import { Trash2, Edit3, Check, ImageIcon, X, Save } from 'lucide-react'

// Wrapping in a client component to handle the form and delete logic
// Normally this would be split: Server Component fetches data, passes to Client Component
// For this MVP, we will assume it's imported into a Page that fetches data.
// Since Next13+, we can just make the page a server component and import a client component for the interactive parts,
// or do all fetching here in a `useEffect`. Let's assume this is imported by `page.tsx`.

export default function ProfileInteractive({
    profile,
    transcriptions,
    accuracyRate,
    achievements
}: {
    profile: any,
    transcriptions: any[],
    accuracyRate: number | null,
    achievements: any[]
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [editingTId, setEditingTId] = useState<string | null>(null)
    const [editingText, setEditingText] = useState('')
    const [isPending, startTransition] = useTransition()

    // Minimal optimistic UI / client state
    const [tList, setTList] = useState(transcriptions)

    const handleUpdateName = async (formData: FormData) => {
        startTransition(async () => {
            const res = await updateDisplayName(formData)
            if (res.success) {
                setIsEditing(false)
            } else {
                alert(res.error)
            }
        })
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this transcription?")) return

        // optimistic
        setTList(prev => prev.filter(t => t.id !== id))

        const res = await deleteTranscription(id)
        if (res.error) {
            alert(res.error)
            // revert on error -> reload page
            window.location.reload()
        }
    }

    const handleSaveEdit = async () => {
        if (!editingTId) return

        startTransition(async () => {
            const res = await updateTranscription(editingTId, editingText)
            if (res.success) {
                setTList(prev => prev.map(t => t.id === editingTId ? { ...t, text: editingText } : t))
                setEditingTId(null)
            } else {
                alert(res.error)
            }
        })
    }

    return (
        <div className="flex flex-col gap-12 w-full max-w-5xl mx-auto py-8">

            {/* Profile Header */}
            <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                <h2 className="text-2xl font-heading font-semibold mb-6">Profile Settings</h2>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-1 space-y-4 w-full">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <p className="text-sm text-muted-foreground">Username (Public)</p>
                                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-primary/30">
                                    {profile.points < 100 ? 'Novice' : profile.points < 500 ? 'Apprenti' : profile.points < 2000 ? 'Scribe' : 'Maître Copiste'}
                                </span>
                            </div>
                            <p className="font-mono bg-muted/50 px-3 py-2 rounded-md border border-border/50 inline-block">@{profile.username}</p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Display Name</p>
                            {!isEditing ? (
                                <div className="flex items-center gap-4">
                                    <p className="text-lg font-medium">{profile.display_name || profile.username}</p>
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                                        <Edit3 className="w-4 h-4 mr-2" /> Edit
                                    </Button>
                                </div>
                            ) : (
                                <form action={handleUpdateName} className="flex items-center gap-2 max-w-sm">
                                    <input
                                        name="displayName"
                                        defaultValue={profile.display_name}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        required
                                        minLength={2}
                                    />
                                    <Button type="submit" disabled={isPending}>
                                        {isPending ? '...' : <Check className="w-4 h-4" />}
                                    </Button>
                                    <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                                        Cancel
                                    </Button>
                                </form>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 min-w-[300px]">
                        <div className="flex-1 flex flex-col gap-2 p-6 bg-secondary/10 rounded-xl border border-secondary/20 text-center">
                            <span className="text-xs text-secondary-foreground uppercase tracking-widest font-bold">Translated</span>
                            <span className="text-4xl font-sans font-bold text-primary">{profile.total_contributions}</span>
                        </div>
                        {accuracyRate !== null && (
                            <div className="flex-1 flex flex-col gap-2 p-6 bg-primary/10 rounded-xl border border-primary/20 text-center">
                                <span className="text-xs text-primary uppercase tracking-widest font-bold">Accuracy</span>
                                <span className="text-4xl font-sans font-bold text-primary">{accuracyRate}%</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Achievements Section */}
            {achievements && achievements.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                    <h2 className="text-2xl font-heading font-semibold mb-6 flex items-center gap-2">
                        Unlocked Badges <span className="text-sm font-normal text-muted-foreground">({achievements.length})</span>
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {achievements.map((a, i) => (
                            <div key={i} className="flex flex-col items-center justify-center p-4 bg-muted/30 border border-border/50 rounded-lg text-center gap-2 hover:bg-muted/50 transition-colors">
                                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-1 border border-primary/20">
                                    <Check className="w-6 h-6" /> {/* Default icon, assuming lucide mapped dynamically or generic used */}
                                </div>
                                <span className="font-semibold text-sm">{a.name_fr}</span>
                                <span className="text-xs text-muted-foreground">{a.description_fr}</span>
                                <span className="text-[10px] text-primary/70 font-mono mt-1">+{a.points} pts</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Transcriptions History */}
            <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                <h2 className="text-2xl font-heading font-semibold mb-6">Your Transcriptions</h2>

                {tList.length === 0 ? (
                    <p className="text-muted-foreground">You haven&apos;t made any transcriptions yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Segment</th>
                                    <th className="px-4 py-3 font-medium">Text</th>
                                    <th className="px-4 py-3 font-medium">Date</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tList.map((t) => (
                                    <tr key={t.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-3 align-top min-w-[200px]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded border border-border overflow-hidden flex-shrink-0 bg-muted">
                                                    {t.segments?.image_url ? (
                                                        <img src={t.segments.image_url || undefined} alt="segment" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ImageIcon className="w-5 h-5 text-muted-foreground opacity-30" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-xs text-primary">{t.segments?.manuscripts?.title || 'Unknown'}</span>
                                                    <span className="text-xs text-muted-foreground">Order: #{t.segments?.order_index || 0}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 align-top w-full max-w-[300px]">
                                            {editingTId === t.id ? (
                                                <div className="flex flex-col gap-2">
                                                    <textarea
                                                        value={editingText}
                                                        onChange={(e) => setEditingText(e.target.value)}
                                                        className="w-full font-arabic text-lg p-2 border border-primary rounded bg-primary/5 min-h-[80px] focus:ring-1 focus:ring-primary outline-none"
                                                        dir="rtl"
                                                    />
                                                    <div className="flex gap-2 justify-end">
                                                        <Button size="sm" onClick={handleSaveEdit} disabled={isPending}>
                                                            <Save className="w-3.5 h-3.5 mr-1" /> Enregistrer
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={() => setEditingTId(null)}>
                                                            <X className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="font-arabic text-lg" dir="rtl">{t.text}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 align-top text-muted-foreground whitespace-nowrap">
                                            {new Date(t.submitted_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            {t.is_validated ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/20 text-success">
                                                    Validated
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                                            {!t.is_validated && editingTId !== t.id && (
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-primary hover:bg-primary/10"
                                                        onClick={() => {
                                                            setEditingTId(t.id)
                                                            setEditingText(t.text)
                                                        }}
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDelete(t.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    )
}
