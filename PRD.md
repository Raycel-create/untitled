# Planning Guide

An AI-powered creative studio that generates stunning images and videos from text descriptions, enabling users to bring their visual ideas to life through simple prompts.

**Experience Qualities**: 
1. **Inspiring** - Beautiful gallery showcasing AI's creative potential, encouraging experimentation
2. **Effortless** - Clean prompt-to-creation flow with minimal clicks between idea and output
3. **Delightful** - Smooth generation states and satisfying reveal animations that celebrate each creation

**Complexity Level**: Light Application (multiple features with basic state)
  - Dual-mode creation tool with persistent gallery, focusing on streamlined AI generation workflow with organized content management

## Essential Features

### Text-to-Image Generation
- **Functionality**: User enters text prompt, optionally selects style preset and applies editing tools to reference images, AI generates corresponding image
- **Purpose**: Enable quick visual ideation and artistic exploration with creative control
- **Trigger**: User types prompt and clicks "Generate Image" button
- **Progression**: Enter prompt → (Optional) Select style preset → (Optional) Edit reference images with tools → Click generate → Loading state with progress → Image reveals → Auto-saves to gallery → Option to regenerate or create new
- **Success criteria**: Images appear within 10 seconds, full resolution, properly formatted

### Style Presets
- **Functionality**: Quick-select predefined artistic styles that modify generation parameters
- **Purpose**: Enable rapid experimentation with different aesthetics without complex prompting
- **Trigger**: User clicks style preset chip
- **Progression**: Browse preset options → Click desired style → Visual indicator shows selection → Style automatically applied to next generation
- **Success criteria**: Presets visually distinct, apply instantly, clear selected state

### Image Editing Tools
- **Functionality**: Basic editing controls for reference images (crop, rotate, flip, brightness, contrast, blur)
- **Purpose**: Allow users to prepare and optimize reference images before generation
- **Trigger**: User clicks edit button on reference image thumbnail
- **Progression**: Upload reference → Click edit icon → Editor modal opens → Apply adjustments with sliders/buttons → Preview updates in real-time → Save or cancel → Edited image used in generation
- **Success criteria**: Edits apply smoothly, preview updates instantly, changes persist until regeneration

### Text-to-Video Generation
- **Functionality**: User enters text prompt, AI generates short video clip
- **Purpose**: Bring dynamic motion and storytelling to creative ideas
- **Trigger**: User types prompt and clicks "Generate Video" button
- **Progression**: Enter prompt → Click generate → Extended loading with progress indicator → Video reveals with playback controls → Auto-saves to gallery → Option to regenerate or create new
- **Success criteria**: Videos load properly, playback controls work smoothly, reasonable resolution and duration

### Persistent Gallery
- **Functionality**: Display all previously generated media in organized grid
- **Purpose**: Maintain creation history and enable revisiting past works
- **Trigger**: Automatically updates when new media is generated
- **Progression**: Media generated → Saved to storage → Appears in gallery grid → Click to view fullscreen → Delete option available
- **Success criteria**: All generated content persists between sessions, organized chronologically, quick access

### Media Preview & Management
- **Functionality**: Click any gallery item to view in fullscreen modal with actions
- **Purpose**: Examine details and manage individual creations
- **Trigger**: Click on gallery thumbnail
- **Progression**: Click thumbnail → Modal opens with full media → View controls (play/pause for video) → Download or delete options → Close to return
- **Success criteria**: Smooth modal transitions, video playback works reliably, downloads preserve quality

### Mode Switching
- **Functionality**: Toggle between image and video creation modes
- **Purpose**: Clear separation of creation types with appropriate UI/prompting
- **Trigger**: User clicks mode toggle tabs
- **Progression**: Select mode → UI updates with mode-specific prompt suggestions → Generate appropriate media type → Gallery filters to show current mode
- **Success criteria**: Instant mode switching, no state loss, clear visual distinction

### Multiple Reference Images
- **Functionality**: Upload up to 5 reference images via drag-drop, paste, or file selection
- **Purpose**: Provide AI with multiple visual references for better style and composition guidance
- **Trigger**: User uploads images to reference section
- **Progression**: Click/drop/paste images → Thumbnails appear → Edit or remove individual images → Used collectively during generation
- **Success criteria**: Smooth upload, clear visual feedback, max 5 enforced gracefully

### Subscription Tiers (Free vs Pro)
- **Functionality**: Two-tier system with usage limits on free tier and unlimited access on pro tier
- **Purpose**: Monetize while providing value at both levels, encourage upgrades for power users
- **Trigger**: User reaches free tier limits or clicks upgrade prompt
- **Progression**: Generate content → Track usage → Show limit warnings at 80% → Block at 100% with upgrade modal → Click upgrade → Payment flow (simulated) → Pro features unlocked immediately
- **Success criteria**: Limits enforced accurately, upgrade path clear and frictionless, pro features activate instantly

### 24/7 AI Assistant
- **Functionality**: Persistent chat assistant that helps with prompts, explains features, troubleshoots issues
- **Purpose**: Reduce friction, improve prompt quality, provide contextual help without leaving the app
- **Trigger**: Click assistant icon (always visible) or automatic suggestions in key moments
- **Progression**: Click assistant → Chat panel slides in → Ask question or accept suggestion → AI responds with specific help → Apply suggestions directly to prompt → Close or minimize assistant
- **Success criteria**: Responses relevant and helpful, appears within 2 seconds, maintains conversation context, unobtrusive when not needed

## Edge Case Handling

- **Generation Failures**: Show clear error message with retry option, don't lose prompt text
- **Long Prompts**: Support multi-line text areas with character count, reasonable limits
- **Empty Prompts**: Disable generate button until valid text entered
- **Slow Generations**: Show engaging loading states with time estimates
- **Storage Limits**: Graceful handling if gallery grows large, oldest items managed appropriately
- **Network Issues**: Detect connectivity problems, show appropriate messaging
- **Free Tier Limit Reached**: Clear messaging about upgrade benefits, don't block access to existing content
- **Assistant Unavailable**: Graceful degradation if AI service fails, show cached suggestions
- **Subscription Status Sync**: Handle edge cases where payment succeeds but status doesn't update immediately

## Design Direction

The design should feel professional yet approachable, like a modern creative tool with a gallery-forward interface that showcases the AI's output quality, using a sophisticated dark theme with vibrant accent colors that make generated content pop visually.

## Color Selection

Custom palette emphasizing a modern dark theme with electric accent colors for a premium creative tool aesthetic.

- **Primary Color**: Electric Purple (oklch(0.65 0.25 290)) - Represents AI creativity and innovation, eye-catching CTAs
- **Secondary Colors**: 
  - Deep Slate (oklch(0.20 0.02 250)) - Main background, creates depth and focus
  - Soft Cyan (oklch(0.75 0.15 210)) - Secondary actions and highlights
- **Accent Color**: Vibrant Pink (oklch(0.70 0.25 350)) - Video mode indicator, active states, energy
- **Foreground/Background Pairings**:
  - Background (Deep Slate oklch(0.20 0.02 250)): White text (oklch(0.98 0 0)) - Ratio 14.2:1 ✓
  - Card (oklch(0.25 0.02 250)): White text (oklch(0.98 0 0)) - Ratio 12.8:1 ✓
  - Primary (Electric Purple oklch(0.65 0.25 290)): White text (oklch(0.98 0 0)) - Ratio 5.1:1 ✓
  - Accent (Vibrant Pink oklch(0.70 0.25 350)): White text (oklch(0.98 0 0)) - Ratio 5.8:1 ✓

## Font Selection

Typography should feel modern and technical yet friendly, using a clean geometric sans-serif that conveys precision and creativity without being cold.

- **Typographic Hierarchy**: 
  - H1 (App Title): Inter Bold/32px/tight letter spacing (-0.01em)
  - H2 (Section Headers): Inter SemiBold/24px/normal tracking
  - Prompt Input: Inter Regular/16px/relaxed line-height (1.6)
  - Button Labels: Inter Medium/14px/wide tracking (0.02em)
  - Gallery Captions: Inter Regular/13px/normal tracking

## Animations

Motion should feel fluid and purposeful, with smooth state transitions that guide attention to new content while maintaining a premium, polished feel throughout the experience.

- **Purposeful Meaning**: Generation pulses communicate AI "thinking", reveal animations celebrate completion, smooth modal transitions maintain spatial context
- **Hierarchy of Movement**: 
  1. Generation state (critical) - Pulsing indicators, progress animations
  2. Media reveals - Satisfying fade + scale-up on completion
  3. Modal transitions - Smooth backdrop blur with content slide-in
  4. Gallery updates - Gentle fade-in for new items
  5. Hover states - Subtle lift and glow on interactive elements

## Component Selection

- **Components**: 
  - Tabs for mode switching (Image/Video)
  - Textarea for prompt input with character counter
  - Button for generate actions with loading states
  - Card for gallery items with hover effects
  - Dialog for fullscreen media preview and image editing
  - Progress indicator during generation
  - Badge for media type labels, style presets, and subscription tier
  - Separator for visual section breaks
  - Slider for image adjustment controls (brightness, contrast, blur)
  - Toggle buttons for image transformations (flip, rotate)
  - Sheet (sliding panel) for AI assistant chat interface
  - Alert for usage limit warnings and upgrade prompts
- **Customizations**: 
  - Custom video player controls overlay
  - Gradient overlays on gallery thumbnails for text readability
  - Shimmer loading effect for generation states
  - Custom scrollbar styling for gallery area
  - Canvas-based image editor with real-time preview
  - Chip-style style preset selector with visual indicators
- **States**: 
  - Generate button: default → loading (with spinner) → success
  - Gallery items: default → hover (lift + glow) → selected (modal open)
  - Mode tabs: inactive (muted) → active (primary color + underline)
  - Textarea: empty (placeholder) → typing → valid (ready to generate)
- **Icon Selection**: 
  - Sparkles (Phosphor) for generate buttons (AI magic)
  - Image (Phosphor) for image mode tab
  - Video (Phosphor) for video mode tab
  - Download (Phosphor) for save actions
  - Trash (Phosphor) for delete actions
  - X (Phosphor) for modal close
  - Play/Pause (Phosphor) for video controls
  - ChatCircleDots (Phosphor) for AI assistant
  - Crown (Phosphor) for pro tier badge
  - Lightning (Phosphor) for upgrade prompts
  - Question (Phosphor) for help hints
- **Spacing**: 
  - Container: max-w-7xl mx-auto with px-4 sm:px-6 lg:px-8
  - Sections: gap-8 between major sections
  - Gallery grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4
  - Form elements: gap-4 in prompt area
  - Card padding: p-6 for main content areas
- **Mobile**: 
  - Stack mode tabs vertically on small screens
  - Single column gallery on mobile
  - Fullscreen modals take entire viewport
  - Larger touch targets (min 44x44px) for all interactive elements
  - Collapsible prompt suggestions to save space
