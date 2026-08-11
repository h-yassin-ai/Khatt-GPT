'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { RefreshCw } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'

export default function AnalyticsPage() {
    const supabase = useMemo(() => createClient(), [])
    const { t, lang } = useLanguage()
    const [loading, setLoading] = useState(true)

    const [dailyData, setDailyData] = useState<any[]>([])
    const [statusData, setStatusData] = useState<any[]>([])
    const [topUsers, setTopUsers] = useState<any[]>([])

    const fetchAnalytics = useCallback(async () => {
        setLoading(true)

        // 1. Fetch transcriptions for chronological data
        const { data: transcriptions } = await supabase
            .from('transcriptions')
            .select('created_at, is_validated')
            .order('created_at', { ascending: true })

        if (transcriptions) {
            // Group by Date
            const grouped = transcriptions.reduce((acc: any, curr) => {
                const date = new Date(curr.created_at).toLocaleDateString()
                if (!acc[date]) {
                    acc[date] = { date, total: 0, validated: 0 }
                }
                acc[date].total += 1
                if (curr.is_validated) acc[date].validated += 1
                return acc
            }, {})

            setDailyData(Object.values(grouped))
        }

        // 2. Fetch segment status for pie chart
        const { data: segments } = await supabase
            .from('segments')
            .select('status')

        if (segments) {
            const counts = segments.reduce((acc: any, curr) => {
                acc[curr.status] = (acc[curr.status] || 0) + 1
                return acc
            }, {})

            setStatusData([
                { name: t('admin.status_pending'), value: counts['pending'] || 0 },
                { name: t('admin.status_validated'), value: counts['validated'] || 0 },
                { name: t('admin.status_conflict'), value: (counts['conflict'] || 0) + (counts['flagged'] || 0) }
            ])
        }

        // 3. Top Users by points
        const { data: profiles } = await supabase
            .from('profiles')
            .select('username, points')
            .order('points', { ascending: false })
            .limit(5)

        if (profiles) {
            setTopUsers(profiles)
        }

        setLoading(false)
    }, [supabase, t])

    useEffect(() => {
        fetchAnalytics()
    }, [fetchAnalytics])

    return (
        <div className="flex flex-col gap-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-heading font-semibold text-foreground">{t('admin.analytics_title')}</h1>
                <button
                    onClick={fetchAnalytics}
                    disabled={loading}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {t('admin.refresh_data')}
                </button>
            </div>

            {loading && dailyData.length === 0 ? (
                <div className="flex justify-center py-20">
                    <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Transcriptions Over Time */}
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm col-span-1 lg:col-span-2">
                        <h2 className="text-lg font-semibold mb-4">{t('admin.transcription_activity')}</h2>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dailyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickMargin={10} />
                                    <YAxis stroke="#6b7280" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="total" name={t('admin.total_submissions')} stroke="#1B4E52" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="validated" name={t('admin.status_validated')} stroke="#C4622D" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Segment Status Breakdown */}
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">{t('admin.segment_pipeline')}</h2>
                        <div className="h-[250px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === t('admin.status_validated') ? '#1B4E52' : entry.name === t('admin.status_pending') ? '#E8DFD0' : '#C4622D'} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#1A1410' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Contributors */}
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">{t('admin.top_points')}</h2>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topUsers} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                    <XAxis type="number" stroke="#6b7280" fontSize={12} />
                                    <YAxis dataKey="username" type="category" stroke="#6b7280" fontSize={12} width={100} />
                                    <Tooltip
                                        cursor={{ fill: '#f3f4f6' }}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="points" name={t('admin.points')} fill="#1B4E52" radius={[0, 4, 4, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            )}
        </div>
    )
}
