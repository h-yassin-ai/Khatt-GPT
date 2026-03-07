'use client'

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export function AdminRealtimeAlerts() {
    const { toast } = useToast()
    const supabase = createClient()

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
                            title: "⚠️ New Conflict Detected",
                            description: `Segment #${payload.new.order_index} requires manual administrative review.`,
                        })
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, toast])

    return null
}
