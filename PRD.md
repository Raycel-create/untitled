# Planning Guide

A fast-paced, one-button arcade game where players navigate a banana through obstacle gaps, testing reflexes and timing in an endless runner format.

**Experience Qualities**: 
1. **Immediate** - Zero friction from load to gameplay; tap to start, tap to play
2. **Addictive** - Quick death-retry loop that compels "just one more try" engagement
3. **Satisfying** - Crisp physics and responsive controls that feel rewarding to master

**Complexity Level**: Micro Tool (single-purpose)
  - Pure arcade gameplay with minimal UI chrome; entire experience revolves around the core mechanic of timing taps to navigate obstacles

## Essential Features

### Banana Flight Control
- **Functionality**: Player taps/clicks to make banana jump upward, gravity pulls it down
- **Purpose**: Core mechanic providing skill-based challenge through timing
- **Trigger**: Any tap/click on game area or spacebar press
- **Progression**: Game starts → Tap to begin → Each tap applies upward velocity → Gravity constantly pulls down → Player maintains altitude through gaps
- **Success criteria**: Banana responds instantly (<100ms) to input with smooth physics

### Scrolling Obstacles
- **Functionality**: Vertical pipes with gaps scroll from right to left at constant speed
- **Purpose**: Create challenge requiring precise altitude control
- **Trigger**: Starts automatically when game begins
- **Progression**: Pipes spawn off-right → Move leftward at steady pace → Despawn off-left → New pipes spawn with random gap positions
- **Success criteria**: Smooth 60fps scrolling, fair gap sizes (3-4x banana height), consistent spacing

### Collision Detection
- **Functionality**: Detect when banana hits pipes or boundaries (top/bottom)
- **Purpose**: Enforce challenge and trigger game over state
- **Trigger**: Every frame checks banana position against obstacles
- **Progression**: Continuous checking → Collision detected → Game freezes → Show score → Restart prompt
- **Success criteria**: Pixel-perfect detection with no false positives/negatives

### Score System
- **Functionality**: Increment counter each time banana passes through pipe gap
- **Purpose**: Provide achievement metric and replayability motivation
- **Trigger**: When banana's center crosses pipe's right edge
- **Progression**: Start at 0 → +1 per cleared pipe → Display current score → Save high score → Show both on game over
- **Success criteria**: Score increments exactly once per pipe, high score persists between sessions

### Quick Restart
- **Functionality**: Instant restart on tap after death
- **Purpose**: Minimize friction in death-retry loop to maintain engagement
- **Trigger**: Any tap/click after game over
- **Progression**: Game over shown → Tap anywhere → Instant reset to start position → Resume play
- **Success criteria**: <200ms from tap to playable state

## Edge Case Handling

- **Rapid Tapping**: Cap maximum upward velocity to prevent banana flying off-screen
- **Pause/Unfocus**: Game pauses automatically when tab loses focus to prevent unfair deaths
- **Initial State**: Game waits for first input before starting obstacle movement
- **High Score Loss**: Gracefully handle missing stored data, default to 0
- **Window Resize**: Maintain playable state and relative positions during resize

## Design Direction

The design should feel playful yet focused, with a minimalist interface that removes all visual noise except the essential gameplay elements, using bright cheerful colors that evoke casual mobile gaming while maintaining sharp, clear readability.

## Color Selection

Triadic color scheme to create vibrant, energetic contrast that keeps the eye engaged during fast gameplay.

- **Primary Color**: Sky Blue (oklch(0.75 0.15 230)) - Conveys open sky background, creates calming canvas for action
- **Secondary Colors**: 
  - Grass Green (oklch(0.65 0.18 145)) - Represents pipe obstacles, natural contrast to sky
  - Ground Brown (oklch(0.45 0.08 60)) - Defines play boundaries at top/bottom
- **Accent Color**: Banana Yellow (oklch(0.88 0.18 95)) - Hero character color, pops against all backgrounds
- **Foreground/Background Pairings**:
  - Background (Sky Blue oklch(0.75 0.15 230)): White text (oklch(1 0 0)) - Ratio 5.2:1 ✓
  - Pipes (Grass Green oklch(0.65 0.18 145)): White text (oklch(1 0 0)) - Ratio 4.8:1 ✓
  - UI Card (White oklch(0.98 0 0)): Dark text (oklch(0.25 0 0)) - Ratio 14.1:1 ✓
  - Accent (Banana Yellow oklch(0.88 0.18 95)): Dark text (oklch(0.25 0 0)) - Ratio 12.3:1 ✓

## Font Selection

Typography should be bold and instantly readable even during fast motion, using a rounded geometric sans-serif that matches the playful, arcade-style aesthetic.

- **Typographic Hierarchy**: 
  - Score Display: Poppins Bold/48px/tight tracking (-0.02em) - Large, always visible during play
  - Game Over: Poppins Bold/36px/normal tracking - Clear failure state messaging
  - High Score: Poppins SemiBold/24px/normal tracking - Secondary information hierarchy
  - Instructions: Poppins Medium/18px/relaxed tracking (0.01em) - Readable guidance text

## Animations

Animations should be crisp and responsive, prioritizing gameplay clarity over decorative flourishes, with subtle juice added only where it reinforces player actions or provides critical feedback.

- **Purposeful Meaning**: Rotation of banana based on velocity communicates trajectory, score pop reinforces achievement
- **Hierarchy of Movement**: 
  1. Player banana (critical) - Immediate rotation/position response
  2. Score increment - Quick scale bounce on +1
  3. Game over overlay - Fast fade-in (150ms) to restart quickly
  4. Background parallax - Subtle depth, slowest movement

## Component Selection

- **Components**: 
  - Custom Canvas element for game rendering (60fps required, shadcn not applicable)
  - Card for game over overlay with score display
  - Button for restart action on game over screen (if user clicks UI rather than anywhere)
- **Customizations**: 
  - Full-viewport canvas game area
  - Custom hitbox visualization (debug mode)
  - Score counter overlay positioned top-center
  - Banana sprite rendered as emoji or custom SVG
  - Pipe rendering with rounded caps using canvas rounded rectangles
- **States**: 
  - Game States: waiting → playing → game-over
  - Banana: normal flight vs. collision flash (red tint)
  - Score: normal vs. increment animation (scale 1 → 1.2 → 1)
- **Icon Selection**: 
  - ArrowClockwise (Phosphor) for restart button
  - Trophy (Phosphor) for high score indicator
- **Spacing**: 
  - Score: mt-8 from top edge
  - Game over card: Centered with p-8 internal padding
  - Gap-4 between score elements in overlay
- **Mobile**: 
  - Touch events work identically to clicks
  - Full-screen canvas fills viewport on all devices
  - Score text scales down to 36px on screens <640px
  - Simplified instructions: "TAP TO PLAY" on mobile vs "CLICK OR SPACE" on desktop
