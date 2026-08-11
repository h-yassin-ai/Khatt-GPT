'use client'

import { useState } from 'react'
import { toggleUserSuspension } from './actions'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/lib/language-context'
import { 
    ShieldAlert, ShieldCheck, Search,
    MoreHorizontal, Ban, UserCheck
} from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Profile = {
    id: string
    username: string
    display_name: string | null
    email: string | null
    points: number
    total_contributions: number
    current_streak: number
    is_suspended: boolean
    created_at: string
}

export default function UsersPageClient({ initialUsers }: { initialUsers: Profile[] }) {
    const [users, setUsers] = useState(initialUsers)
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState<string | null>(null)
    const { toast } = useToast()
    const { t, lang } = useLanguage()

    const filteredUsers = users.filter(u => 
        u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    )

    const handleToggleSuspension = async (userId: string, currentStatus: boolean) => {
        const action = currentStatus ? t('admin.reactivate_action') : t('admin.suspend_action')
        if (!confirm(t('admin.suspend_confirm', { action }))) return

        setLoading(userId)
        const result = await toggleUserSuspension(userId, !currentStatus)
        
        if (result.success) {
            setUsers(prev => prev.map(u => 
                u.id === userId ? { ...u, is_suspended: !currentStatus } : u
            ))
            toast({
                title: currentStatus ? t('admin.user_reactivated') : t('admin.user_suspended'),
                description: t('admin.user_access_updated', { username: users.find(u => u.id === userId)?.username || '' })
            })
        } else {
            toast({
                title: t('common.error'),
                description: result.error,
                variant: "destructive"
            })
        }
        setLoading(null)
    }

    return (
        <div className="space-y-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex items-center gap-2 max-w-sm">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder={t('admin.search_users')}
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    className="h-9"
                />
            </div>

            <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-[200px]">{t('admin.user')}</TableHead>
                            <TableHead>{t('admin.email')}</TableHead>
                            <TableHead className="text-right">{t('admin.points')}</TableHead>
                            <TableHead className="text-right">{t('admin.contributions')}</TableHead>
                            <TableHead>{t('admin.status')}</TableHead>
                            <TableHead className="w-[100px] text-right">{t('admin.actions_menu')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id} className={user.is_suspended ? "opacity-60 grayscale-[0.5]" : ""}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{user.display_name || user.username}</span>
                                            <span className="text-xs text-muted-foreground">@{user.username}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">{user.email || "—"}</TableCell>
                                    <TableCell className="text-right font-mono">{user.points}</TableCell>
                                    <TableCell className="text-right font-mono">{user.total_contributions}</TableCell>
                                    <TableCell>
                                        {user.is_suspended ? (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold border border-destructive/20">
                                                <ShieldAlert className="w-3 h-3" /> {t('admin.suspended')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-[10px] font-bold border border-green-500/20">
                                                <ShieldCheck className="w-3 h-3" /> {t('admin.active')}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={loading === user.id}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>{t('admin.actions_menu')}</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                                                    {t('admin.copy_user_id')}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    onClick={() => handleToggleSuspension(user.id, user.is_suspended)}
                                                    className={user.is_suspended ? "text-green-600" : "text-destructive"}
                                                >
                                                    {user.is_suspended ? (
                                                        <><UserCheck className="w-4 h-4 mr-2" /> {t('admin.reactivate')}</>
                                                    ) : (
                                                        <><Ban className="w-4 h-4 mr-2" /> {t('admin.suspend')}</>
                                                    )}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    {t('admin.no_users')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
