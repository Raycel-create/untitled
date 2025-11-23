import { videoTemplates, animationStyles, type VideoTemplate, type AnimationStyle } from './video-templates'

export interface TemplateRecommendation {
  template: VideoTemplate
  score: number
  reasoning: string
}

export interface StyleRecommendation {
  style: AnimationStyle
  score: number
  reasoning: string
}

export interface RecommendationResult {
  templates: TemplateRecommendation[]
  styles: StyleRecommendation[]
  analysis: {
    mood: string[]
    motion: string[]
    category: string
    complexity: 'simple' | 'moderate' | 'complex'
  }
}

interface AnalysisResponse {
  mood: string[]
  motion: string[]
  category: 'motion' | 'transition' | 'effect' | 'storytelling'
  complexity: 'simple' | 'moderate' | 'complex'
  recommendedTemplates: Array<{ id: string; score: number; reasoning: string }>
  recommendedStyles: Array<{ id: string; score: number; reasoning: string }>
}

export async function analyzePromptAndRecommend(
  prompt: string,
  tier: 'free' | 'pro' = 'free'
): Promise<RecommendationResult> {
  if (!prompt.trim()) {
    return {
      templates: [],
      styles: [],
      analysis: {
        mood: [],
        motion: [],
        category: 'motion',
        complexity: 'simple'
      }
    }
  }

  try {
    const templateList = videoTemplates
      .filter(t => tier === 'pro' || !t.proOnly)
      .map(t => ({ id: t.id, name: t.name, description: t.description, category: t.category }))

    const styleList = animationStyles
      .filter(s => tier === 'pro' || !s.proOnly)
      .map(s => ({ id: s.id, name: s.name, description: s.description, moodTags: s.moodTags }))

    const analysisPrompt = `You are an AI video production expert. Analyze this user prompt for video generation and recommend the best templates and animation styles.

User Prompt: "${prompt}"

Available Templates:
${JSON.stringify(templateList, null, 2)}

Available Animation Styles:
${JSON.stringify(styleList, null, 2)}

Analyze the prompt and provide recommendations in this exact JSON structure:
{
  "mood": ["array", "of", "mood", "descriptors"],
  "motion": ["array", "of", "motion", "types"],
  "category": "motion|transition|effect|storytelling",
  "complexity": "simple|moderate|complex",
  "recommendedTemplates": [
    { "id": "template-id", "score": 95, "reasoning": "why this template fits" }
  ],
  "recommendedStyles": [
    { "id": "style-id", "score": 90, "reasoning": "why this style fits" }
  ]
}

Guidelines:
- Recommend 3-5 templates sorted by score (0-100)
- Recommend 2-3 styles sorted by score (0-100)
- Score based on how well the template/style matches the prompt's intent, mood, and motion
- Provide clear, concise reasoning for each recommendation
- Consider the visual intent, pacing, and emotional tone of the prompt`

    const response = await window.spark.llm(analysisPrompt, 'gpt-4o-mini', true)
    const analysis: AnalysisResponse = JSON.parse(response)

    const templates: TemplateRecommendation[] = analysis.recommendedTemplates
      .map(rec => {
        const template = videoTemplates.find(t => t.id === rec.id)
        if (!template) return null
        if (tier === 'free' && template.proOnly) return null
        return {
          template,
          score: rec.score,
          reasoning: rec.reasoning
        }
      })
      .filter((t): t is TemplateRecommendation => t !== null)
      .slice(0, 5)

    const styles: StyleRecommendation[] = analysis.recommendedStyles
      .map(rec => {
        const style = animationStyles.find(s => s.id === rec.id)
        if (!style) return null
        if (tier === 'free' && style.proOnly) return null
        return {
          style,
          score: rec.score,
          reasoning: rec.reasoning
        }
      })
      .filter((s): s is StyleRecommendation => s !== null)
      .slice(0, 3)

    return {
      templates,
      styles,
      analysis: {
        mood: analysis.mood,
        motion: analysis.motion,
        category: analysis.category,
        complexity: analysis.complexity
      }
    }
  } catch (error) {
    console.error('Recommendation analysis error:', error)
    
    return fallbackRecommendations(prompt, tier)
  }
}

function fallbackRecommendations(prompt: string, tier: 'free' | 'pro'): RecommendationResult {
  const lowerPrompt = prompt.toLowerCase()
  
  const templates: TemplateRecommendation[] = []
  const styles: StyleRecommendation[] = []
  
  const availableTemplates = videoTemplates.filter(t => tier === 'pro' || !t.proOnly)
  const availableStyles = animationStyles.filter(s => tier === 'pro' || !s.proOnly)

  if (lowerPrompt.includes('zoom') || lowerPrompt.includes('close')) {
    const template = availableTemplates.find(t => t.id === 'epic-zoom')
    if (template) {
      templates.push({
        template,
        score: 85,
        reasoning: 'Prompt mentions zoom or close-up movement'
      })
    }
  }

  if (lowerPrompt.includes('rotate') || lowerPrompt.includes('around') || lowerPrompt.includes('orbit')) {
    const template = availableTemplates.find(t => t.id === 'orbital-rotation')
    if (template) {
      templates.push({
        template,
        score: 85,
        reasoning: 'Prompt suggests rotational or orbital movement'
      })
    }
  }

  if (lowerPrompt.includes('slow') || lowerPrompt.includes('elegant') || lowerPrompt.includes('smooth')) {
    const style = availableStyles.find(s => s.id === 'smooth-elegant')
    if (style) {
      styles.push({
        style,
        score: 80,
        reasoning: 'Prompt indicates smooth, elegant motion'
      })
    }
  }

  if (lowerPrompt.includes('fast') || lowerPrompt.includes('energy') || lowerPrompt.includes('dynamic')) {
    const style = availableStyles.find(s => s.id === 'energetic-dynamic')
    if (style) {
      styles.push({
        style,
        score: 80,
        reasoning: 'Prompt suggests energetic, dynamic motion'
      })
    }
  }

  if (templates.length === 0) {
    const cinematic = availableTemplates.find(t => t.id === 'cinematic-pan')
    if (cinematic) {
      templates.push({
        template: cinematic,
        score: 70,
        reasoning: 'Versatile cinematic movement suitable for most scenarios'
      })
    }
  }

  if (styles.length === 0) {
    const organic = availableStyles.find(s => s.id === 'organic-natural')
    if (organic) {
      styles.push({
        style: organic,
        score: 70,
        reasoning: 'Natural, adaptable style that works well for various content'
      })
    }
  }

  return {
    templates,
    styles,
    analysis: {
      mood: ['creative'],
      motion: ['dynamic'],
      category: 'motion',
      complexity: 'moderate'
    }
  }
}

export function getRecommendationBadgeColor(score: number): string {
  if (score >= 90) return 'bg-primary'
  if (score >= 75) return 'bg-secondary'
  if (score >= 60) return 'bg-accent'
  return 'bg-muted'
}
