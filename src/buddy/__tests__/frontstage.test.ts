import { describe, expect, test } from 'bun:test'
import {
  applyCompanionEvent,
  DEFAULT_COMPANION_STATE,
} from '../frontstage.js'
import type { CompanionProfile } from '../types.js'

const profile: CompanionProfile = {
  displayName: 'Momo',
  style: 'soft',
  verbosity: 'normal',
  localReactions: true,
}

describe('Buddy frontstage local reactions', () => {
  test('maps read events to curious reading state', () => {
    const result = applyCompanionEvent(DEFAULT_COMPANION_STATE, profile, {
      kind: 'tool_read',
      severity: 'info',
      now: 30_000,
    })

    expect(result.state.mode).toBe('reading')
    expect(result.state.mood).toBe('curious')
    expect(typeof result.reaction).toBe('string')
  })

  test('maps tool errors to worried error state', () => {
    const result = applyCompanionEvent(DEFAULT_COMPANION_STATE, profile, {
      kind: 'tool_error',
      severity: 'error',
      now: 30_000,
    })

    expect(result.state.mode).toBe('error')
    expect(result.state.mood).toBe('worried')
    expect(result.reaction).toContain('failed')
  })

  test('does not repeat the same event inside throttle window', () => {
    const first = applyCompanionEvent(DEFAULT_COMPANION_STATE, profile, {
      kind: 'tool_read',
      severity: 'info',
      now: 30_000,
    })
    const second = applyCompanionEvent(first.state, profile, {
      kind: 'tool_read',
      severity: 'info',
      now: 35_000,
    })

    expect(typeof first.reaction).toBe('string')
    expect(second.reaction).toBeUndefined()
  })

  test('quiet style suppresses low-value informational speech', () => {
    const result = applyCompanionEvent(
      DEFAULT_COMPANION_STATE,
      {
        ...profile,
        style: 'quiet',
      },
      {
        kind: 'tool_read',
        severity: 'info',
        now: 30_000,
      },
    )

    expect(result.state.mode).toBe('reading')
    expect(result.reaction).toBeUndefined()
  })

  test('addressed events can speak even inside throttle window', () => {
    const previous = {
      ...DEFAULT_COMPANION_STATE,
      lastEventAt: 29_000,
      lastEventKind: 'tool_read',
    }
    const result = applyCompanionEvent(previous, profile, {
      kind: 'addressed',
      addressed: true,
      severity: 'info',
      now: 30_000,
    })

    expect(typeof result.reaction).toBe('string')
  })
})
