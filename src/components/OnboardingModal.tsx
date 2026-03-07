"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BookOpen, PenTool, Award, ArrowRight, PanelLeftOpen } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export function OnboardingModal() {
    const [open, setOpen] = useState(false)
    const { t } = useLanguage()

    useEffect(() => {
        const hasSeen = localStorage.getItem("waraka_onboarding_seen")
        if (!hasSeen) {
            setOpen(true)
        }
    }, [])

    const handleClose = () => {
        setOpen(false)
        localStorage.setItem("waraka_onboarding_seen", "true")
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[620px] border-border bg-[#FAF7F2]">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-3xl font-heading text-primary font-bold">
                        {t('onboarding.title')}
                    </DialogTitle>
                    <DialogDescription className="text-base text-muted-foreground mt-2">
                        {t('onboarding.description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 py-2">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-1">
                            <BookOpen className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-lg text-foreground">{t('onboarding.step1.title')}</h4>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {t('onboarding.step1.desc')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center shrink-0 mt-1">
                            <PenTool className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-lg text-foreground">{t('onboarding.step2.title')}</h4>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {t('onboarding.step2.desc')}
                            </p>
                        </div>
                    </div>

                    {/* Open Panel explanation */}
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center shrink-0 mt-1">
                            <PanelLeftOpen className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-lg text-foreground">{t('onboarding.step3.title')}</h4>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {t('onboarding.step3.desc')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center shrink-0 mt-1">
                            <Award className="w-6 h-6 text-success" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-lg text-foreground">{t('onboarding.step4.title')}</h4>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {t('onboarding.step4.desc')}
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-6">
                    <Button onClick={handleClose} className="w-full sm:w-auto px-8 gap-2 text-md py-6 shadow-md rounded-full">
                        {t('onboarding.start')} <ArrowRight className="w-4 h-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
