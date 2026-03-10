'use client'

import Link from 'next/link'
import { LayoutDashboard, PenLine, User, LogOut, BookOpen, ShieldCheck, GraduationCap, Languages, History, Menu, X, Feather } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import { useState } from 'react'

export function ContributorNav({ email, isAdmin }: { email: string; isAdmin: boolean }) {
    const { lang, setLang, t } = useLanguage()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const NavLinks = ({ onItemClick }: { onItemClick?: () => void }) => (
        <>
            <Link href="/dashboard" onClick={onItemClick} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground/80 hover:text-foreground whitespace-nowrap">
                <LayoutDashboard className="w-4 h-4" /> {t('nav.dashboard')}
            </Link>
            <Link href="/browse" onClick={onItemClick} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground/80 hover:text-foreground whitespace-nowrap">
                <BookOpen className="w-4 h-4" /> {t('nav.browse')}
            </Link>
            <Link href="/transcribe" onClick={onItemClick} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground/80 hover:text-foreground whitespace-nowrap">
                <PenLine className="w-4 h-4" /> {t('nav.transcribe')}
            </Link>
            <Link href="/learn" onClick={onItemClick} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground/80 hover:text-foreground whitespace-nowrap">
                <GraduationCap className="w-4 h-4" /> {t('nav.learn')}
            </Link>
            <Link href="/guide" onClick={onItemClick} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground/80 hover:text-foreground whitespace-nowrap">
                <Feather className="w-4 h-4" /> {t('nav.guide')}
            </Link>
            <Link href="/profile" onClick={onItemClick} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground/80 hover:text-foreground whitespace-nowrap">
                <User className="w-4 h-4" /> {t('nav.profile')}
            </Link>
            <Link href="/contributions" onClick={onItemClick} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground/80 hover:text-foreground whitespace-nowrap">
                <History className="w-4 h-4" /> {t('nav.contributions') || 'Contributions'}
            </Link>
            {isAdmin && (
                <Link href="/admin" onClick={onItemClick} className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-primary hover:text-primary/80 font-bold whitespace-nowrap">
                    <ShieldCheck className="w-4 h-4" /> {t('nav.admin')}
                </Link>
            )}
        </>
    )

    return (
        <div className="container flex h-16 items-center justify-between px-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-2 lg:gap-6">
                <Link href="/dashboard" className="flex items-center gap-1.5 shrink-0">
                    <span className="font-heading text-2xl font-bold text-primary">وراقة</span>
                    <span className="font-heading text-lg lg:text-xl font-semibold hidden sm:inline-block">Khatt-GPT</span>
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
