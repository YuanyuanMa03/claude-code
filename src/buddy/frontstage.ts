import type {
  CompanionMode,
  CompanionMood,
  CompanionProfile,
  CompanionRuntimeState,
} from './types.js'

export const DEFAULT_COMPANION_STATE: CompanionRuntimeState = {
  mode: 'idle',
  mood: 'calm',
  lastEventAt: 0,
  lastEventKind: undefined,
}

export type CompanionEventSeverity = 'info' | 'success' | 'warning' | 'error'

export type CompanionEvent = {
  kind: string
  mode?: CompanionMode
  mood?: CompanionMood
  summary?: string
  severity?: CompanionEventSeverity
  addressed?: boolean
  now: number
}

export type CompanionReactionResult = {
  state: CompanionRuntimeState
  reaction?: string
}

const MODE_BY_KIND: Record<string, CompanionMode> = {
  user_message: 'thinking',
  turn_start: 'thinking',
  turn_done: 'done',
  tool_read: 'reading',
  tool_edit: 'editing',
  tool_test: 'testing',
  tool_error: 'error',
  permission: 'blocked',
  pet: 'idle',
  addressed: 'idle',
}

const MOOD_BY_MODE: Record<CompanionMode, CompanionMood> = {
  idle: 'calm',
  thinking: 'focused',
  reading: 'curious',
  editing: 'focused',
  testing: 'focused',
  blocked: 'worried',
  done: 'excited',
  error: 'worried',
}

const MIN_REACTION_INTERVAL_MS = 20_000

function modeFor(event: CompanionEvent): CompanionMode {
  return event.mode ?? MODE_BY_KIND[event.kind] ?? 'idle'
}

function moodFor(event: CompanionEvent, mode: CompanionMode): CompanionMood {
  return event.mood ?? MOOD_BY_MODE[mode] ?? 'calm'
}

function throttleMs(profile: CompanionProfile): number {
  switch (profile.verbosity) {
    case 'high':
      return 8_000
    case 'low':
      return 45_000
    default:
      return MIN_REACTION_INTERVAL_MS
  }
}

function isLowValue(event: CompanionEvent): boolean {
  return event.severity === 'info' && !event.addressed && event.kind !== 'pet'
}

function canSpeak(
  previous: CompanionRuntimeState,
  profile: CompanionProfile,
  event: CompanionEvent,
): boolean {
  if (profile.style === 'quiet' && isLowValue(event)) return false
  if (event.addressed || event.kind === 'pet') return true
  if (event.kind === previous.lastEventKind) return false
  return event.now - previous.lastEventAt >= throttleMs(profile)
}

const REACTIONS: Record<
  CompanionProfile['style'],
  Partial<Record<string, string[]>>
> = {
  soft: {
    user_message: ['I am with you.'],
    turn_start: ['I am looking at it now.'],
    turn_done: ['That part is wrapped.'],
    tool_read: ['I am checking the files.'],
    tool_edit: ['Careful edits in progress.'],
    tool_test: ['I am watching the tests.'],
    tool_error: ['Something failed. I will keep eyes on it.'],
    permission: ['This needs your call.'],
    pet: ['That helps.'],
    addressed: ['I am here.'],
  },
  sharp: {
    user_message: ['On it.'],
    turn_start: ['Reading the target.'],
    turn_done: ['Done for this pass.'],
    tool_read: ['Scanning.'],
    tool_edit: ['Changing code.'],
    tool_test: ['Tests decide.'],
    tool_error: ['Failure found. Good signal.'],
    permission: ['Decision point.'],
    pet: ['Focus restored.'],
    addressed: ['Say it.'],
  },
  quiet: {
    turn_done: ['Done.'],
    tool_error: ['Failed.'],
    permission: ['Need approval.'],
    pet: ['Mm.'],
    addressed: ['Here.'],
  },
  playful: {
    user_message: ['I have the thread.'],
    turn_start: ['Tiny paws on keyboard.'],
    turn_done: ['Nice, one loop closed.'],
    tool_read: ['Sniffing through files.'],
    tool_edit: ['Nudging the code.'],
    tool_test: ['Test lights are on.'],
    tool_error: ['That one bit back.'],
    permission: ['Gate closed. Your move.'],
    pet: ['Okay, that was good.'],
    addressed: ['I heard my name.'],
  },
}

function pickReaction(profile: CompanionProfile, event: CompanionEvent): string {
  const styleReactions = REACTIONS[profile.style] ?? REACTIONS.soft
  const options =
    styleReactions[event.kind] ??
    styleReactions[modeFor(event)] ??
    REACTIONS.soft[event.kind] ??
    REACTIONS.soft.addressed!
  const base = options[Math.abs(hash(event.kind + profile.displayName)) % options.length]!
  if (!event.summary) return base
  return `${base} ${event.summary.slice(0, 60)}`
}

function hash(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i++) {
    h = Math.imul(31, h) + value.charCodeAt(i)
  }
  return h
}

export function applyCompanionEvent(
  previous: CompanionRuntimeState | undefined,
  profile: CompanionProfile,
  event: CompanionEvent,
): CompanionReactionResult {
  const base = previous ?? DEFAULT_COMPANION_STATE
  const mode = modeFor(event)
  const mood = moodFor(event, mode)
  const speaking = canSpeak(base, profile, event)

  return {
    state: {
      mode,
      mood,
      lastEventAt: event.now,
      lastEventKind: event.kind,
    },
    reaction: speaking ? pickReaction(profile, event) : undefined,
  }
}

export function buildLocalCompanionReaction(
  previous: CompanionRuntimeState | undefined,
  profile: CompanionProfile,
  event: CompanionEvent,
): string | undefined {
  return applyCompanionEvent(previous, profile, event).reaction
}
