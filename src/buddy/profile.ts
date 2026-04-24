import type {
  Companion,
  CompanionProfile,
  CompanionStyle,
  CompanionVerbosity,
  StoredCompanion,
} from './types.js'
import { COMPANION_STYLES, COMPANION_VERBOSITIES } from './types.js'

const DEFAULT_STYLE: CompanionStyle = 'soft'
const DEFAULT_VERBOSITY: CompanionVerbosity = 'normal'

function isCompanionStyle(value: unknown): value is CompanionStyle {
  return (
    typeof value === 'string' &&
    (COMPANION_STYLES as readonly string[]).includes(value)
  )
}

function isCompanionVerbosity(value: unknown): value is CompanionVerbosity {
  return (
    typeof value === 'string' &&
    (COMPANION_VERBOSITIES as readonly string[]).includes(value)
  )
}

export function sanitizeCompanionName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').slice(0, 32)
}

export function getCompanionDisplayName(
  companion: Pick<StoredCompanion, 'name' | 'displayName'>,
): string {
  const custom = companion.displayName
    ? sanitizeCompanionName(companion.displayName)
    : ''
  return custom || sanitizeCompanionName(companion.name) || 'Buddy'
}

export function getCompanionProfile(
  companion: Pick<
    StoredCompanion,
    'name' | 'displayName' | 'style' | 'verbosity' | 'localReactions'
  >,
): CompanionProfile {
  return {
    displayName: getCompanionDisplayName(companion),
    style: isCompanionStyle(companion.style) ? companion.style : DEFAULT_STYLE,
    verbosity: isCompanionVerbosity(companion.verbosity)
      ? companion.verbosity
      : DEFAULT_VERBOSITY,
    localReactions: companion.localReactions !== false,
  }
}

export function withCompanionDisplayName<T extends Companion>(
  companion: T,
): T & { profile: CompanionProfile } {
  return { ...companion, profile: getCompanionProfile(companion) }
}
