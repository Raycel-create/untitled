import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Sparkle, VideoCamera, Image, CheckCircle } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'

interface GenerationProgressProps {
  mode: 'image' | 'video'
  progress: number
  stage: string
  previewUrl: string | null
}

export function GenerationProgress({ mode, progress, stage, previewUrl }: GenerationProgressProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])

  useEffect(() => {
    const newParticles = [...Array(12)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }))
    setParticles(newParticles)
  }, [])

  const isComplete = progress >= 100

  return (
    <Card className="p-6 border-2 border-primary/50 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-primary rounded-full"
            initial={{ x: `${particle.x}%`, y: `${particle.y}%`, opacity: 0 }}
            animate={{
              y: [`${particle.y}%`, `${particle.y - 30}%`, `${particle.y - 60}%`],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeOut"
            }}
          />
        ))}
      </div>

      <div className="relative space-y-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={isComplete ? { scale: [1, 1.2, 1] } : { rotate: [0, 360] }}
            transition={isComplete ? { duration: 0.5 } : { duration: 2, repeat: Infinity, ease: "linear" }}
          >
            {isComplete ? (
              <CheckCircle weight="fill" className="text-primary" size={32} />
            ) : (
              <Sparkle weight="fill" className="text-primary" size={32} />
            )}
          </motion.div>
          <div className="flex-1">
            <p className="font-semibold text-lg">
              {isComplete ? `${mode === 'image' ? 'Image' : 'Video'} Complete!` : `Creating your ${mode}...`}
            </p>
            <motion.p 
              className="text-sm text-muted-foreground"
              key={stage}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {stage}
            </motion.p>
          </div>
          <div className="text-right">
            <motion.p 
              className="text-3xl font-bold text-primary"
              key={progress}
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {progress}%
            </motion.p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Started</span>
            <span>{isComplete ? 'Complete' : 'In Progress...'}</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {previewUrl && mode === 'image' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative rounded-lg overflow-hidden bg-muted border-2 border-primary/30 shadow-lg"
            >
              <img 
                src={previewUrl} 
                alt="Generation preview" 
                className="w-full h-auto"
              />
              <motion.div 
                className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              />
              <Badge className="absolute bottom-3 right-3 bg-primary text-primary-foreground gap-1.5 shadow-lg">
                <Image weight="fill" size={14} />
                {isComplete ? 'Final Result' : 'Live Preview'}
              </Badge>
              {!isComplete && (
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" className="gap-1.5 backdrop-blur-sm bg-background/80">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Rendering
                  </Badge>
                </div>
              )}
            </motion.div>
          )}

          {mode === 'video' && progress > 50 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative rounded-lg overflow-hidden bg-muted border-2 border-accent/30 p-6 shadow-lg"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <VideoCamera weight="fill" className="text-accent" size={20} />
                    </motion.div>
                    <div>
                      <p className="text-sm font-medium">Rendering Video</p>
                      <p className="text-xs text-muted-foreground">
                        Frame {Math.floor((progress - 50) * 2.4)}/120
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    Processing
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[...Array(8)].map((_, i) => {
                    const frameProgress = Math.floor((progress - 50) / 6.25)
                    const isRendered = i < frameProgress
                    const isCurrentFrame = i === frameProgress

                    return (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          borderColor: isCurrentFrame ? 'rgb(var(--accent))' : undefined
                        }}
                        transition={{ delay: i * 0.1 }}
                        className={`aspect-video rounded border-2 relative ${
                          isRendered
                            ? 'border-accent bg-accent/20' 
                            : 'border-border bg-muted/50'
                        }`}
                      >
                        {isRendered && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute inset-0 shimmer"
                          />
                        )}
                        {isCurrentFrame && (
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="absolute inset-0 bg-accent/30"
                          />
                        )}
                        {isRendered && (
                          <div className="absolute bottom-0.5 right-0.5">
                            <CheckCircle weight="fill" size={10} className="text-accent" />
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                  <span>Quality: HD 1080p</span>
                  <span>Duration: 4s</span>
                  <span>FPS: 30</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 text-sm text-primary font-medium pt-2"
          >
            <CheckCircle weight="fill" size={18} />
            Your {mode} has been added to the gallery!
          </motion.div>
        )}
      </div>
    </Card>
  )
}
