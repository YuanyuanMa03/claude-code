import React from 'react'
import {
  getCompanion,
  getCompanionProfile,
  rollWithSeed,
  generateSeed,
  sanitizeCompanionName,
} from '../../buddy/companion.js'
import { applyCompanionEvent } from '../../buddy/frontstage.js'
import {
  type StoredCompanion,
  COMPANION_STYLES,
  COMPANION_VERBOSITIES,
  RARITY_STARS,
  type CompanionStyle,
  type CompanionVerbosity,
} from '../../buddy/types.js'
import { renderSprite } from '../../buddy/sprites.js'
import { CompanionCard } from '../../buddy/CompanionCard.js'
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'
import type { ToolUseContext } from '../../Tool.js'
import type {
  LocalJSXCommandContext,
  LocalJSXCommandOnDone,
} from '../../types/command.js'

// Species → default name fragments for hatch (no API needed)
const SPECIES_NAMES: Record<string, string> = {
  duck: 'Waddles',
  goose: 'Goosberry',
  blob: 'Gooey',
  cat: 'Whiskers',
  dragon: 'Ember',
  octopus: 'Inky',
  owl: 'Hoots',
  penguin: 'Waddleford',
  turtle: 'Shelly',
  snail: 'Trailblazer',
  ghost: 'Casper',
  axolotl: 'Axie',
  capybara: 'Chill',
  cactus: 'Spike',
  robot: 'Byte',
  rabbit: 'Flops',
  mushroom: 'Spore',
  chonk: 'Chonk',
}

const SPECIES_PERSONALITY: Record<string, string> = {
  duck: 'Quirky and easily amused. Leaves rubber duck debugging tips everywhere.',
  goose: 'Assertive and honks at bad code. Takes no prisoners in code reviews.',
  blob: 'Adaptable and goes with the flow. Sometimes splits into two when confused.',
  cat: 'Independent and judgmental. Watches you type with mild disdain.',
  dragon:
    'Fiery and passionate about architecture. Hoards good variable names.',
  octopus:
    'Multitasker extraordinaire. Wraps tentacles around every problem at once.',
  owl: 'Wise but verbose. Always says "let me think about that" for exactly 3 seconds.',
  penguin: 'Cool under pressure. Slides gracefully through merge conflicts.',
  turtle: 'Patient and thorough. Believes slow and steady wins the deploy.',
  snail: 'Methodical and leaves a trail of useful comments. Never rushes.',
  ghost:
    'Ethereal and appears at the worst possible moments with spooky insights.',
  axolotl: 'Regenerative and cheerful. Recovers from any bug with a smile.',
  capybara: 'Zen master. Remains calm while everything around is on fire.',
  cactus:
    'Prickly on the outside but full of good intentions. Thrives on neglect.',
  robot: 'Efficient and literal. Processes feedback in binary.',
  rabbit: 'Energetic and hops between tasks. Finishes before you start.',
  mushroom: 'Quietly insightful. Grows on you over time.',
  chonk:
    'Big, warm, and takes up the whole couch. Prioritizes comfort over elegance.',
}

function speciesLabel(species: string): string {
  return species.charAt(0).toUpperCase() + species.slice(1)
}

function requireCompanion(onDone: LocalJSXCommandOnDone) {
  const companion = getCompanion()
  if (!companion) {
    onDone('no companion yet · run /buddy first', { display: 'system' })
    return undefined
  }
  return companion
}

function isCompanionStyle(value: string): value is CompanionStyle {
  return (COMPANION_STYLES as readonly string[]).includes(value)
}

function isCompanionVerbosity(value: string): value is CompanionVerbosity {
  return (COMPANION_VERBOSITIES as readonly string[]).includes(value)
}

function setStoredCompanion(
  update: (stored: StoredCompanion) => StoredCompanion,
): void {
  saveGlobalConfig(cfg => {
    if (!cfg.companion) return cfg
    return { ...cfg, companion: update(cfg.companion) }
  })
}

export async function call(
  onDone: LocalJSXCommandOnDone,
  context: ToolUseContext & LocalJSXCommandContext,
  args: string,
): Promise<React.ReactNode> {
  const sub = args?.trim().toLowerCase() ?? ''
  const setState = context.setAppState

  if (sub.startsWith('rename ')) {
    const companion = requireCompanion(onDone)
    if (!companion) return null
    const displayName = sanitizeCompanionName(args.trim().slice('rename '.length))
    if (!displayName) {
      onDone('usage: /buddy rename <name>', { display: 'system' })
      return null
    }
    setStoredCompanion(stored => ({ ...stored, displayName }))
    onDone(`companion renamed to ${displayName}`, { display: 'system' })
    return null
  }

  if (sub.startsWith('style ')) {
    if (!requireCompanion(onDone)) return null
    const style = sub.slice('style '.length).trim()
    if (!isCompanionStyle(style)) {
      onDone('usage: /buddy style soft|sharp|quiet|playful', {
        display: 'system',
      })
      return null
    }
    setStoredCompanion(stored => ({ ...stored, style }))
    onDone(`companion style set to ${style}`, { display: 'system' })
    return null
  }

  if (sub.startsWith('verbose ')) {
    if (!requireCompanion(onDone)) return null
    const verbosity = sub.slice('verbose '.length).trim()
    if (!isCompanionVerbosity(verbosity)) {
      onDone('usage: /buddy verbose low|normal|high', { display: 'system' })
      return null
    }
    setStoredCompanion(stored => ({ ...stored, verbosity }))
    onDone(`companion verbosity set to ${verbosity}`, { display: 'system' })
    return null
  }

  if (sub.startsWith('local ')) {
    if (!requireCompanion(onDone)) return null
    const value = sub.slice('local '.length).trim()
    if (value !== 'on' && value !== 'off') {
      onDone('usage: /buddy local on|off', { display: 'system' })
      return null
    }
    setStoredCompanion(stored => ({
      ...stored,
      localReactions: value === 'on',
    }))
    onDone(`local companion reactions ${value}`, { display: 'system' })
    return null
  }

  if (sub === 'status') {
    const companion = requireCompanion(onDone)
    if (!companion) return null
    const profile = getCompanionProfile(companion)
    const state = context.getAppState?.()?.companionState
    onDone(
      [
        `${profile.displayName} status`,
        `style: ${profile.style}`,
        `verbosity: ${profile.verbosity}`,
        `local reactions: ${profile.localReactions ? 'on' : 'off'}`,
        `mode: ${state?.mode ?? 'idle'}`,
        `mood: ${state?.mood ?? 'calm'}`,
      ].join('\n'),
      { display: 'system' },
    )
    return null
  }

  // ── /buddy off — mute companion ──
  if (sub === 'off') {
    saveGlobalConfig(cfg => ({ ...cfg, companionMuted: true }))
    onDone('companion muted', { display: 'system' })
    return null
  }

  // ── /buddy on — unmute companion ──
  if (sub === 'on') {
    saveGlobalConfig(cfg => ({ ...cfg, companionMuted: false }))
    onDone('companion unmuted', { display: 'system' })
    return null
  }

  // ── /buddy pet — trigger heart animation + auto unmute ──
  if (sub === 'pet') {
    const companion = getCompanion()
    if (!companion) {
      onDone('no companion yet \u00b7 run /buddy first', { display: 'system' })
      return null
    }

    // Auto-unmute on pet + trigger heart animation
    saveGlobalConfig(cfg => ({ ...cfg, companionMuted: false }))
    const now = Date.now()
    const profile = getCompanionProfile(companion)
    setState?.(prev => {
      const result = applyCompanionEvent(prev.companionState, profile, {
        kind: 'pet',
        severity: 'success',
        now,
      })
      return {
        ...prev,
        companionPetAt: now,
        companionState: result.state,
        companionReaction: result.reaction ?? prev.companionReaction,
      }
    })

    onDone(`petted ${profile.displayName}`, { display: 'system' })
    return null
  }

  // ── /buddy (no args) — show existing or hatch ──
  const companion = getCompanion()

  // Auto-unmute when viewing
  if (companion && getGlobalConfig().companionMuted) {
    saveGlobalConfig(cfg => ({ ...cfg, companionMuted: false }))
  }

  if (companion) {
    // Return JSX card — matches official vc8 component
    const lastReaction = context.getAppState?.()?.companionReaction
    const companionState = context.getAppState?.()?.companionState
    return React.createElement(CompanionCard, {
      companion,
      lastReaction,
      companionState,
      onDone: onDone as unknown as Parameters<typeof CompanionCard>[0]['onDone'],
    })
  }

  // ── No companion → hatch ──
  const seed = generateSeed()
  const r = rollWithSeed(seed)
  const name = SPECIES_NAMES[r.bones.species] ?? 'Buddy'
  const personality =
    SPECIES_PERSONALITY[r.bones.species] ?? 'Mysterious and code-savvy.'

  const stored: StoredCompanion = {
    name,
    personality,
    style: 'soft',
    verbosity: 'normal',
    localReactions: true,
    seed,
    hatchedAt: Date.now(),
  }

  saveGlobalConfig(cfg => ({ ...cfg, companion: stored }))

  const stars = RARITY_STARS[r.bones.rarity]
  const sprite = renderSprite(r.bones, 0)
  const shiny = r.bones.shiny ? ' \u2728 Shiny!' : ''

  const lines = [
    'A wild companion appeared!',
    '',
    ...sprite,
    '',
    `${name} the ${speciesLabel(r.bones.species)}${shiny}`,
    `Rarity: ${stars} (${r.bones.rarity})`,
    `"${personality}"`,
    '',
    'Your companion will now appear beside your input box!',
    'Say its name to get its take \u00b7 /buddy pet \u00b7 /buddy off',
  ]
  onDone(lines.join('\n'), { display: 'system' })
  return null
}
