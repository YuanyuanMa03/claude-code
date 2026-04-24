# Personal Buddy Frontstage Design

Date: 2026-04-24

## Goal

Turn the existing Buddy feature from an Easter egg into a personal frontstage for the user's Claude Code workflow. Claude remains the serious engineering agent; Buddy becomes the visible companion layer that reflects state, mood, and short reactions in the TUI.

The first version should feel alive without changing core agent behavior or requiring remote services.

## Scope

Included in the first version:

- A user-configurable personal companion profile.
- A companion status model that tracks what the agent appears to be doing.
- Local reaction generation based on workflow events and recent messages.
- TUI changes that show companion state near the prompt without making the input harder to use.
- New `/buddy` subcommands for profile and behavior control.
- Tests for pure state and reaction logic.

Excluded from the first version:

- Long-term growth or leveling systems.
- Network-dependent `buddy_react` behavior as the default path.
- Deep proactive autonomous work.
- Remote Control or mobile UI integration.
- Replacing Claude's main response voice with Buddy's voice.

## Product Shape

Buddy is a companion beside the coding loop, not the coding loop itself.

It should:

- React to useful moments: starting work, reading files, editing files, tests passing, tests failing, waiting for permission, and task completion.
- Use short, personal, low-noise lines.
- Stay quiet when the user is actively typing or when too many events happen quickly.
- Be configurable enough for the user to make it feel like their own assistant.

It should not:

- Explain technical details already present in the main response.
- Interrupt every tool call.
- Claim responsibility for actions it did not take.
- Depend on Anthropic OAuth-only APIs.

## Existing Foundation

The repository already has a working Buddy base:

- `src/buddy/types.ts` defines species, rarity, stats, and stored companion shape.
- `src/buddy/companion.ts` handles deterministic generation and config lookup.
- `src/buddy/CompanionSprite.tsx` renders the companion, speech bubble, and pet animation.
- `src/buddy/CompanionCard.tsx` renders `/buddy`.
- `src/buddy/companionReact.ts` calls a remote `buddy_react` API after turns.
- `src/commands/buddy/buddy.ts` handles `/buddy`, `/buddy pet`, and mute/unmute.
- `src/buddy/prompt.ts` adds the companion intro attachment.

The first version should reuse this path instead of creating a parallel companion system.

## Architecture

### Companion Profile

Extend the stored companion configuration with optional user-controlled fields:

- `displayName`: custom name shown in the TUI.
- `style`: one of `soft`, `sharp`, `quiet`, or `playful`.
- `verbosity`: one of `low`, `normal`, or `high`.
- `localReactions`: boolean, default `true`.

Existing generated fields remain valid. If the new fields are missing, Buddy keeps the current behavior.

### Companion Runtime State

Add a small runtime state object to AppState:

- `mode`: `idle`, `thinking`, `reading`, `editing`, `testing`, `blocked`, `done`, or `error`.
- `mood`: `calm`, `focused`, `curious`, `excited`, `worried`, or `tired`.
- `lastEventAt`: timestamp for throttling.
- `lastEventKind`: event key for avoiding repeated reactions.

This state is UI-only and does not need persistence.

### Event Adapter

Introduce a local event adapter that turns workflow signals into companion events. Initial event sources:

- User submits a message.
- Assistant turn starts or ends.
- Tool use starts, especially file read, file edit, bash, and test-like commands.
- Permission prompt appears.
- Tool result contains obvious success or failure signals.
- `/buddy pet` happens.

The adapter should be conservative. If a signal is ambiguous, it should update mode but skip speech.

### Local Reaction Engine

Create a pure local reaction engine:

```ts
type CompanionEvent = {
  kind: string
  mode: CompanionMode
  mood?: CompanionMood
  summary?: string
  severity?: 'info' | 'success' | 'warning' | 'error'
  now: number
}
```

It returns either no reaction or a short line. It should consider:

- companion profile style
- event kind
- previous event kind
- throttle interval
- whether the user directly addressed Buddy

Remote `buddy_react` can remain as an optional fallback, but local reactions should be the default so the feature works with API-key and local-compatible providers.

### TUI

Keep the current layout but make the companion convey state:

- Sprite remains near the prompt.
- Name row may show a compact status label, such as `Momo testing`.
- Speech bubble remains short and fades as it does today.
- Narrow terminals keep the one-line face plus status behavior.
- The input area must not shrink unpredictably.

Avoid a large dashboard in the first version. The pet feeling should come from timing, state, and small reactions rather than a new complex screen.

### Commands

Extend `/buddy` with:

- `/buddy rename <name>`
- `/buddy style <soft|sharp|quiet|playful>`
- `/buddy verbose <low|normal|high>`
- `/buddy local on|off`
- `/buddy status`

Keep existing commands working:

- `/buddy`
- `/buddy pet`
- `/buddy on`
- `/buddy off`

## Data Flow

1. User starts Claude Code with Buddy enabled.
2. `/buddy` creates or displays the companion.
3. REPL and tool execution paths emit conservative companion events.
4. The event adapter updates companion runtime state.
5. The local reaction engine decides whether to show a short bubble.
6. `CompanionSprite` renders state and reaction beside the prompt.

## Error Handling

- If companion config is malformed, fall back to current generated Buddy behavior.
- If local reaction generation fails, skip the bubble and keep the TUI stable.
- If remote `buddy_react` fails, do not surface an error to the user.
- If the terminal is narrow, collapse to compact one-line rendering.
- If Buddy is muted, skip all rendering and reactions.

## Testing

Add focused tests for:

- Profile defaults and migration from existing stored companion config.
- Event-to-state mapping.
- Reaction throttling and repetition avoidance.
- Style-specific reaction selection.
- Command argument parsing for new `/buddy` subcommands.

Manual verification:

- `FEATURE_BUDDY=1 bun run dev`
- Hatch or view Buddy with `/buddy`.
- Change name and style.
- Trigger read/edit/test-like tool flows.
- Confirm narrow terminal rendering stays usable.

## Implementation Order

1. Add companion profile types and safe config helpers.
2. Add runtime state types to AppState.
3. Add local event and reaction engine with tests.
4. Extend `/buddy` commands.
5. Wire conservative event sources into the REPL/tool flow.
6. Update `CompanionSprite` rendering for status labels.
7. Run typecheck and targeted tests.

## Acceptance Criteria

- Buddy can be personalized without editing config files manually.
- Buddy shows meaningful state changes during coding work.
- Buddy can react locally without Anthropic OAuth.
- Existing Buddy behavior still works.
- TUI remains stable in normal and narrow terminal widths.
- The implementation is feature-gated behind `FEATURE_BUDDY`.
