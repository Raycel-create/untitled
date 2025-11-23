import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sparkle, Check, Crown, MagicWand, Lightbulb, TrendUp } from '@phosphor-icons/react'
import { analyzePromptAndRecommend, type RecommendationResult, getRecommendationBadgeColor } from '@/lib/template-recommender'
import { type VideoTemplate, type AnimationStyle } from '@/lib/video-templates'
import { toast } from 'sonner'

interface TemplateRecommendationsProps {
  prompt: string
  tier: 'free' | 'pro'
  selectedTemplate: VideoTemplate | null
  selectedStyle: AnimationStyle | null
  onSelectTemplate: (template: VideoTemplate) => void
  onSelectStyle: (style: AnimationStyle) => void
  onClose: () => void
}

export function TemplateRecommendations({
  prompt,
  tier,
  selectedTemplate,
  selectedStyle,
  onSelectTemplate,
  onSelectStyle,
  onClose
}: TemplateRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    if (prompt.trim()) {
      analyzePrompt()
    }
  }, [])

  const analyzePrompt = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first')
      return
    }

    setIsAnalyzing(true)
    try {
      const result = await analyzePromptAndRecommend(prompt, tier)
      setRecommendations(result)
      
      if (result.templates.length === 0 && result.styles.length === 0) {
        toast.info('No strong recommendations found', {
          description: 'Your prompt works well without templates!'
        })
      } else {
        toast.success('Recommendations ready!', {
          description: `Found ${result.templates.length} templates and ${result.styles.length} styles`
        })
      }
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error('Failed to analyze prompt')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleApplyTemplate = (template: VideoTemplate) => {
    onSelectTemplate(template)
    toast.success(`Applied: ${template.name}`)
  }

  const handleApplyStyle = (style: AnimationStyle) => {
    onSelectStyle(style)
    toast.success(`Applied: ${style.name}`)
  }

  const isTemplateSelected = (template: VideoTemplate) => 
    selectedTemplate?.id === template.id

  const isStyleSelected = (style: AnimationStyle) => 
    selectedStyle?.id === style.id

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <MagicWand weight="fill" size={24} className="text-primary" />
            <h3 className="text-lg font-semibold">AI Recommendations</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Templates and styles tailored to your prompt
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-muted-foreground"
        >
          ✕
        </Button>
      </div>

      {isAnalyzing ? (
        <div className="py-12 flex flex-col items-center gap-4">
          <div className="animate-spin text-primary">
            <Sparkle size={32} weight="fill" />
          </div>
          <div className="text-center">
            <p className="font-medium">Analyzing your prompt...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Finding the perfect match
            </p>
          </div>
        </div>
      ) : !recommendations ? (
        <div className="py-8 text-center">
          <Button onClick={analyzePrompt} className="gap-2">
            <Sparkle weight="fill" />
            Analyze Prompt
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {recommendations.analysis && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb weight="fill" className="text-accent" size={16} />
                <h4 className="text-sm font-medium">Prompt Analysis</h4>
              </div>
              <div className="flex gap-2 flex-wrap">
                {recommendations.analysis.mood.map((mood, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {mood}
                  </Badge>
                ))}
                {recommendations.analysis.motion.map((motion, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {motion}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-xs">
                  {recommendations.analysis.category}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {recommendations.analysis.complexity}
                </Badge>
              </div>
            </div>
          )}

          {recommendations.templates.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendUp weight="fill" className="text-primary" size={16} />
                  <h4 className="text-sm font-medium">Recommended Templates</h4>
                  <Badge variant="secondary" className="text-xs">
                    {recommendations.templates.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {recommendations.templates.map((rec) => (
                    <Card
                      key={rec.template.id}
                      className={`p-3 cursor-pointer transition-all hover:border-primary ${
                        isTemplateSelected(rec.template) 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleApplyTemplate(rec.template)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{rec.template.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium text-sm">{rec.template.name}</h5>
                            {rec.template.proOnly && (
                              <Crown weight="fill" size={12} className="text-primary" />
                            )}
                            {isTemplateSelected(rec.template) && (
                              <Check weight="bold" size={14} className="text-primary" />
                            )}
                            <Badge 
                              className={`ml-auto text-[10px] ${getRecommendationBadgeColor(rec.score)}`}
                            >
                              {rec.score}%
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {rec.template.description}
                          </p>
                          <p className="text-xs text-muted-foreground italic">
                            {rec.reasoning}
                          </p>
                          {rec.template.duration && (
                            <Badge variant="outline" className="text-[10px] mt-2">
                              {rec.template.duration}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}

          {recommendations.styles.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkle weight="fill" className="text-secondary" size={16} />
                  <h4 className="text-sm font-medium">Recommended Styles</h4>
                  <Badge variant="secondary" className="text-xs">
                    {recommendations.styles.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {recommendations.styles.map((rec) => (
                    <Card
                      key={rec.style.id}
                      className={`p-3 cursor-pointer transition-all hover:border-secondary ${
                        isStyleSelected(rec.style) 
                          ? 'border-secondary bg-secondary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleApplyStyle(rec.style)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium text-sm">{rec.style.name}</h5>
                            {rec.style.proOnly && (
                              <Crown weight="fill" size={12} className="text-primary" />
                            )}
                            {isStyleSelected(rec.style) && (
                              <Check weight="bold" size={14} className="text-secondary" />
                            )}
                            <Badge 
                              className={`ml-auto text-[10px] ${getRecommendationBadgeColor(rec.score)}`}
                            >
                              {rec.score}%
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {rec.style.description}
                          </p>
                          <p className="text-xs text-muted-foreground italic">
                            {rec.reasoning}
                          </p>
                          <div className="flex gap-1 flex-wrap mt-2">
                            {rec.style.moodTags.slice(0, 3).map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-[10px]">
                                {tag}
                              </Badge>
                            ))}
                            <Badge variant="outline" className="text-[10px]">
                              {rec.style.speedModifier}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}

          {recommendations.templates.length === 0 && recommendations.styles.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                No specific recommendations found. Your prompt is ready to generate!
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={analyzePrompt}
              className="flex-1 gap-2"
              disabled={isAnalyzing}
            >
              <Sparkle weight="fill" />
              Re-analyze
            </Button>
            <Button
              onClick={onClose}
              className="flex-1"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
