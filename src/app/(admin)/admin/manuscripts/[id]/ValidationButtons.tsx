'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { validateTranscription } from './actions'
import { ShieldCheck, ShieldAlert, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ValidationButtons({ transcriptionId, isValidated }: { transcriptionId: string, isValidated: boolean }) {
    const [isPending, startTransition] = useTransition()
    const { toast } = useToast()

    const handleValidate = (valid: boolean) => {
        startTransition(async () => {
            const res = await validateTranscription(transcriptionId, valid)
            if (res.error) {
                toast({ title: "Error", description: res.error, variant: "destructive" })
            } else {
                toast({ title: "Updated", description: valid ? "Marked as Validated" : "Removed validation" })
            }
        })
    }

    return (
        <div className="flex items-center gap-2">
            {isValidated ? (
                <Button
                    size="sm"
                    variant="outline"
                    className="text-success border-success/30 hover:bg-success/10 font-medium h-8"
                    onClick={() => handleValidate(false)}
                    disabled={isPending}
                >
                    <Check className="w-4 h-4 mr-1" /> Validated
                </Button>
            ) : (
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 hover:bg-success/10 hover:text-success hover:border-success/30 font-medium"
                    onClick={() => handleValidate(true)}
                    disabled={isPending}
                >
                    <ShieldCheck className="w-4 h-4 mr-1" /> Accept as Valid
                </Button>
            )}
        </div>
    )
}
