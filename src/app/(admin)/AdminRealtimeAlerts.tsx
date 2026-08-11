'use client'

import { useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/lib/language-context'

export function AdminRealtimeAlerts() {
    const { toast } = useToast()
    const { t } = useLanguage()
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        const channel = supabase.channel('admin-alerts')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'segments',
                    filter: "status=eq.conflict"
                },
                (payload) => {
                    if (payload.old.status !== 'conflict') {
                        toast({
                            title: t('admin.new_conflict'),
                            description: t('admin.segment_requires_review', { count: payload.new.order_index }),
                        })
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, t, toast])

    return null
}
