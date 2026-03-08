export type ContributorGamificationProfile = {
  total_contributions?: number | null
  current_streak?: number | null
  points?: number | null
  last_contribution_date?: string | null
}

export type BadgeMetric = 'contributions' | 'streak' | 'points' | 'accuracy'

export type BadgeDefinition = {
  slug: string
  name: string
  description: string
  metric: BadgeMetric
  target: number
  xpReward: number
}

export type BadgeProgress = BadgeDefinition & {
  unlocked: boolean
  currentValue: number
  progressPct: number
}

export type LevelProgress = {
  level: number
  levelName: string
  currentXp: number
  nextLevelXp: number | null
  xpIntoLevel: number
  xpForNextLevel: number
  progressPct: number
}

export type BoostInfo = {
  slug: string
  label: string
  multiplier: number
  description: string
  isDoubleXp?: boolean
}

export type TranscriptionReward = {
  baseXp: number
  bonusXp: number
  finalXp: number
  multiplier: number
  newStreak: number
  boosts: BoostInfo[]
}

const LEVEL_THRESHOLDS = [0, 80, 180, 320, 520, 780, 1100, 1500, 2000, 2700, 3600, 4700]
const LEVEL_NAMES = [
  'Novice',
  'Apprenti',
  'Copiste',
  'Scribe',
  'Archiviste',
  'Maitre de plume',
  'Maitre copiste',
  'Gardien des lignes',
  'Conservateur',
  'Legende vivante',
  'Oracle manuscrit',
  'Immortel du script'
]

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    slug: 'first_transcription',
    name: 'Premier Trait',
    description: 'Valide ta toute premiere transcription.',
    metric: 'contributions',
    target: 1,
    xpReward: 50,
  },
  {
    slug: 'transcriptions_10',
    name: 'Cadence 10',
    description: 'Atteins 10 lignes transcrites.',
    metric: 'contributions',
    target: 10,
    xpReward: 80,
  },
  {
    slug: 'transcriptions_100',
    name: 'Scribe 100',
    description: 'Depasse la barre des 100 transcriptions.',
    metric: 'contributions',
    target: 100,
    xpReward: 200,
  },
  {
    slug: 'transcriptions_500',
    name: 'Forge 500',
    description: 'Atteins 500 lignes pour entrer dans l elite.',
    metric: 'contributions',
    target: 500,
    xpReward: 500,
  },
  {
    slug: 'streak_3',
    name: 'Flamme 3 jours',
    description: 'Contribue 3 jours de suite.',
    metric: 'streak',
    target: 3,
    xpReward: 60,
  },
  {
    slug: 'streak_7',
    name: 'Flamme 7 jours',
    description: 'Contribue 7 jours consecutifs.',
    metric: 'streak',
    target: 7,
    xpReward: 120,
  },
  {
    slug: 'streak_30',
    name: 'Flamme 30 jours',
    description: 'Tiens une serie de 30 jours.',
    metric: 'streak',
    target: 30,
    xpReward: 350,
  },
  {
    slug: 'accuracy_90',
    name: 'Precision 90%',
    description: 'Garde 90% de validations sur 20 lignes valides.',
    metric: 'accuracy',
    target: 90,
    xpReward: 250,
  },
  {
    slug: 'points_1000',
    name: 'Reserve 1000 XP',
    description: 'Cumule 1000 XP.',
    metric: 'points',
    target: 1000,
    xpReward: 200,
  },
  {
    slug: 'points_3000',
    name: 'Reserve 3000 XP',
    description: 'Cumule 3000 XP.',
    metric: 'points',
    target: 3000,
    xpReward: 450,
  },
]

export function getLevelProgress(points: number): LevelProgress {
  const safePoints = Math.max(0, points || 0)

  let level = 1
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    const current = LEVEL_THRESHOLDS[i]
    const next = LEVEL_THRESHOLDS[i + 1]

    if (safePoints >= current && (next === undefined || safePoints < next)) {
      level = i + 1
      break
    }
  }

  const currentXp = LEVEL_THRESHOLDS[level - 1]
  const nextLevelXp = LEVEL_THRESHOLDS[level] ?? null
  const xpIntoLevel = safePoints - currentXp
  const xpForNextLevel = nextLevelXp ? Math.max(1, nextLevelXp - currentXp) : 1
  const progressPct = nextLevelXp ? Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100)) : 100

  return {
    level,
    levelName: LEVEL_NAMES[level - 1] || `Niveau ${level}`,
    currentXp,
    nextLevelXp,
    xpIntoLevel,
    xpForNextLevel,
    progressPct,
  }
}

function toIsoDate(input?: string | null): string | null {
  if (!input) return null
  return input.slice(0, 10)
}

function getYesterdayIso(isoToday: string): string {
  const now = new Date(`${isoToday}T00:00:00.000Z`)
  now.setUTCDate(now.getUTCDate() - 1)
  return now.toISOString().slice(0, 10)
}

function getStreakMultiplier(streak: number): BoostInfo | null {
  if (streak >= 14) {
    return {
      slug: 'streak_14_boost',
      label: 'Boost serie x2',
      multiplier: 2,
      description: 'Serie de 14+ jours: XP double sur chaque ligne.',
      isDoubleXp: true,
    }
  }

  if (streak >= 7) {
    return {
      slug: 'streak_7_boost',
      label: 'Boost serie x1.5',
      multiplier: 1.5,
      description: 'Serie de 7+ jours: +50% XP.',
    }
  }

  if (streak >= 3) {
    return {
      slug: 'streak_3_boost',
      label: 'Boost serie x1.25',
      multiplier: 1.25,
      description: 'Serie de 3+ jours: +25% XP.',
    }
  }

  return null
}

function getWeekendBoost(now: Date): BoostInfo | null {
  const day = now.getUTCDay()
  if (day === 0 || day === 6) {
    return {
      slug: 'weekend_double_xp',
      label: 'Weekend Double XP',
      multiplier: 2,
      description: 'Evenement weekend actif: XP x2.',
      isDoubleXp: true,
    }
  }

  return null
}

export function getActiveBoosts(currentStreak: number, now = new Date()): BoostInfo[] {
  const boosts: BoostInfo[] = []
  const streakBoost = getStreakMultiplier(currentStreak)
  const weekendBoost = getWeekendBoost(now)

  if (streakBoost) boosts.push(streakBoost)
  if (weekendBoost) boosts.push(weekendBoost)

  return boosts
}

export function computeTranscriptionReward(
  profile: ContributorGamificationProfile,
  now = new Date()
): TranscriptionReward {
  const todayIso = now.toISOString().slice(0, 10)
  const yesterdayIso = getYesterdayIso(todayIso)
  const lastContribution = toIsoDate(profile.last_contribution_date)

  const currentStreak = Number(profile.current_streak || 0)

  let newStreak = 1
  if (lastContribution === todayIso) {
    newStreak = Math.max(1, currentStreak)
  } else if (lastContribution === yesterdayIso) {
    newStreak = currentStreak + 1
  }

  const baseXp = 10
  const boosts = getActiveBoosts(newStreak, now)
  const multiplier = boosts.reduce((acc, boost) => acc * boost.multiplier, 1)

  const firstContributionToday = lastContribution !== todayIso
  const bonusXp = firstContributionToday ? 5 : 0
  const finalXp = Math.max(1, Math.round(baseXp * multiplier) + bonusXp)

  return {
    baseXp,
    bonusXp,
    finalXp,
    multiplier,
    newStreak,
    boosts,
  }
}

export function buildBadgeProgress(
  profile: ContributorGamificationProfile,
  unlockedSlugs: string[],
  accuracyRate: number | null = null
): BadgeProgress[] {
  const unlockedSet = new Set(unlockedSlugs)
  const contributions = Number(profile.total_contributions || 0)
  const streak = Number(profile.current_streak || 0)
  const points = Number(profile.points || 0)
  const accuracy = Number(accuracyRate || 0)

  const metricValue = {
    contributions,
    streak,
    points,
    accuracy,
  }

  return BADGE_DEFINITIONS.map((badge) => {
    const currentValue = metricValue[badge.metric]
    const unlocked = unlockedSet.has(badge.slug) || currentValue >= badge.target
    const progressPct = Math.min(100, Math.round((currentValue / badge.target) * 100))

    return {
      ...badge,
      unlocked,
      currentValue,
      progressPct,
    }
  }).sort((a, b) => Number(a.unlocked) - Number(b.unlocked) || a.progressPct - b.progressPct)
}

