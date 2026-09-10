'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { approveProposalAndCreateManuscript, rejectProposal } from './actions'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { 
    CheckCircle2, Clock, ExternalLink, FileText, 
    GraduationCap, Landmark, Sparkles, XCircle, ArrowRight, User
} from 'lucide-react'

export function ProposalsManager({ initialProposals }: { initialProposals: any[] }) {
    const [proposals, setProposals] = useState(initialProposals)
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
    const [processingId, setProcessingId] = useState<string | null>(null)

    const router = useRouter()
    const { toast } = useToast()

    const filtered = proposals.filter(p => {
        if (filter === 'all') return true
        return p.status === filter
    })

    const handleApprove = async (id: string) => {
        setProcessingId(id)
        const res = await approveProposalAndCreateManuscript(id)
        setProcessingId(null)

        if (res.error) {
            toast({ title: 'Erreur', description: res.error, variant: 'destructive' })
            return
        }

        toast({ 
            title: 'Proposition approuvée !', 
            description: 'Le manuscrit a été créé avec succès. Redirection vers la gestion des pages...' 
        })
        setProposals(prev => prev.map(p => p.id === id ? { ...p, status: 'approved', created_manuscript_id: res.manuscriptId } : p))
        router.push(`/admin/manuscripts/${res.manuscriptId}`)
    }

    const handleReject = async (id: string) => {
        const confirmed = window.confirm('Êtes-vous sûr de vouloir rejeter cette proposition ?')
        if (!confirmed) return

        setProcessingId(id)
        const res = await rejectProposal(id)
        setProcessingId(null)

        if (res.error) {
            toast({ title: 'Erreur', description: res.error, variant: 'destructive' })
            return
        }

        toast({ title: 'Proposition rejetée' })
        setProposals(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected' } : p))
    }

    return (
        <div className="flex flex-col gap-6">
            
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
                {(['pending', 'all', 'approved', 'rejected'] as const).map(tab => {
                    const count = tab === 'all' 
                        ? proposals.length 
                        : proposals.filter(p => p.status === tab).length

                    return (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                filter === tab 
                                    ? 'bg-primary text-primary-foreground shadow-sm' 
                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            {tab === 'pending' ? 'En attente' : tab === 'all' ? 'Toutes' : tab === 'approved' ? 'Approuvées' : 'Rejetées'}
                            <span className="ml-2 text-xs opacity-75 font-mono">({count})</span>
                        </button>
                    )
                })}
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-6">
                {filtered.map(proposal => {
                    const isPending = proposal.status === 'pending'
                    const isApproved = proposal.status === 'approved'
                    const isRejected = proposal.status === 'rejected'

                    return (
                        <div 
                            key={proposal.id} 
                            className={`rounded-2xl border p-6 bg-card transition-all ${
                                isPending ? 'border-primary/30 shadow-md ring-1 ring-primary/10' : 'border-border shadow-sm'
                            }`}
                        >
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                                
                                <div className="space-y-3 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                        <span className={`px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider text-[10px] ${
                                            isApproved ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' :
                                            isRejected ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                                            'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                                        }`}>
                                            {isApproved ? 'Approuvée' : isRejected ? 'Rejetée' : 'En attente de revue'}
                                        </span>
                                        {proposal.shelfmark && (
                                            <span className="font-mono bg-muted px-2 py-0.5 rounded text-foreground font-medium">
                                                {proposal.shelfmark}
                                            </span>
                                        )}
                                        {proposal.script_type && (
                                            <span className="border border-border bg-card px-2 py-0.5 rounded text-muted-foreground">
                                                {proposal.script_type}
                                            </span>
                                        )}
                                        {proposal.century && (
                                            <span className="border border-border bg-card px-2 py-0.5 rounded text-muted-foreground">
                                                {proposal.century}
                                            </span>
                                        )}
                                    </div>

                                    <h2 className="text-xl sm:text-2xl font-heading font-semibold text-foreground">
                                        {proposal.title}
                                    </h2>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                                        <div>
                                            <span className="font-medium text-foreground">Institution :</span> {proposal.institution || 'Non renseignée'}
                                        </div>
                                        {proposal.author && (
                                            <div>
                                                <span className="font-medium text-foreground">Auteur :</span> {proposal.author}
                                            </div>
                                        )}
                                    </div>

                                    {/* Proposer Info */}
                                    <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/70 text-xs">
                                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                            <User className="w-3.5 h-3.5 text-primary" />
                                            <span>{proposal.proposer_name}</span>
                                        </div>
                                        {proposal.proposer_affiliation && (
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <GraduationCap className="w-3.5 h-3.5" />
                                                <span>{proposal.proposer_affiliation}</span>
                                            </div>
                                        )}
                                        <span className="text-muted-foreground font-mono">
                                            ({proposal.proposer_email})
                                        </span>
                                        <span className="text-muted-foreground ml-auto">
                                            {new Date(proposal.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>

                                    {/* Scholarly justification */}
                                    {proposal.scholarly_justification && (
                                        <div className="text-sm p-3.5 rounded-xl bg-primary/5 border border-primary/10 text-foreground leading-relaxed">
                                            <p className="font-semibold text-xs text-primary uppercase tracking-wide mb-1">Justification scientifique du chercheur :</p>
                                            <p className="text-xs sm:text-sm text-foreground/90">{proposal.scholarly_justification}</p>
                                        </div>
                                    )}

                                    {/* Facsimile link */}
                                    {proposal.facsimile_url && (
                                        <div className="flex items-center gap-2 text-xs pt-1">
                                            <ExternalLink className="w-3.5 h-3.5 text-primary shrink-0" />
                                            <a 
                                                href={proposal.facsimile_url} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="text-primary hover:underline truncate max-w-md"
                                            >
                                                {proposal.facsimile_url}
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 shrink-0">
                                    {isPending && (
                                        <>
                                            <Button
                                                onClick={() => handleApprove(proposal.id)}
                                                disabled={processingId === proposal.id}
                                                className="gap-2 font-semibold shadow-sm w-full lg:w-auto"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>Approuver & Créer</span>
                                            </Button>
                                            <Button
                                                onClick={() => handleReject(proposal.id)}
                                                disabled={processingId === proposal.id}
                                                variant="outline"
                                                className="gap-1.5 text-destructive hover:bg-destructive/10 border-destructive/20 w-full lg:w-auto"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                <span>Rejeter</span>
                                            </Button>
                                        </>
                                    )}

                                    {isApproved && proposal.created_manuscript_id && (
                                        <Button asChild variant="outline" className="gap-2 w-full lg:w-auto">
                                            <Link href={`/admin/manuscripts/${proposal.created_manuscript_id}`}>
                                                <span>Voir le manuscrit</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </Button>
                                    )}
                                </div>

                            </div>
                        </div>
                    )
                })}

                {filtered.length === 0 && (
                    <div className="text-center py-16 p-8 rounded-2xl border border-dashed border-border bg-card/50">
                        <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                        <h3 className="font-heading font-semibold text-lg text-foreground">Aucune proposition trouvée</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                            {filter === 'pending' 
                                ? 'Toutes les propositions reçues ont été traitées ou validées.'
                                : 'Aucun élément ne correspond à ce filtre.'}
                        </p>
                    </div>
                )}
            </div>

        </div>
    )
}
