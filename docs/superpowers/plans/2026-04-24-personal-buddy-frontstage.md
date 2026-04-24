# Personal Buddy Frontstage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Buddy from a decorative companion into a local, personal TUI frontstage that can be named, styled, and react to workflow state without remote APIs.

**Architecture:** Reuse the existing Buddy feature path. Add pure local profile/state/reaction modules under `src/buddy`, store runtime state in `AppState`, extend `/buddy` commands, and wire conservative REPL events to update the companion bubble and status label.

**Tech Stack:** Bun, TypeScript, React/Ink, existing `FEATURE_BUDDY` feature gate, `bun:test`.

---

## File Map

- Create `src/buddy/profile.ts`: safe profile defaults and helpers for existing companion config.
- Create `src/buddy/frontstage.ts`: pure event-to-state and local reaction engine.
- Create `src/buddy/__tests__/frontstage.test.ts`: tests for state mapping, throttling, and style reactions.
- Modify `src/buddy/types.ts`: add profile and runtime state types.
- Modify `src/buddy/companion.ts`: expose display/profile helpers.
- Modify `src/buddy/companionReact.ts`: local-first reactions, remote fallback only when enabled.
- Modify `src/buddy/CompanionSprite.tsx`: render compact status labels from AppState.
- Modify `src/buddy/CompanionCard.tsx`: show profile settings and runtime state.
- Modify `src/commands/buddy/buddy.ts`: add rename/style/verbose/local/status commands.
- Modify `src/commands/buddy/index.ts`: update hint text.
- Modify `src/state/AppStateStore.ts`: add default companion runtime state.
- Modify `src/screens/REPL.tsx`: emit turn start/end local Buddy events.

### Task 1: Profile And Runtime Types

**Files:**
- Modify: `src/buddy/types.ts`
- Create: `src/buddy/profile.ts`
- Modify: `src/buddy/companion.ts`
- Modify: `src/state/AppStateStore.ts`

- [ ] **Step 1: Add types for profile and runtime state**

Add `CompanionStyle`, `CompanionVerbosity`, `CompanionMode`, `CompanionMood`, `CompanionProfile`, `CompanionRuntimeState`, and optional profile fields to `StoredCompanion`.

- [ ] **Step 2: Add profile helper**

Create `getCompanionProfile(companion)` and `getCompanionDisplayName(companion)` with defaults: style `soft`, verbosity `normal`, local reactions `true`.

- [ ] **Step 3: Add runtime state to AppState**

Add `companionState: CompanionRuntimeState` with default `{ mode: 'idle', mood: 'calm', lastEventAt: 0, lastEventKind: undefined }`.

- [ ] **Step 4: Verify types**

Run: `bunx tsc --noEmit`
Expected: no new type errors from Buddy files.

### Task 2: Local Reaction Engine

**Files:**
- Create: `src/buddy/frontstage.ts`
- Create: `src/buddy/__tests__/frontstage.test.ts`

- [ ] **Step 1: Write tests**

Test that a `tool_read` event maps to `reading/curious`, a `tool_error` event maps to `error/worried`, repeated events inside the throttle window do not speak, `quiet` style suppresses low-value speech, and direct `addressed` events can speak.

- [ ] **Step 2: Implement pure engine**

Export `DEFAULT_COMPANION_STATE`, `applyCompanionEvent`, and `buildLocalCompanionReaction`. Keep reactions short and deterministic.

- [ ] **Step 3: Run targeted test**

Run: `bun test src/buddy/__tests__/frontstage.test.ts`
Expected: all tests pass.

### Task 3: Commands

**Files:**
- Modify: `src/commands/buddy/buddy.ts`
- Modify: `src/commands/buddy/index.ts`

- [ ] **Step 1: Extend command parsing**

Add support for `/buddy rename <name>`, `/buddy style <soft|sharp|quiet|playful>`, `/buddy verbose <low|normal|high>`, `/buddy local on|off`, and `/buddy status`.

- [ ] **Step 2: Keep existing commands stable**

`/buddy`, `/buddy pet`, `/buddy on`, and `/buddy off` must keep current behavior. `/buddy pet` should also trigger a local `pet` reaction.

- [ ] **Step 3: Run typecheck**

Run: `bunx tsc --noEmit`
Expected: no command type errors.

### Task 4: Local-First Reactions In REPL

**Files:**
- Modify: `src/buddy/companionReact.ts`
- Modify: `src/screens/REPL.tsx`

- [ ] **Step 1: Make companion reactions local-first**

Use the local engine for addressed messages and turn-end reactions. Call remote `buddy_react` only when `localReactions === false`.

- [ ] **Step 2: Emit turn state**

At query start set mode to `thinking/focused`. At query end update to `done/excited` and optionally show a short reaction.

- [ ] **Step 3: Preserve muted behavior**

All local and remote reactions must skip when `companionMuted` is true.

### Task 5: TUI Status Rendering

**Files:**
- Modify: `src/buddy/CompanionSprite.tsx`
- Modify: `src/buddy/CompanionCard.tsx`

- [ ] **Step 1: Render status label**

Show `name mode` on the Sprite name row, for example `Momo testing`. Use display name from profile.

- [ ] **Step 2: Keep narrow terminals stable**

In narrow mode, show face plus reaction if speaking, otherwise face plus `name mode`.

- [ ] **Step 3: Expand `/buddy` card**

Show style, verbosity, local reaction mode, current mode, and current mood.

### Task 6: Final Verification

**Files:**
- All touched files

- [ ] **Step 1: Run focused tests**

Run: `bun test src/buddy/__tests__/frontstage.test.ts`
Expected: pass.

- [ ] **Step 2: Run typecheck**

Run: `bunx tsc --noEmit`
Expected: pass or report existing unrelated errors with exact files.

- [ ] **Step 3: Review git diff**

Run: `git diff --stat && git diff --check`
Expected: no whitespace errors and changed files match this plan.
