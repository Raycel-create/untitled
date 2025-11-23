import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Crown, Check } from '@phosphor-icons/react'
import { videoTemplates, animationStyles, type VideoTemplate, type AnimationStyle } from '@/lib/video-templates'

interface VideoTemplateSelectorProps {
  selectedTemplate: VideoTemplate | null
  selectedStyle: AnimationStyle | null
  onTemplateSelect: (template: VideoTemplate | null) => void
  onStyleSelect: (style: AnimationStyle | null) => void
  isPro: boolean
  onUpgradeClick: () => void
}

export function VideoTemplateSelector({
  selectedTemplate,
  selectedStyle,
  onTemplateSelect,
  onStyleSelect,
  isPro,
  onUpgradeClick
}: VideoTemplateSelectorProps) {
  const templatesByCategory = {
    motion: videoTemplates.filter(t => t.category === 'motion'),
    transition: videoTemplates.filter(t => t.category === 'transition'),
    effect: videoTemplates.filter(t => t.category === 'effect'),
    storytelling: videoTemplates.filter(t => t.category === 'storytelling')
  }

  const handleTemplateClick = (template: VideoTemplate) => {
    if (template.proOnly && !isPro) {
      onUpgradeClick()
      return
    }
    onTemplateSelect(selectedTemplate?.id === template.id ? null : template)
  }

  const handleStyleClick = (style: AnimationStyle) => {
    if (style.proOnly && !isPro) {
      onUpgradeClick()
      return
    }
    onStyleSelect(selectedStyle?.id === style.id ? null : style)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">
          Video Templates
        </label>
        <Tabs defaultValue="motion" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="motion">Motion</TabsTrigger>
            <TabsTrigger value="transition">Transition</TabsTrigger>
            <TabsTrigger value="effect">Effect</TabsTrigger>
            <TabsTrigger value="storytelling">Story</TabsTrigger>
          </TabsList>
          
          <TabsContent value="motion" className="mt-4">
            <ScrollArea className="h-[180px] pr-4">
              <div className="grid grid-cols-2 gap-2">
                {templatesByCategory.motion.map((template) => (
                  <Card
                    key={template.id}
                    className={`p-3 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md relative ${
                      selectedTemplate?.id === template.id
                        ? 'border-2 border-primary bg-primary/5'
                        : 'border hover:border-primary/50'
                    } ${template.proOnly && !isPro ? 'opacity-70' : ''}`}
                    onClick={() => handleTemplateClick(template)}
                  >
                    {selectedTemplate?.id === template.id && (
                      <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-primary">
                        <Check size={12} weight="bold" />
                      </Badge>
                    )}
                    {template.proOnly && !isPro && (
                      <Crown weight="fill" className="absolute -top-1 -right-1 text-primary" size={14} />
                    )}
                    <div className="flex items-start gap-2">
                      <span className="text-2xl">{template.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm leading-tight">{template.name}</div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {template.description}
                        </p>
                        {template.duration && (
                          <Badge variant="outline" className="mt-1 text-[10px] h-4 px-1">
                            {template.duration}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="transition" className="mt-4">
            <ScrollArea className="h-[180px] pr-4">
              <div className="grid grid-cols-2 gap-2">
                {templatesByCategory.transition.map((template) => (
                  <Card
                    key={template.id}
                    className={`p-3 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md relative ${
                      selectedTemplate?.id === template.id
                        ? 'border-2 border-primary bg-primary/5'
                        : 'border hover:border-primary/50'
                    } ${template.proOnly && !isPro ? 'opacity-70' : ''}`}
                    onClick={() => handleTemplateClick(template)}
                  >
                    {selectedTemplate?.id === template.id && (
                      <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-primary">
                        <Check size={12} weight="bold" />
                      </Badge>
                    )}
                    {template.proOnly && !isPro && (
                      <Crown weight="fill" className="absolute -top-1 -right-1 text-primary" size={14} />
                    )}
                    <div className="flex items-start gap-2">
                      <span className="text-2xl">{template.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm leading-tight">{template.name}</div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {template.description}
                        </p>
                        {template.duration && (
                          <Badge variant="outline" className="mt-1 text-[10px] h-4 px-1">
                            {template.duration}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="effect" className="mt-4">
            <ScrollArea className="h-[180px] pr-4">
              <div className="grid grid-cols-2 gap-2">
                {templatesByCategory.effect.map((template) => (
                  <Card
                    key={template.id}
                    className={`p-3 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md relative ${
                      selectedTemplate?.id === template.id
                        ? 'border-2 border-primary bg-primary/5'
                        : 'border hover:border-primary/50'
                    } ${template.proOnly && !isPro ? 'opacity-70' : ''}`}
                    onClick={() => handleTemplateClick(template)}
                  >
                    {selectedTemplate?.id === template.id && (
                      <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-primary">
                        <Check size={12} weight="bold" />
                      </Badge>
                    )}
                    {template.proOnly && !isPro && (
                      <Crown weight="fill" className="absolute -top-1 -right-1 text-primary" size={14} />
                    )}
                    <div className="flex items-start gap-2">
                      <span className="text-2xl">{template.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm leading-tight">{template.name}</div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {template.description}
                        </p>
                        {template.duration && (
                          <Badge variant="outline" className="mt-1 text-[10px] h-4 px-1">
                            {template.duration}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="storytelling" className="mt-4">
            <ScrollArea className="h-[180px] pr-4">
              <div className="grid grid-cols-2 gap-2">
                {templatesByCategory.storytelling.map((template) => (
                  <Card
                    key={template.id}
                    className={`p-3 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md relative ${
                      selectedTemplate?.id === template.id
                        ? 'border-2 border-primary bg-primary/5'
                        : 'border hover:border-primary/50'
                    } ${template.proOnly && !isPro ? 'opacity-70' : ''}`}
                    onClick={() => handleTemplateClick(template)}
                  >
                    {selectedTemplate?.id === template.id && (
                      <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-primary">
                        <Check size={12} weight="bold" />
                      </Badge>
                    )}
                    {template.proOnly && !isPro && (
                      <Crown weight="fill" className="absolute -top-1 -right-1 text-primary" size={14} />
                    )}
                    <div className="flex items-start gap-2">
                      <span className="text-2xl">{template.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm leading-tight">{template.name}</div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {template.description}
                        </p>
                        {template.duration && (
                          <Badge variant="outline" className="mt-1 text-[10px] h-4 px-1">
                            {template.duration}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        {selectedTemplate && (
          <div className="mt-2 text-xs text-muted-foreground">
            Selected: {selectedTemplate.name}
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">
          Animation Style
        </label>
        <ScrollArea className="h-[140px] pr-4">
          <div className="grid grid-cols-2 gap-2">
            {animationStyles.map((style) => (
              <Card
                key={style.id}
                className={`p-3 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md relative ${
                  selectedStyle?.id === style.id
                    ? 'border-2 border-accent bg-accent/5'
                    : 'border hover:border-accent/50'
                } ${style.proOnly && !isPro ? 'opacity-70' : ''}`}
                onClick={() => handleStyleClick(style)}
              >
                {selectedStyle?.id === style.id && (
                  <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-accent">
                    <Check size={12} weight="bold" />
                  </Badge>
                )}
                {style.proOnly && !isPro && (
                  <Crown weight="fill" className="absolute -top-1 -right-1 text-primary" size={14} />
                )}
                <div className="space-y-1">
                  <div className="font-medium text-sm leading-tight">{style.name}</div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {style.description}
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                      {style.speedModifier}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
        
        {selectedStyle && (
          <div className="mt-2 text-xs text-muted-foreground">
            Selected: {selectedStyle.name}
          </div>
        )}
      </div>

      {(selectedTemplate || selectedStyle) && (
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-xs font-medium mb-1">Active Enhancements:</div>
          <div className="text-xs text-muted-foreground space-y-1">
            {selectedTemplate && (
              <div>• Template: {selectedTemplate.name}</div>
            )}
            {selectedStyle && (
              <div>• Style: {selectedStyle.name}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
