'use client'

import Link from 'next/link'
import { LayoutDashboard, PenLine, User, LogOut, BookOpen, ShieldCheck, GraduationCap, Languages, History, Menu, X, Feather, ChevronDown, Shuffle } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import { useState } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

export function ContributorNav({ email, isAdmin, isFullWidth = false }: { email: string; isAdmin: boolean; isFullWidth?: boolean }) {
    const { lang, setLang, t } = useLanguage()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const NavLinks = ({ onItemClick }: { onItemClick?: () => void }) => (
        <>
            <Link href="/dashboard" onClick={onItemClick} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground/80 hover:text-foreground whitespace-nowrap">
                <LayoutDashboard className="w-4 h-4" /> {t('nav.dashboard')}
            </Link>
            <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground/80 hover:text-foreground whitespace-nowrap outline-none">
                    <PenLine className="w-4 h-4" /> {t('nav.transcribe')} <ChevronDown className="w-3 h-3 opacity-50" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem asChild>
                        <Link href="/transcribe" onClick={onItemClick} className="flex w-full items-center gap-2 cursor-pointer">
                            <Shuffle className="w-4 h-4 text-primary" /> Aléatoire
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/browse" onClick={onItemClick} className="flex w-full items-center gap-2 cursor-pointer">
                            <BookOpen className="w-4 h-4 text-emerald-600" /> Choisir un manuscrit
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/learn" onClick={onItemClick} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground/80 hover:text-foreground whitespace-nowrap">
                <GraduationCap className="w-4 h-4" /> {t('nav.learn')}
            </Link>
            <Link href="/guide" onClick={onItemClick} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground/80 hover:text-foreground whitespace-nowrap">
                <Feather className="w-4 h-4" /> {t('nav.guide')}
            </Link>
            
            <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground/80 hover:text-foreground whitespace-nowrap outline-none">
                    <User className="w-4 h-4" /> <ChevronDown className="w-3 h-3 opacity-50" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">

                    <DropdownMenuItem asChild>
                        <Link href="/profile" onClick={onItemClick} className="flex w-full items-center gap-2 cursor-pointer">
                            <User className="w-4 h-4" /> {t('nav.profile')}
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/contributions" onClick={onItemClick} className="flex w-full items-center gap-2 cursor-pointer">
                            <History className="w-4 h-4" /> {t('nav.contributions') || 'Contributions'}
                        </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/admin" onClick={onItemClick} className="flex w-full items-center gap-2 text-primary font-bold cursor-pointer">
                                    <ShieldCheck className="w-4 h-4" /> {t('nav.admin')}
                                </Link>
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )

    return (
        <div className={`flex h-16 items-center justify-between px-6 mx-auto ${isFullWidth ? 'w-full max-w-none' : 'container max-w-7xl'}`}>
            <div className="flex items-center gap-2 lg:gap-6">
                <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
                    <span className="font-heading text-xl lg:text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary via-primary/90 to-amber-600 drop-shadow-sm">Khatt-GPT</span>
                </Link>
                <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 text-[13px] lg:text-sm font-medium">
                    <NavLinks />
                </nav>
            </div>
            <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground hidden lg:block">
                    {email}
                </div>
                <button
                    onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
                    className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
                >
                    <Languages className="w-3.5 h-3.5" />
                    <span className="whitespace-nowrap">{t('nav.lang_toggle')}</span>
                </button>
                <div className="hidden md:block">
                    <form action="/auth/signout" method="post">
                        <button type="submit" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm font-medium">
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline-block">{t('nav.signout')}</span>
                        </button>
                    </form>
                </div>

                {/* Mobile Toggle */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 rounded-md hover:bg-muted text-foreground/80"
                >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="absolute top-16 left-0 right-0 z-50 bg-background border-b border-border shadow-xl md:hidden animate-in slide-in-from-top duration-200">
                    <div className="flex flex-col p-4 gap-2">
                        <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">{email}</div>
                        <NavLinks onItemClick={() => setMobileMenuOpen(false)} />
                        <hr className="my-2 border-border" />
                        <form action="/auth/signout" method="post" className="w-full">
                            <button type="submit" className="w-full flex items-center gap-2 px-3 py-3 text-sm font-medium rounded-md text-destructive hover:bg-destructive/10">
                                <LogOut className="w-4 h-4" /> {t('nav.signout')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
