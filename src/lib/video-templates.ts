export interface VideoTemplate {
  id: string
  name: string
  description: string
  category: 'motion' | 'transition' | 'effect' | 'storytelling'
  promptModifier: string
  icon: string
  duration?: string
  proOnly?: boolean
}

export const videoTemplates: VideoTemplate[] = [
  {
    id: 'cinematic-pan',
    name: 'Cinematic Pan',
    description: 'Smooth horizontal camera movement',
    category: 'motion',
    promptModifier: 'cinematic slow pan movement, smooth horizontal camera motion, professional cinematography',
    icon: '🎬',
    duration: '3-5s'
  },
  {
    id: 'epic-zoom',
    name: 'Epic Zoom',
    description: 'Dramatic zoom in or out',
    category: 'motion',
    promptModifier: 'dramatic zoom motion, epic camera movement, slow zoom revealing details',
    icon: '🔍',
    duration: '3-5s'
  },
  {
    id: 'orbital-rotation',
    name: 'Orbital Rotation',
    description: 'Camera rotating around subject',
    category: 'motion',
    promptModifier: 'orbital camera rotation, 360-degree rotating movement around subject, smooth circular motion',
    icon: '🌀',
    duration: '4-6s'
  },
  {
    id: 'drone-flyover',
    name: 'Drone Flyover',
    description: 'Aerial perspective movement',
    category: 'motion',
    promptModifier: 'aerial drone shot, flyover perspective, smooth overhead camera movement',
    icon: '🚁',
    duration: '4-6s',
    proOnly: true
  },
  {
    id: 'tracking-shot',
    name: 'Tracking Shot',
    description: 'Following a moving subject',
    category: 'motion',
    promptModifier: 'smooth tracking shot following subject, professional camera tracking, dynamic following movement',
    icon: '🎯',
    duration: '3-5s'
  },
  {
    id: 'slow-motion',
    name: 'Slow Motion',
    description: 'Dramatic slow-mo effect',
    category: 'effect',
    promptModifier: 'slow motion effect, time-slowed movement, dramatic slow-mo, high frame rate',
    icon: '⏱️',
    duration: '3-5s'
  },
  {
    id: 'time-lapse',
    name: 'Time-lapse',
    description: 'Accelerated time progression',
    category: 'effect',
    promptModifier: 'time-lapse effect, accelerated time passage, fast-forward motion, compressed time',
    icon: '⏩',
    duration: '3-5s'
  },
  {
    id: 'morphing',
    name: 'Morphing',
    description: 'Smooth transformation between forms',
    category: 'transition',
    promptModifier: 'smooth morphing transformation, fluid shape-shifting, seamless metamorphosis',
    icon: '🦋',
    duration: '3-4s',
    proOnly: true
  },
  {
    id: 'fade-transition',
    name: 'Fade Through',
    description: 'Elegant fade transition',
    category: 'transition',
    promptModifier: 'smooth fade transition, elegant dissolve effect, gradual scene change',
    icon: '✨',
    duration: '2-3s'
  },
  {
    id: 'particle-explosion',
    name: 'Particle Burst',
    description: 'Explosive particle effects',
    category: 'effect',
    promptModifier: 'particle explosion effect, dynamic particle burst, energetic particles dispersing',
    icon: '💥',
    duration: '2-4s',
    proOnly: true
  },
  {
    id: 'liquid-motion',
    name: 'Liquid Flow',
    description: 'Fluid, flowing movement',
    category: 'effect',
    promptModifier: 'liquid flowing motion, fluid dynamics, smooth water-like movement, organic flow',
    icon: '💧',
    duration: '3-5s'
  },
  {
    id: 'glitch-effect',
    name: 'Digital Glitch',
    description: 'Cyberpunk glitch aesthetic',
    category: 'effect',
    promptModifier: 'digital glitch effect, cyberpunk aesthetic, RGB split, scan lines, digital distortion',
    icon: '⚡',
    duration: '2-3s'
  },
  {
    id: 'rising-reveal',
    name: 'Rising Reveal',
    description: 'Upward unveiling motion',
    category: 'storytelling',
    promptModifier: 'rising reveal shot, upward camera tilt revealing scene, dramatic vertical reveal',
    icon: '⬆️',
    duration: '3-5s'
  },
  {
    id: 'narrative-sequence',
    name: 'Story Sequence',
    description: 'Beginning, middle, end progression',
    category: 'storytelling',
    promptModifier: 'narrative sequence, story progression from beginning to end, cinematic storytelling',
    icon: '📖',
    duration: '5-8s',
    proOnly: true
  },
  {
    id: 'day-to-night',
    name: 'Day to Night',
    description: 'Time of day transition',
    category: 'transition',
    promptModifier: 'day to night transition, lighting change from daylight to evening, time progression',
    icon: '🌅',
    duration: '4-6s'
  },
  {
    id: 'parallax-layers',
    name: 'Parallax Depth',
    description: 'Multi-layer depth effect',
    category: 'motion',
    promptModifier: 'parallax depth effect, layered movement, multi-plane motion, depth-of-field animation',
    icon: '🎨',
    duration: '3-5s',
    proOnly: true
  },
  {
    id: 'kaleidoscope',
    name: 'Kaleidoscope',
    description: 'Symmetrical pattern evolution',
    category: 'effect',
    promptModifier: 'kaleidoscope effect, symmetrical patterns, rotating mandala, mirror-image animation',
    icon: '🔮',
    duration: '3-5s'
  },
  {
    id: 'whip-pan',
    name: 'Whip Pan',
    description: 'Fast transitional camera whip',
    category: 'transition',
    promptModifier: 'whip pan transition, fast camera whip movement, rapid scene change, motion blur transition',
    icon: '💨',
    duration: '1-2s'
  },
  {
    id: 'bokeh-focus',
    name: 'Bokeh Focus',
    description: 'Depth-of-field shift',
    category: 'effect',
    promptModifier: 'bokeh focus effect, depth-of-field shift, selective focus change, blurred background',
    icon: '⭕',
    duration: '3-4s'
  },
  {
    id: 'retro-film',
    name: 'Retro Film',
    description: 'Vintage film aesthetic',
    category: 'effect',
    promptModifier: 'vintage film effect, retro 8mm aesthetic, film grain, color grading, nostalgic look',
    icon: '📹',
    duration: '3-5s'
  }
]

export interface AnimationStyle {
  id: string
  name: string
  description: string
  speedModifier: 'slow' | 'normal' | 'fast' | 'variable'
  moodTags: string[]
  promptEnhancer: string
  proOnly?: boolean
}

export const animationStyles: AnimationStyle[] = [
  {
    id: 'smooth-elegant',
    name: 'Smooth & Elegant',
    description: 'Graceful, flowing movements',
    speedModifier: 'slow',
    moodTags: ['elegant', 'luxurious', 'refined'],
    promptEnhancer: 'smooth elegant motion, graceful flowing movements, refined animation, silk-like transitions'
  },
  {
    id: 'energetic-dynamic',
    name: 'Energetic & Dynamic',
    description: 'Fast-paced, exciting action',
    speedModifier: 'fast',
    moodTags: ['energetic', 'exciting', 'vibrant'],
    promptEnhancer: 'dynamic energetic motion, fast-paced action, exciting movements, high energy animation'
  },
  {
    id: 'dreamlike-surreal',
    name: 'Dreamlike & Surreal',
    description: 'Ethereal, otherworldly motion',
    speedModifier: 'slow',
    moodTags: ['dreamy', 'surreal', 'mystical'],
    promptEnhancer: 'dreamlike surreal motion, ethereal floating movements, otherworldly animation, mystical flow',
    proOnly: true
  },
  {
    id: 'mechanical-precise',
    name: 'Mechanical & Precise',
    description: 'Sharp, technical movements',
    speedModifier: 'normal',
    moodTags: ['precise', 'technical', 'industrial'],
    promptEnhancer: 'mechanical precise motion, technical accuracy, robotic movements, engineered animation'
  },
  {
    id: 'organic-natural',
    name: 'Organic & Natural',
    description: 'Nature-inspired, fluid motion',
    speedModifier: 'variable',
    moodTags: ['organic', 'natural', 'flowing'],
    promptEnhancer: 'organic natural motion, nature-inspired movement, fluid biological animation, living flow'
  },
  {
    id: 'cinematic-epic',
    name: 'Cinematic & Epic',
    description: 'Grand, movie-quality motion',
    speedModifier: 'slow',
    moodTags: ['cinematic', 'epic', 'dramatic'],
    promptEnhancer: 'cinematic epic motion, movie-quality animation, dramatic movements, Hollywood-style cinematography',
    proOnly: true
  },
  {
    id: 'playful-bouncy',
    name: 'Playful & Bouncy',
    description: 'Fun, cartoon-like motion',
    speedModifier: 'fast',
    moodTags: ['playful', 'fun', 'cheerful'],
    promptEnhancer: 'playful bouncy motion, cartoon-like animation, fun exaggerated movements, cheerful dynamics'
  },
  {
    id: 'minimal-subtle',
    name: 'Minimal & Subtle',
    description: 'Understated, gentle motion',
    speedModifier: 'slow',
    moodTags: ['minimal', 'subtle', 'calm'],
    promptEnhancer: 'minimal subtle motion, understated animation, gentle movements, calm transitions'
  },
  {
    id: 'glitchy-digital',
    name: 'Glitchy & Digital',
    description: 'Tech-inspired, stuttered motion',
    speedModifier: 'variable',
    moodTags: ['digital', 'futuristic', 'glitchy'],
    promptEnhancer: 'glitchy digital motion, tech-inspired animation, stuttered movements, cyberpunk aesthetic'
  },
  {
    id: 'retro-vintage',
    name: 'Retro & Vintage',
    description: 'Classic, nostalgic motion',
    speedModifier: 'normal',
    moodTags: ['retro', 'vintage', 'nostalgic'],
    promptEnhancer: 'retro vintage motion, classic animation style, nostalgic movements, old-school cinematography'
  }
]

export function getTemplatesByCategory(category: VideoTemplate['category']): VideoTemplate[] {
  return videoTemplates.filter(t => t.category === category)
}

export function getProTemplates(): VideoTemplate[] {
  return videoTemplates.filter(t => t.proOnly)
}

export function combineTemplateAndStyle(
  template: VideoTemplate | null,
  style: AnimationStyle | null,
  userPrompt: string
): string {
  const parts: string[] = [userPrompt]
  
  if (template) {
    parts.push(template.promptModifier)
  }
  
  if (style) {
    parts.push(style.promptEnhancer)
  }
  
  return parts.join(', ')
}
