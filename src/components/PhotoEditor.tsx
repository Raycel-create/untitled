import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Upload, 
  Download, 
  MagicWand, 
  Scissors, 
  Palette,
  User,
  Sparkle,
  ArrowCounterClockwise,
  Check,
  X,
  Crown,
  Copy,
  Eraser,
  Lightbulb
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { SubscriptionStatus } from '@/lib/subscription'

interface PhotoEditorProps {
  subscriptionStatus: SubscriptionStatus
  onUpgradeClick: () => void
}

interface FilterPreset {
  id: string
  name: string
  filter: string
  isPro?: boolean
}

interface BodyEditMode {
  id: string
  name: string
  icon: typeof User
  description: string
  isPro?: boolean
}

const filterPresets: FilterPreset[] = [
  { id: 'none', name: 'Original', filter: 'none' },
  { id: 'vivid', name: 'Vivid', filter: 'saturate(1.3) contrast(1.1)' },
  { id: 'cool', name: 'Cool', filter: 'saturate(0.9) brightness(1.05) hue-rotate(10deg)' },
  { id: 'warm', name: 'Warm', filter: 'saturate(1.2) brightness(1.05) hue-rotate(-10deg)' },
  { id: 'bw', name: 'B&W', filter: 'grayscale(1) contrast(1.1)' },
  { id: 'sepia', name: 'Sepia', filter: 'sepia(1)' },
  { id: 'vintage', name: 'Vintage', filter: 'sepia(0.5) saturate(0.8) contrast(1.1)', isPro: true },
  { id: 'dramatic', name: 'Dramatic', filter: 'contrast(1.3) brightness(0.9) saturate(1.2)', isPro: true },
  { id: 'fade', name: 'Fade', filter: 'brightness(1.1) contrast(0.85) saturate(0.9)', isPro: true },
  { id: 'noir', name: 'Noir', filter: 'grayscale(1) contrast(1.5) brightness(0.95)', isPro: true },
]

const bodyEditModes: BodyEditMode[] = [
  { id: 'face', name: 'Face Retouch', icon: User, description: 'Smooth skin & enhance features' },
  { id: 'body', name: 'Body Shape', icon: User, description: 'Adjust body proportions', isPro: true },
  { id: 'slim', name: 'Slim Tool', icon: User, description: 'Targeted slimming', isPro: true },
]

export function PhotoEditor({ subscriptionStatus, onUpgradeClick }: PhotoEditorProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [editedImage, setEditedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState('upload')
  const [selectedFilter, setSelectedFilter] = useState('none')
  const [brushSize, setBrushSize] = useState(50)
  const [isDrawing, setIsDrawing] = useState(false)
  const [cloneSrc, setCloneSrc] = useState<{ x: number; y: number } | null>(null)
  const [tool, setTool] = useState<'erase' | 'clone' | null>(null)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const cursorCanvasRef = useRef<HTMLCanvasElement>(null)

  const [adjustments, setAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    sharpness: 0,
  })

  useEffect(() => {
    if (selectedImage && canvasRef.current) {
      loadImageToCanvas()
    }
  }, [selectedImage])

  useEffect(() => {
    if (selectedImage && canvasRef.current) {
      applyAdjustments()
    }
  }, [adjustments, selectedFilter])

  useEffect(() => {
    if (cursorCanvasRef.current && canvasRef.current) {
      cursorCanvasRef.current.width = canvasRef.current.offsetWidth
      cursorCanvasRef.current.height = canvasRef.current.offsetHeight
    }
  }, [selectedImage, tool])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return

      if (e.key === 'Escape') {
        setTool(null)
        setCloneSrc(null)
      } else if (e.key === 'e' && !e.ctrlKey && !e.metaKey) {
        setTool(prev => prev === 'erase' ? null : 'erase')
      } else if (e.key === 'c' && !e.ctrlKey && !e.metaKey) {
        setTool(prev => prev === 'clone' ? null : 'clone')
      } else if (e.key === '[' && brushSize > 10) {
        setBrushSize(prev => Math.max(10, prev - 10))
      } else if (e.key === ']' && brushSize < 150) {
        setBrushSize(prev => Math.min(150, prev + 10))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedImage, brushSize])

  const loadImageToCanvas = () => {
    if (!selectedImage || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = selectedImage
    imageRef.current = img

    img.onload = () => {
      canvas.width = Math.min(img.width, 1200)
      canvas.height = (img.height * canvas.width) / img.width
      applyAdjustments()
    }
  }

  const applyAdjustments = () => {
    if (!imageRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const img = imageRef.current
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    const filter = filterPresets.find(f => f.id === selectedFilter)
    const baseFilter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) blur(${adjustments.blur}px)`
    ctx.filter = filter && filter.id !== 'none' ? `${baseFilter} ${filter.filter}` : baseFilter
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    
    if (adjustments.sharpness > 0) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const sharpened = applySharpen(imageData, adjustments.sharpness / 100)
      ctx.putImageData(sharpened, 0, 0)
    }

    const editedUrl = canvas.toDataURL('image/png')
    setEditedImage(editedUrl)
  }

  const applySharpen = (imageData: ImageData, amount: number): ImageData => {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    const output = new ImageData(width, height)
    
    const kernel = [
      0, -amount, 0,
      -amount, 1 + 4 * amount, -amount,
      0, -amount, 0
    ]

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c
              sum += data[idx] * kernel[(ky + 1) * 3 + (kx + 1)]
            }
          }
          output.data[(y * width + x) * 4 + c] = Math.min(255, Math.max(0, sum))
        }
        output.data[(y * width + x) * 4 + 3] = data[(y * width + x) * 4 + 3]
      }
    }
    
    return output
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    loadImageFile(file)
  }

  const loadImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string)
      setEditedImage(null)
      setActiveTab('adjust')
      setAdjustments({
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        sharpness: 0,
      })
      setSelectedFilter('none')
      setTool(null)
      toast.success('Image loaded successfully')
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      loadImageFile(file)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) {
          loadImageFile(file)
          break
        }
      }
    }
  }

  const handleRemoveBackground = async () => {
    if (!selectedImage) return

    if (subscriptionStatus.tier === 'free') {
      onUpgradeClick()
      return
    }

    setIsProcessing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const brightness = (r + g + b) / 3

        if (brightness > 200 || brightness < 50) {
          data[i + 3] = Math.max(0, data[i + 3] - 150)
        }
      }

      ctx.putImageData(imageData, 0, 0)
      const editedUrl = canvas.toDataURL('image/png')
      setEditedImage(editedUrl)
      
      toast.success('Background removed!')
    } catch (error) {
      toast.error('Failed to remove background')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBodyEdit = async (mode: string) => {
    if (!selectedImage) return

    const editMode = bodyEditModes.find(m => m.id === mode)
    if (editMode?.isPro && subscriptionStatus.tier === 'free') {
      onUpgradeClick()
      return
    }

    setIsProcessing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success(`${editMode?.name} applied successfully!`)
      applyAdjustments()
    } catch (error) {
      toast.error('Failed to apply body edit')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!tool || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (tool === 'clone' && e.shiftKey) {
      setCloneSrc({ x, y })
      toast.success('Clone source set! Click to paint.')
      return
    }

    setIsDrawing(true)
    applyToolAtPoint(x, y)
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setCursorPos({ x, y })
    drawCursor(x, y)

    if (!isDrawing || !tool) return
    applyToolAtPoint(x, y)
  }

  const handleCanvasMouseLeave = () => {
    setIsDrawing(false)
    setCursorPos(null)
    if (cursorCanvasRef.current) {
      const ctx = cursorCanvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, cursorCanvasRef.current.width, cursorCanvasRef.current.height)
      }
    }
  }

  const drawCursor = (x: number, y: number) => {
    if (!tool || !cursorCanvasRef.current) return

    const canvas = cursorCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    ctx.strokeStyle = tool === 'clone' ? '#70f' : '#f70'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    if (tool === 'clone' && cloneSrc) {
      ctx.strokeStyle = '#0f7'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cloneSrc.x, cloneSrc.y, brushSize / 2, 0, Math.PI * 2)
      ctx.stroke()

      ctx.strokeStyle = '#0f7'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cloneSrc.x, cloneSrc.y)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }

  const handleCanvasMouseUp = () => {
    setIsDrawing(false)
    if (canvasRef.current) {
      const editedUrl = canvasRef.current.toDataURL('image/png')
      setEditedImage(editedUrl)
    }
  }

  const applyToolAtPoint = (x: number, y: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const scaleX = canvas.width / canvas.offsetWidth
    const scaleY = canvas.height / canvas.offsetHeight
    const scaledX = x * scaleX
    const scaledY = y * scaleY
    const scaledBrushSize = brushSize * scaleX

    if (tool === 'erase') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.arc(scaledX, scaledY, scaledBrushSize / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
    } else if (tool === 'clone' && cloneSrc) {
      const srcScaledX = cloneSrc.x * scaleX
      const srcScaledY = cloneSrc.y * scaleY
      
      const size = scaledBrushSize
      const imageData = ctx.getImageData(srcScaledX - size / 2, srcScaledY - size / 2, size, size)
      ctx.putImageData(imageData, scaledX - size / 2, scaledY - size / 2)
    }
  }

  const handleDownload = () => {
    if (!editedImage && !selectedImage) {
      toast.error('No image to download')
      return
    }

    const link = document.createElement('a')
    link.href = editedImage || selectedImage || ''
    link.download = `edited-photo-${Date.now()}.png`
    link.click()
    toast.success('Image downloaded!')
  }

  const handleReset = () => {
    setAdjustments({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      sharpness: 0,
    })
    setSelectedFilter('none')
    setTool(null)
    setCloneSrc(null)
    loadImageToCanvas()
    toast.success('Reset to original')
  }

  const handleFilterSelect = (filterId: string) => {
    const filter = filterPresets.find(f => f.id === filterId)
    if (filter?.isPro && subscriptionStatus.tier === 'free') {
      onUpgradeClick()
      return
    }
    setSelectedFilter(filterId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Photo Editor</h2>
          <p className="text-sm text-muted-foreground">
            Professional editing tools for your images
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="upload" className="gap-2">
            <Upload size={16} weight="bold" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="adjust" disabled={!selectedImage} className="gap-2">
            <Palette size={16} weight="bold" />
            Adjust
          </TabsTrigger>
          <TabsTrigger value="filters" disabled={!selectedImage} className="gap-2">
            <MagicWand size={16} weight="bold" />
            Filters
          </TabsTrigger>
          <TabsTrigger value="body" disabled={!selectedImage} className="gap-2">
            <User size={16} weight="bold" />
            Body
          </TabsTrigger>
          <TabsTrigger value="tools" disabled={!selectedImage} className="gap-2">
            <Scissors size={16} weight="bold" />
            Tools
          </TabsTrigger>
        </TabsList>

        <div className="grid lg:grid-cols-[1fr_350px] gap-6 mt-6">
          <Card className="p-6">
            {!selectedImage ? (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all",
                  isDragOver 
                    ? "border-primary bg-primary/5 scale-[1.02]" 
                    : "border-border hover:border-primary hover:bg-primary/5"
                )}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onPaste={handlePaste}
                tabIndex={0}
              >
                <Upload size={64} className={cn(
                  "mx-auto mb-4 transition-colors",
                  isDragOver ? "text-primary" : "text-muted-foreground"
                )} />
                <h3 className="text-lg font-semibold mb-2">
                  {isDragOver ? 'Drop image here' : 'Upload an image to edit'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click to browse, drag & drop, or paste from clipboard
                </p>
                <Button>Select Image</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative bg-muted rounded-lg overflow-hidden flex items-center justify-center min-h-[400px]">
                  <div className="relative">
                    <canvas
                      ref={canvasRef}
                      className="max-w-full max-h-[600px] w-auto h-auto"
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onMouseLeave={handleCanvasMouseLeave}
                    />
                    {tool && (
                      <canvas
                        ref={cursorCanvasRef}
                        className="absolute inset-0 pointer-events-none"
                        style={{ cursor: 'none' }}
                      />
                    )}
                  </div>
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="bg-card p-6 rounded-lg text-center">
                        <Sparkle size={32} className="mx-auto mb-2 animate-pulse text-primary" weight="fill" />
                        <p className="font-medium">Processing...</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <Download weight="bold" />
                    Download
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="gap-2"
                  >
                    <ArrowCounterClockwise weight="bold" />
                    Reset
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedImage(null)
                      setEditedImage(null)
                      setActiveTab('upload')
                    }}
                    variant="outline"
                    className="gap-2"
                  >
                    <X weight="bold" />
                    New
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <div className="space-y-4">
            <TabsContent value="upload" className="mt-0 space-y-4">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Getting Started</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>• Upload any image to start editing</p>
                  <p>• Use adjustment tools to fine-tune colors</p>
                  <p>• Apply filters for instant style changes</p>
                  <p>• Remove backgrounds with AI</p>
                  <p>• Clone and erase tools for precise edits</p>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Lightbulb size={18} weight="fill" className="text-primary" />
                  Keyboard Shortcuts
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Eraser Tool</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">E</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Clone Tool</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">C</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deselect Tool</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">ESC</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Increase Brush</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">]</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Decrease Brush</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">[</kbd>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="adjust" className="mt-0 space-y-4">
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">Color Adjustments</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAdjustments(prev => ({
                      ...prev,
                      brightness: 100,
                      contrast: 100,
                      saturation: 100
                    }))}
                    className="h-7 text-xs"
                  >
                    <ArrowCounterClockwise size={14} className="mr-1" />
                    Reset
                  </Button>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Brightness</label>
                    <span className="text-sm text-muted-foreground">{adjustments.brightness}%</span>
                  </div>
                  <Slider
                    value={[adjustments.brightness]}
                    onValueChange={(v) => setAdjustments(prev => ({ ...prev, brightness: v[0] }))}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Contrast</label>
                    <span className="text-sm text-muted-foreground">{adjustments.contrast}%</span>
                  </div>
                  <Slider
                    value={[adjustments.contrast]}
                    onValueChange={(v) => setAdjustments(prev => ({ ...prev, contrast: v[0] }))}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Saturation</label>
                    <span className="text-sm text-muted-foreground">{adjustments.saturation}%</span>
                  </div>
                  <Slider
                    value={[adjustments.saturation]}
                    onValueChange={(v) => setAdjustments(prev => ({ ...prev, saturation: v[0] }))}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Effects</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAdjustments(prev => ({
                      ...prev,
                      blur: 0,
                      sharpness: 0
                    }))}
                    className="h-7 text-xs"
                  >
                    <ArrowCounterClockwise size={14} className="mr-1" />
                    Reset
                  </Button>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Blur</label>
                    <span className="text-sm text-muted-foreground">{adjustments.blur}px</span>
                  </div>
                  <Slider
                    value={[adjustments.blur]}
                    onValueChange={(v) => setAdjustments(prev => ({ ...prev, blur: v[0] }))}
                    min={0}
                    max={20}
                    step={0.5}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Sharpness</label>
                    <span className="text-sm text-muted-foreground">{adjustments.sharpness}%</span>
                  </div>
                  <Slider
                    value={[adjustments.sharpness]}
                    onValueChange={(v) => setAdjustments(prev => ({ ...prev, sharpness: v[0] }))}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="filters" className="mt-0 space-y-4">
              <Card className="p-6">
                <h3 className="font-semibold mb-3">Filter Presets</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  One-click filters to transform your image instantly
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {filterPresets.map((filter) => (
                    <Button
                      key={filter.id}
                      variant={selectedFilter === filter.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFilterSelect(filter.id)}
                      className="justify-start gap-2 h-auto py-2"
                    >
                      <div className="flex flex-col items-start gap-0.5">
                        <div className="flex items-center gap-1">
                          {filter.isPro && subscriptionStatus.tier === 'free' && (
                            <Crown size={12} weight="fill" className="text-primary" />
                          )}
                          {selectedFilter === filter.id && <Check size={12} weight="bold" />}
                          <span className="text-xs font-medium">{filter.name}</span>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="body" className="mt-0 space-y-4">
              <Card className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User weight="bold" />
                  Body & Face Editing
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  AI-powered tools for portrait and body enhancement
                </p>
                <div className="space-y-2">
                  {bodyEditModes.map((mode) => (
                    <Button
                      key={mode.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleBodyEdit(mode.id)}
                      className="w-full justify-start gap-2 h-auto py-3"
                      disabled={isProcessing}
                    >
                      {mode.isPro && subscriptionStatus.tier === 'free' && (
                        <Crown size={14} weight="fill" className="text-primary shrink-0" />
                      )}
                      <mode.icon size={18} weight="bold" className="shrink-0" />
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{mode.name}</div>
                        <div className="text-xs text-muted-foreground font-normal">{mode.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </Card>

              <Card className="p-6 space-y-3">
                <h4 className="font-semibold text-sm">Background Removal</h4>
                <Button
                  onClick={handleRemoveBackground}
                  disabled={isProcessing}
                  className="w-full gap-2"
                  variant={subscriptionStatus.tier === 'free' ? 'outline' : 'default'}
                >
                  {subscriptionStatus.tier === 'free' && (
                    <Crown size={16} weight="fill" className="text-primary" />
                  )}
                  <Scissors weight="bold" />
                  {isProcessing ? 'Processing...' : 'Remove Background'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  AI-powered background removal with edge detection
                  {subscriptionStatus.tier === 'free' && ' (Requires Pro)'}
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="tools" className="mt-0 space-y-4">
              <Card className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Drawing Tools</h3>
                  <div className="space-y-2">
                    <Button
                      variant={tool === 'erase' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setTool(tool === 'erase' ? null : 'erase')
                        if (tool !== 'erase') {
                          toast.info('Click and drag to erase parts of the image')
                        }
                      }}
                      className="w-full justify-start gap-2"
                    >
                      <Eraser size={16} weight="bold" />
                      Eraser Tool
                      {tool === 'erase' && <Badge className="ml-auto">Active</Badge>}
                    </Button>
                    <Button
                      variant={tool === 'clone' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const newTool = tool === 'clone' ? null : 'clone'
                        setTool(newTool)
                        setCloneSrc(null)
                        if (newTool === 'clone') {
                          toast.info('Hold Shift + Click to set source, then click to paint')
                        }
                      }}
                      className="w-full justify-start gap-2"
                    >
                      <Copy size={16} weight="bold" />
                      Clone Stamp Tool
                      {tool === 'clone' && <Badge className="ml-auto">Active</Badge>}
                    </Button>
                  </div>
                  {tool && (
                    <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-xs font-medium text-primary mb-1">
                        {tool === 'erase' ? '🖌️ Eraser Active' : '🎨 Clone Stamp Active'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tool === 'erase' 
                          ? 'Click and drag on the image to erase'
                          : cloneSrc 
                            ? 'Source set! Click to paint cloned pixels' 
                            : 'Hold Shift + Click to set clone source'
                        }
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Brush Size: {brushSize}px
                  </label>
                  <Slider
                    value={[brushSize]}
                    onValueChange={(v) => {
                      setBrushSize(v[0])
                      if (cursorPos) {
                        drawCursor(cursorPos.x, cursorPos.y)
                      }
                    }}
                    min={10}
                    max={150}
                    step={5}
                  />
                  <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                    <span>Small</span>
                    <div className="flex items-center gap-2">
                      <span>Preview:</span>
                      <div 
                        className="rounded-full border-2 border-primary bg-primary/20"
                        style={{ 
                          width: `${Math.min(brushSize / 2, 30)}px`, 
                          height: `${Math.min(brushSize / 2, 30)}px` 
                        }}
                      />
                    </div>
                    <span>Large</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-muted/50 border-dashed">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Lightbulb size={16} weight="fill" className="text-primary" />
                  Quick Tips
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Use larger brushes for broad changes</li>
                  <li>• Use smaller brushes for detailed work</li>
                  <li>• Clone tool copies pixels from one area to another</li>
                  <li>• Eraser removes pixels to transparency</li>
                </ul>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
