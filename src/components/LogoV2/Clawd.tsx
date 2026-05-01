import * as React from 'react'
import { Box, Text } from '@anthropic/ink'
import { env } from '../../utils/env.js'

export type ClawdPose =
  | 'default'
  | 'arms-up' // growth / flourishing
  | 'look-left' // looking at data
  | 'look-right' // looking at results

type Props = {
  pose?: ClawdPose
}

// 🌾 Rice seedling ASCII art — AgriAgent mascot
// A small rice seedling with eyes, changing expression per pose.
// 9 cols wide to match original layout.

type Segments = {
  /** row 1: leaf tips */
  r1: string
  /** row 2: head with eyes */
  r2: string
  /** row 3: stem */
  r3: string
  /** row 4: roots */
  r4: string
}

const POSES: Record<ClawdPose, Segments> = {
  default: {
    r1: '  ╱│╲  ',
    r2: ' (◕│◕) ',
    r3: '  ╱│╲  ',
    r4: '  ╱ ╲  ',
  },
  'look-left': {
    r1: '  ╱│╲  ',
    r2: ' (◄│►) ',
    r3: '  ╱│╲  ',
    r4: '  ╱ ╲  ',
  },
  'look-right': {
    r1: '  ╱│╲  ',
    r2: ' (►│◄) ',
    r3: '  ╱│╲  ',
    r4: '  ╱ ╲  ',
  },
  'arms-up': {
    r1: ' ╱│││╲ ',
    r2: ' (◕│◕) ',
    r3: '  ╱│╲  ',
    r4: '  ╱ ╲  ',
  },
}

// Apple Terminal fallback — simple rice shape
const APPLE_ART: Record<ClawdPose, string[]> = {
  default: ['  🌱  ', ' ◕│◕ ', '  │   ', ' ╱ ╲  '],
  'look-left': ['  🌱  ', ' ◄│► ', '  │   ', ' ╱ ╲  '],
  'look-right': ['  🌱  ', ' ►│◄ ', '  │   ', ' ╱ ╲  '],
  'arms-up': [' 🌿  ', ' ◕│◕ ', '  │   ', ' ╱ ╲  '],
}

export function Clawd({ pose = 'default' }: Props = {}): React.ReactNode {
  if (env.terminal === 'Apple_Terminal') {
    return <AppleTerminalClawd pose={pose} />
  }
  const p = POSES[pose]
  return (
    <Box flexDirection="column">
      <Text color="green">{p.r1}</Text>
      <Text>
        <Text color="green">{' '}</Text>
        <Text color="green" bold>{p.r2.slice(1, -1)}</Text>
        <Text color="green">{' '}</Text>
      </Text>
      <Text color="green">{p.r3}</Text>
      <Text color="yellow">{p.r4}</Text>
    </Box>
  )
}

function AppleTerminalClawd({ pose }: { pose: ClawdPose }): React.ReactNode {
  const lines = APPLE_ART[pose]
  return (
    <Box flexDirection="column" alignItems="center">
      {lines.map((line, i) => (
        <Text key={i} color={i === 3 ? 'yellow' : 'green'}>
          {line}
        </Text>
      ))}
    </Box>
  )
}
