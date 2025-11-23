# Planning Guide

An AI-powered creative studio with secure authentication that generates stunning images and videos from text descriptions, featuring a dedicated CEO dashboard for executive control over API integrations and financial connections.

**Experience Qualities**: 
1. **Secure** - Professional authentication system with role-based access and encrypted credentials
2. **Inspiring** - Beautiful gallery showcasing AI's creative potential, encouraging experimentation
3. **Powerful** - Executive tools for API management and bank integration alongside creative features

**Complexity Level**: Light Application (multiple features with basic state)
  - Multi-role application with authentication, dual-mode creation tool, persistent gallery, and executive dashboard for business management

## Essential Features

### Authentication System
- **Functionality**: User sign-in/sign-up with email/password, role-based access (user/ceo), demo accounts
- **Purpose**: Secure access control and personalized experiences based on user role
- **Trigger**: User opens app without existing session
- **Progression**: Landing page loads → User enters credentials or clicks demo → Validation → Role detection → Redirect to appropriate interface
- **Success criteria**: Secure password validation, session persistence, smooth role-based routing

### CEO Dashboard
- **Functionality**: Secure executive control panel with admin authentication, API key management, bank integrations, analytics overview, and real-time metrics
- **Purpose**: Provide business leaders with operational control and financial visibility through password-protected access
- **Trigger**: User clicks "CEO Mode" button and enters valid admin credentials (username: adminadmin, password: 19780111)
- **Progression**: Click CEO Mode → Admin login modal appears → Enter credentials → Authenticate → Dashboard loads → View metrics → Manage API keys → Connect banks → Monitor activity → Sign out to return to main app
- **Success criteria**: Secure authentication with password protection, 8-hour session persistence, all executive functions accessible, real-time updates, secure credential storage

### Multi-Factor Authentication (MFA)
- **Functionality**: Two-step authentication system requiring username/password and time-based verification code for CEO dashboard access
- **Purpose**: Enhanced security for executive features, preventing unauthorized access even if password is compromised
- **Trigger**: User clicks "CEO Mode" button in main header
- **Progression**: Click CEO Mode → Login dialog opens → Enter username and password → Validate credentials → Generate 6-digit MFA code (5-minute expiry) → Display code in toast/console → Enter code in InputOTP component → Validate code with attempt tracking (max 3 attempts) → Create 8-hour session with MFA flag → Grant access to CEO dashboard → Session persists across refreshes → Expires after 8 hours or manual logout
- **Success criteria**: Credentials validated securely, MFA code generates properly, timer displays remaining time, attempt tracking works, sessions persist with MFA verification flag, clear error messages for failed attempts at each step, smooth two-step authentication flow

### Bank Integration
- **Functionality**: Connect and manage multiple business bank accounts with balance tracking
- **Purpose**: Financial oversight and account management for executives
- **Trigger**: CEO clicks "Connect Bank" in dashboard
- **Progression**: Click connect → Select bank → Authenticate (simulated) → Account linked → Balance syncs → Appears in dashboard
- **Success criteria**: Multiple accounts supported, balances display correctly, secure storage

### Executive API Management
- **Functionality**: Configure API keys for multiple AI providers from centralized dashboard
- **Purpose**: IT control over service integrations with visibility and security
- **Trigger**: CEO navigates to API Keys tab
- **Progression**: Select provider → Enter key → Validate → Store securely → Monitor status → Remove if needed
- **Success criteria**: Support 6+ providers, masked display, secure storage, easy removal

### API Key Management
- **Functionality**: Users configure their own AI provider API keys (OpenAI, Stability AI, Replicate, RunwayML)
- **Purpose**: Enable users to bring their own API access while maintaining privacy and control
- **Trigger**: User clicks API key icon in header or prompted when attempting generation without keys
- **Progression**: Click API key icon → Modal opens showing providers → Add/edit key for provider → Validate format → Save securely → Keys stored in browser only → Use in generation requests
- **Success criteria**: Keys stored securely in browser, masked in UI, format validation works, clear error messages

### Text-to-Image Generation
- **Functionality**: User enters text prompt, optionally selects style preset and applies editing tools to reference images, AI generates corresponding image with support for batch generation and image-to-image transformations
- **Purpose**: Enable quick visual ideation and artistic exploration with creative control and efficient variation generation
- **Trigger**: User types prompt and clicks "Generate Image" button
- **Progression**: Check API keys configured → Enter prompt → (Optional) Select style preset → (Optional) Enable image-to-image mode and adjust strength → (Optional) Set batch count for multiple variations → (Optional) Edit reference images with tools → Click generate → Loading state with progress → Image(s) reveal → Auto-saves to gallery → Option to regenerate or create new
- **Success criteria**: Images appear within 10 seconds, full resolution, properly formatted, batch generations complete successfully

### Image-to-Image Transformation
- **Functionality**: Transform existing reference images using text prompts with adjustable transformation strength
- **Purpose**: Enable users to modify and evolve existing images while maintaining core composition and style
- **Trigger**: User uploads reference image and enables image-to-image mode
- **Progression**: Upload reference image → Toggle image-to-image mode → Adjust transformation strength slider (10-100%) → Enter transformation prompt → Generate → AI transforms image based on prompt and strength → Result saved to gallery
- **Success criteria**: Transformations respect strength setting, lower values stay closer to reference, clear visual feedback

### Batch Generation
- **Functionality**: Generate 1-5 variations simultaneously from a single prompt (2 max on free tier, 5 max on pro tier)
- **Purpose**: Explore multiple creative interpretations efficiently and compare variations side-by-side
- **Trigger**: User adjusts batch count slider before generating
- **Progression**: Enter prompt → Adjust batch slider → See real-time count and generation cost → Click generate → Progress shows current batch progress → All variations saved to gallery → Usage counter increments by batch count
- **Success criteria**: All requested variations generate successfully, progress tracking accurate, usage properly tracked

### Image Upscaling
- **Functionality**: Enhance generated images with 4x resolution upscaling (Pro feature only)
- **Purpose**: Transform images to higher resolution for print or detailed viewing
- **Trigger**: User clicks "Upscale 4x" button in image detail modal
- **Progression**: Open image detail → Click upscale button → Progress indicator shows upscaling stages → Enhanced image saved as new gallery item with "(Upscaled 4x)" label → Original preserved
- **Success criteria**: 4x resolution achieved, image quality improved, separate gallery entry created

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
- **Functionality**: User enters text prompt, optionally selects video template and animation style, AI generates short video clip with applied effects
- **Purpose**: Bring dynamic motion and storytelling to creative ideas with professional-quality templates and animation presets
- **Trigger**: User types prompt and clicks "Generate Video" button
- **Progression**: Enter prompt → (Optional) Select video template (Motion, Transition, Effect, Storytelling) → (Optional) Select animation style → Click generate → Extended loading with progress indicator → Video reveals with playback controls → Auto-saves to gallery → Option to regenerate or create new
- **Success criteria**: Videos load properly, playback controls work smoothly, reasonable resolution and duration, templates apply correctly

### Video Templates
- **Functionality**: 20+ preset video motion templates across 4 categories (Motion, Transition, Effect, Storytelling) with specific camera movements, transitions, and effects
- **Purpose**: Enable users to quickly create professional-quality video animations without complex prompting or technical knowledge
- **Trigger**: User switches to video mode and browses template categories
- **Progression**: Open video tab → Browse template categories (Motion/Transition/Effect/Storytelling) → Preview template descriptions → Select desired template → Template modifiers automatically enhance prompt → Generate video with applied template → Result includes selected motion/effect
- **Success criteria**: Templates categorized clearly, descriptions helpful, Pro-only templates indicated, templates combine properly with user prompts

### Animation Styles
- **Functionality**: 10 preset animation style modifiers (Smooth & Elegant, Energetic & Dynamic, Dreamlike & Surreal, etc.) that control movement speed, mood, and aesthetic
- **Purpose**: Apply consistent motion personality and pacing to videos, making it easy to match brand aesthetics or creative vision
- **Trigger**: User selects animation style after choosing video template
- **Progression**: Select video template → Browse animation styles → Choose style that matches desired mood → Style automatically applies speed and mood modifiers → Generate video with combined template + style → Result reflects both template motion and style personality
- **Success criteria**: Styles visually distinct, combine well with templates, Pro styles clearly marked, preview descriptions accurate

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
- **Functionality**: Two-tier system with usage limits on free tier (10/month, 2 batch max, no upscaling) and unlimited access on pro tier (unlimited, 5 batch max, upscaling enabled)
- **Purpose**: Monetize while providing value at both levels, encourage upgrades for power users
- **Trigger**: User reaches free tier limits or clicks upgrade prompt
- **Progression**: Generate content → Track usage → Show limit warnings at 80% → Block at 100% with upgrade modal → Click upgrade → Payment flow (simulated) → Pro features unlocked immediately (batch up to 5, upscaling enabled)
- **Success criteria**: Limits enforced accurately, upgrade path clear and frictionless, pro features activate instantly

### 24/7 AI Assistant
- **Functionality**: Persistent chat assistant that helps with prompts, explains features, troubleshoots issues
- **Purpose**: Reduce friction, improve prompt quality, provide contextual help without leaving the app
- **Trigger**: Click assistant icon (always visible) or automatic suggestions in key moments
- **Progression**: Click assistant → Chat panel slides in → Ask question or accept suggestion → AI responds with specific help → Apply suggestions directly to prompt → Close or minimize assistant
- **Success criteria**: Responses relevant and helpful, appears within 2 seconds, maintains conversation context, unobtrusive when not needed

## Edge Case Handling

- **Unauthenticated Access**: Redirect to landing page, preserve no sensitive data
- **Invalid Credentials**: Clear error messages, no account lockout on demo
- **Role-Based Access**: CEO sees dashboard, regular users see creative studio
- **Session Persistence**: Auth state survives refresh, sign out clears completely
- **Admin Authentication Failures**: Clear error messaging for incorrect credentials at both password and MFA stages, no account lockout, credential input cleared after failed attempt
- **Expired Admin Sessions**: Auto-logout after 8 hours, redirect to main app, require re-authentication (both password and MFA) for CEO access
- **Expired MFA Codes**: 5-minute expiry with countdown timer, automatic reset flow when expired, option to resend new code
- **MFA Attempt Limits**: Max 3 attempts per code, automatic reset flow after exceeded attempts, new code generation on resend
- **MFA Code Display**: Code shown in toast notification and console log for demo purposes, production would send via email/SMS
- **CEO Mode Access Attempts**: Button always visible, two-step authentication dialog prevents unauthorized access
- **No API Keys Configured**: Banner displayed prominently, generation disabled with clear messaging, one-click access to key management
- **Invalid API Keys**: Format validation on input, helpful error messages guide correction
- **API Request Failures**: Detect provider errors vs network issues, show specific error messages, suggest checking API key validity
- **Generation Failures**: Show clear error message with retry option, don't lose prompt text
- **Template + Style Combinations**: All valid combinations work correctly, prompt enhancements layer properly
- **Pro Template Access on Free Tier**: Show upgrade prompt with clear messaging about Pro requirement
- **Batch Generation Partial Failures**: If some images in batch fail, save successful ones and show error count
- **Upscaling on Free Tier**: Show upgrade prompt with clear messaging about Pro requirement
- **Upscaling Failures**: Clear error messaging, original image preserved, suggest retrying
- **Image-to-Image Without Reference**: Disable option until reference image uploaded
- **Batch Count Exceeds Tier Limit**: Automatically cap at tier maximum, show upgrade prompt for higher limits
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
  - Tabs for mode switching (Image/Video), dashboard navigation (Overview/API/Banking), and video template categories (Motion/Transition/Effect/Storytelling)
  - Card for authentication forms, gallery items, dashboard metrics, bank accounts, API providers, video templates, and animation styles
  - ScrollArea for video template and animation style selectors with many options
  - Input for email, password, name, API keys with secure masking
  - Textarea for prompt input with character counter
  - Button for generate actions with loading states
  - Card for gallery items with hover effects
  - Dialog for fullscreen media preview, image editing, two-step MFA authentication, and API key management
  - InputOTP for secure 6-digit MFA code entry with visual feedback
  - Progress indicator during generation and upscaling
  - Badge for media type labels, style presets, subscription tier, key status, and Pro-only features
  - Separator for visual section breaks
  - Slider for image adjustment controls (brightness, contrast, blur), transformation strength, and batch count
  - Toggle buttons for image transformations (flip, rotate)
  - Checkbox for enabling image-to-image mode
  - Sheet (sliding panel) for AI assistant chat interface
  - Alert for MFA timer display, usage limit warnings, upgrade prompts, and API key notices
  - Input for secure API key entry with show/hide toggle
  - Label for form field identification
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
  - Crown (Phosphor) for CEO role, pro tier badge, and Pro-only features
  - Template category icons: emoji-based visual indicators for each template (🎬, 🔍, 🌀, etc.)
  - Shield (Phosphor) for authentication/security
  - ShieldCheck (Phosphor) for MFA verification
  - Lock (Phosphor) for admin authentication
  - Timer (Phosphor) for MFA code countdown
  - ArrowLeft (Phosphor) for navigation back to credentials step
  - SignIn (Phosphor) for login actions
  - SignOut (Phosphor) for logout actions
  - Bank (Phosphor) for financial features
  - Wallet (Phosphor) for balance display
  - CreditCard (Phosphor) for payment features
  - Image (Phosphor) for image mode tab
  - Video (Phosphor) for video mode tab
  - Download (Phosphor) for save actions
  - Trash (Phosphor) for delete actions
  - X (Phosphor) for modal close
  - Play/Pause (Phosphor) for video controls
  - ChatCircleDots (Phosphor) for AI assistant
  - Lightning (Phosphor) for CEO mode toggle and upgrade prompts
  - Question (Phosphor) for help hints
  - Key (Phosphor) for API key management
  - Eye/EyeSlash (Phosphor) for show/hide API keys
  - Check (Phosphor) for configured status
  - Info (Phosphor) for informational alerts
  - ArrowsOut (Phosphor) for upscaling action
  - Stack (Phosphor) for batch generation indicator
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
