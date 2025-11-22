import { useEffect, useRef, useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowClockwise, Trophy } from '@phosphor-icons/react'
import { useIsMobile } from '@/hooks/use-mobile'

type GameState = 'waiting' | 'playing' | 'gameover'

interface Pipe {
  x: number
  gapY: number
  passed: boolean
}

const GRAVITY = 0.6
const JUMP_STRENGTH = -10
const PIPE_WIDTH = 80
const PIPE_GAP = 180
const PIPE_SPACING = 300
const SCROLL_SPEED = 3
const BANANA_SIZE = 40
const MAX_VELOCITY = 12

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>('waiting')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useKV<number>('nano-banana-highscore', 0)
  const [showScorePop, setShowScorePop] = useState(false)
  const isMobile = useIsMobile()

  const gameRef = useRef({
    bananaNeutralY: 0,
    bananaY: 0,
    bananaVelocity: 0,
    bananaRotation: 0,
    pipes: [] as Pipe[],
    frameCount: 0,
    canvasWidth: 0,
    canvasHeight: 0,
  })

  const resetGame = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    gameRef.current.bananaY = canvas.height / 2
    gameRef.current.bananaNeutralY = canvas.height / 2
    gameRef.current.bananaVelocity = 0
    gameRef.current.bananaRotation = 0
    gameRef.current.pipes = []
    gameRef.current.frameCount = 0
    setScore(0)
    setGameState('waiting')
  }

  const handleInput = () => {
    if (gameState === 'waiting') {
      setGameState('playing')
      gameRef.current.bananaVelocity = JUMP_STRENGTH
    } else if (gameState === 'playing') {
      gameRef.current.bananaVelocity = JUMP_STRENGTH
    } else if (gameState === 'gameover') {
      resetGame()
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      gameRef.current.canvasWidth = canvas.width
      gameRef.current.canvasHeight = canvas.height
      gameRef.current.bananaY = canvas.height / 2
      gameRef.current.bananaNeutralY = canvas.height / 2
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        handleInput()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    let animationId: number

    const gameLoop = () => {
      const game = gameRef.current
      const canvas = canvasRef.current
      if (!canvas || !ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (gameState === 'playing') {
        game.bananaVelocity += GRAVITY
        game.bananaVelocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, game.bananaVelocity))
        game.bananaY += game.bananaVelocity

        game.bananaRotation = (game.bananaVelocity / MAX_VELOCITY) * 30

        game.frameCount++

        if (game.frameCount % (PIPE_SPACING / SCROLL_SPEED) === 0) {
          const minGapY = PIPE_GAP / 2 + 50
          const maxGapY = canvas.height - PIPE_GAP / 2 - 50
          game.pipes.push({
            x: canvas.width,
            gapY: Math.random() * (maxGapY - minGapY) + minGapY,
            passed: false,
          })
        }

        game.pipes = game.pipes.filter((pipe) => pipe.x + PIPE_WIDTH > 0)

        game.pipes.forEach((pipe) => {
          pipe.x -= SCROLL_SPEED

          if (!pipe.passed && pipe.x + PIPE_WIDTH < canvas.width / 2 - BANANA_SIZE / 2) {
            pipe.passed = true
            setScore((s) => {
              const newScore = s + 1
              setShowScorePop(true)
              setTimeout(() => setShowScorePop(false), 200)
              return newScore
            })
          }
        })

        const bananaX = canvas.width / 2
        const bananaTop = game.bananaY - BANANA_SIZE / 2
        const bananaBottom = game.bananaY + BANANA_SIZE / 2
        const bananaLeft = bananaX - BANANA_SIZE / 2
        const bananaRight = bananaX + BANANA_SIZE / 2

        if (bananaTop <= 0 || bananaBottom >= canvas.height) {
          setGameState('gameover')
          if (score > (highScore ?? 0)) {
            setHighScore(score)
          }
        }

        for (const pipe of game.pipes) {
          const pipeLeft = pipe.x
          const pipeRight = pipe.x + PIPE_WIDTH
          const gapTop = pipe.gapY - PIPE_GAP / 2
          const gapBottom = pipe.gapY + PIPE_GAP / 2

          if (bananaRight > pipeLeft && bananaLeft < pipeRight) {
            if (bananaTop < gapTop || bananaBottom > gapBottom) {
              setGameState('gameover')
              if (score > (highScore ?? 0)) {
                setHighScore(score)
              }
              break
            }
          }
        }
      }

      game.pipes.forEach((pipe) => {
        ctx.fillStyle = 'oklch(0.65 0.18 145)'

        ctx.beginPath()
        ctx.roundRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY - PIPE_GAP / 2, [0, 0, 12, 12])
        ctx.fill()

        ctx.beginPath()
        ctx.roundRect(pipe.x, pipe.gapY + PIPE_GAP / 2, PIPE_WIDTH, canvas.height, [12, 12, 0, 0])
        ctx.fill()
      })

      ctx.save()
      ctx.translate(canvas.width / 2, game.bananaY)
      ctx.rotate((game.bananaRotation * Math.PI) / 180)
      ctx.font = `${BANANA_SIZE}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🍌', 0, 0)
      ctx.restore()

      animationId = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('keydown', handleKeyDown)
      cancelAnimationFrame(animationId)
    }
  }, [gameState, score, highScore, setHighScore])

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        onClick={handleInput}
        className="absolute inset-0 cursor-pointer"
      />

      <div className="absolute top-8 left-0 right-0 flex justify-center pointer-events-none">
        <div
          className={`text-white font-bold text-5xl md:text-6xl transition-transform duration-200 ${
            showScorePop ? 'scale-125' : 'scale-100'
          }`}
          style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}
        >
          {score}
        </div>
      </div>

      {gameState === 'waiting' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Card className="p-8 text-center pointer-events-auto">
            <h1 className="text-4xl font-bold mb-4 text-card-foreground">Nano Banana</h1>
            <p className="text-lg mb-6 text-muted-foreground">
              {isMobile ? 'TAP TO PLAY' : 'CLICK OR PRESS SPACE'}
            </p>
            {highScore && highScore > 0 && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Trophy weight="fill" className="text-primary" />
                <span className="font-semibold">High Score: {highScore}</span>
              </div>
            )}
          </Card>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in duration-150">
          <Card className="p-8 text-center pointer-events-auto">
            <h2 className="text-3xl font-bold mb-4 text-card-foreground">Game Over!</h2>
            <div className="space-y-2 mb-6">
              <p className="text-2xl font-semibold text-card-foreground">Score: {score}</p>
              {score === highScore && score > 0 && (
                <p className="text-lg text-primary font-semibold">🎉 New High Score!</p>
              )}
              {highScore && highScore > 0 && score !== highScore && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Trophy weight="fill" className="text-primary" />
                  <span>Best: {highScore}</span>
                </div>
              )}
            </div>
            <Button onClick={handleInput} size="lg" className="gap-2">
              <ArrowClockwise weight="bold" />
              Play Again
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}

export default App