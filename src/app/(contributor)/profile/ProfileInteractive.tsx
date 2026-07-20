'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { updateDisplayName, deleteTranscription, updateTranscription } from './actions'
import { Trash2, Edit3, Check, ImageIcon, X, Save, Trophy, Flame, Star, Lock } from 'lucide-react'
import { buildBadgeProgress, getActiveBoosts, getLevelProgress } from '@/lib/gamification'
import { useLanguage } from '@/lib/language-context'

export default function ProfileInteractive({
    profile,
    transcriptions,
    accuracyRate,
    achievements,
}: {
    profile: any
    transcriptions: any[]
    accuracyRate: number | null
    achievements: any[]
}) {
    const { lang, t } = useLanguage()
    const [isEditing, setIsEditing] = useState(false)
    const [editingTId, setEditingTId] = useState<string | null>(null)
    const [editingText, setEditingText] = useState('')
    const [isPending, startTransition] = useTransition()
    const [tList, setTList] = useState(transcriptions)

    const level = getLevelProgress(profile.points || 0)
    const unlockedSlugs = achievements.map((a: any) => a.slug).filter(Boolean)
    const badgeRoadmap = buildBadgeProgress(profile, unlockedSlugs, accuracyRate)
    const boosts = getActiveBoosts(profile.current_streak || 0)
    const nextBadge = badgeRoadmap.find((badge) => !badge.unlocked) || null

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
        if (!confirm(t('profile.delete_confirm'))) return

        setTList((prev) => prev.filter((t) => t.id !== id))

        const res = await deleteTranscription(id)
        if (res.error) {
            alert(res.error)
            window.location.reload()
        }
    }

    const handleSaveEdit = async () => {
        if (!editingTId) return

        startTransition(async () => {
            const res = await updateTranscription(editingTId, editingText)
            if (res.success) {
                setTList((prev) => prev.map((t) => (t.id === editingTId ? { ...t, text: editingText } : t)))
                setEditingTId(null)
            } else {
                alert(res.error)
            }
        })
    }

    return (
        <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-8 px-4 sm:px-6">
            <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                <h2 className="text-2xl font-heading font-semibold mb-6">{t('profile.title')}</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <p className="text-sm text-muted-foreground">{t('profile.username')}</p>
                                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-primary/30">
                                    {level.levelName}
                                </span>
                            </div>
                            <p className="font-mono bg-muted/50 px-3 py-2 rounded-md border border-border/50 inline-block">@{profile.username}</p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">{t('profile.display_name')}</p>
                            {!isEditing ? (
                                <div className="flex items-center gap-4">
                                    <p className="text-lg font-medium">{profile.display_name || profile.username}</p>
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                                        <Edit3 className="w-4 h-4 mr-2" /> {t('profile.edit')}
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
                                        {t('profile.cancel')}
                                    </Button>
                                </form>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="font-semibold flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-primary" /> {t('profile.level')} {level.level}
                                </span>
                                <span className="text-primary font-semibold">{profile.points || 0} XP</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-2">
                                <div className="h-full bg-primary transition-all" style={{ width: `${level.progressPct}%` }} />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {level.nextLevelXp
                                    ? `${level.xpIntoLevel}/${level.xpForNextLevel} ${t('profile.xp_needed')}`
                                    : t('profile.max_level')}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-secondary/10 rounded-xl border border-secondary/20 text-center">
                                <span className="text-xs uppercase tracking-widest font-bold text-secondary-foreground">{t('profile.lines')}</span>
                                <div className="text-3xl font-bold mt-1">{profile.total_contributions || 0}</div>
                            </div>
                            <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 text-center">
                                <span className="text-xs uppercase tracking-widest font-bold text-amber-700 inline-flex items-center gap-1">
                                    <Flame className="w-3.5 h-3.5" /> {t('profile.streak')}
                                </span>
                                <div className="text-3xl font-bold mt-1 text-amber-700">{profile.current_streak || 0}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                <h2 className="text-2xl font-heading font-semibold mb-2">{t('profile.boosts_badges_desc')}</h2>
                <p className="text-sm text-muted-foreground mb-6">{t('profile.boosts_badges_desc')}</p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    <div className="rounded-xl border border-amber-500/20 p-4 bg-amber-500/5">
                        <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">{t('profile.boosts_title')}</p>
                        <div className="flex flex-wrap gap-2">
                            {boosts.length > 0 ? boosts.map((boost) => (
                                <span key={boost.slug} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${boost.isDoubleXp ? 'border-amber-500/40 bg-amber-500/10 text-amber-700' : 'border-primary/30 bg-primary/10 text-primary'}`}>
                                    <Flame className="w-3 h-3" /> {boost.label}
                                </span>
                            )) : <span className="text-xs text-muted-foreground">{t('profile.no_boosts')}</span>}
                        </div>
                    </div>

                    <div className="rounded-xl border border-secondary/20 p-4 bg-secondary/5 lg:col-span-2">
                        <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">{t('profile.next_goal')}</p>
                        {nextBadge ? (
                            <>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-foreground">{nextBadge.name}</span>
                                    <span className="text-xs text-muted-foreground">+{nextBadge.xpReward} XP</span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">{nextBadge.description}</p>
                                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full bg-secondary transition-all" style={{ width: `${nextBadge.progressPct}%` }} />
                                </div>
                                <div className="mt-2 text-xs text-muted-foreground">{nextBadge.currentValue}/{nextBadge.target}</div>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">{t('profile.all_badges_unlocked')}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {badgeRoadmap.map((badge) => (
                        <div key={badge.slug} className={`rounded-lg border p-4 ${badge.unlocked ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-border bg-muted/20'}`}>
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    {badge.unlocked ? <Check className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                                    <span className="font-semibold text-sm truncate">{badge.name}</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground">+{badge.xpReward} XP</span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>
                            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-1">
                                <div className={`h-full ${badge.unlocked ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${badge.progressPct}%` }} />
                            </div>
                            <p className="text-[11px] text-muted-foreground">{badge.currentValue}/{badge.target}</p>
                        </div>
                    ))}
                </div>
            </div>

            {achievements && achievements.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                    <h2 className="text-2xl font-heading font-semibold mb-6 flex items-center gap-2">
                        {t('profile.unlocked_badges')} <span className="text-sm font-normal text-muted-foreground">({achievements.length})</span>
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {achievements.map((a, i) => (
                            <div key={i} className="flex flex-col items-center justify-center p-4 bg-muted/30 border border-border/50 rounded-lg text-center gap-2 hover:bg-muted/50 transition-colors">
                                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-1 border border-primary/20">
                                    <Star className="w-6 h-6" />
                                </div>
                                <span className="font-semibold text-sm">{a.name}</span>
                                <span className="text-xs text-muted-foreground">{a.description}</span>
                                <span className="text-[10px] text-primary/70 font-mono mt-1">+{a.points} pts</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                <h2 className="text-2xl font-heading font-semibold mb-6">{t('profile.history')}</h2>

                {tList.length === 0 ? (
                    <p className="text-muted-foreground">{t('profile.no_history')}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                                <tr>
                                    <th className="px-4 py-3 font-medium">{t('profile.table_segment')}</th>
                                    <th className="px-4 py-3 font-medium">{t('profile.table_text')}</th>
                                    <th className="px-4 py-3 font-medium">{t('profile.table_date')}</th>
                                    <th className="px-4 py-3 font-medium">{t('profile.table_status')}</th>
                                    <th className="px-4 py-3 font-medium text-right">{t('profile.table_actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tList.map((tItem) => (
                                    <tr key={tItem.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-3 align-top min-w-[200px]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded border border-border overflow-hidden flex-shrink-0 bg-muted">
                                                    {tItem.segments?.image_url ? (
                                                        <img src={tItem.segments.image_url || undefined} alt="segment" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ImageIcon className="w-5 h-5 text-muted-foreground opacity-30" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-xs text-primary">{tItem.segments?.manuscripts?.title || 'Unknown'}</span>
                                                    <span className="text-xs text-muted-foreground">Order: #{tItem.segments?.order_index || 0}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 align-top w-full max-w-[300px]">
                                            {editingTId === tItem.id ? (
                                                <div className="flex flex-col gap-2">
                                                    <textarea
                                                        value={editingText}
                                                        onChange={(e) => setEditingText(e.target.value)}
                                                        className="w-full font-arabic text-lg p-2 border border-primary rounded bg-primary/5 min-h-[80px] focus:ring-1 focus:ring-primary outline-none"
                                                        dir="rtl"
                                                    />
                                                    <div className="flex gap-2 justify-end">
                                                        <Button size="sm" onClick={handleSaveEdit} disabled={isPending}>
                                                            <Save className="w-3.5 h-3.5 mr-1" /> {t('transcribe.save_edit')}
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={() => setEditingTId(null)}>
                                                            <X className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="font-arabic text-lg" dir="rtl">{tItem.text}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 align-top text-muted-foreground whitespace-nowrap">
                                            {new Date(tItem.submitted_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            {tItem.is_validated ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/20 text-success">
                                                    {t('profile.status_validated')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                                    {t('profile.status_pending')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                                            {!tItem.is_validated && editingTId !== tItem.id && (
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-primary hover:bg-primary/10"
                                                        onClick={() => {
                                                            setEditingTId(tItem.id)
                                                            setEditingText(tItem.text)
                                                        }}
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDelete(tItem.id)}
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
