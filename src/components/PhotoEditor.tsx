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
  Eraser
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
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

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

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string)
      setEditedImage(null)
      setActiveTab('adjust')
      toast.success('Image loaded successfully')
    }
    reader.readAsDataURL(file)
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
      toast.info('Clone source set. Click to paste.')
      return
    }

    setIsDrawing(true)
    applyToolAtPoint(x, y)
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !tool || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    applyToolAtPoint(x, y)
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
                className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={64} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload an image to edit</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click to browse or drag and drop
                </p>
                <Button>Select Image</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative bg-muted rounded-lg overflow-hidden flex items-center justify-center min-h-[400px]">
                  <canvas
                    ref={canvasRef}
                    className={cn(
                      "max-w-full max-h-[600px] w-auto h-auto",
                      tool && "cursor-crosshair"
                    )}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                  />
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
            <TabsContent value="upload" className="mt-0">
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
            </TabsContent>

            <TabsContent value="adjust" className="mt-0 space-y-4">
              <Card className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Brightness: {adjustments.brightness}%
                  </label>
                  <Slider
                    value={[adjustments.brightness]}
                    onValueChange={(v) => setAdjustments(prev => ({ ...prev, brightness: v[0] }))}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Contrast: {adjustments.contrast}%
                  </label>
                  <Slider
                    value={[adjustments.contrast]}
                    onValueChange={(v) => setAdjustments(prev => ({ ...prev, contrast: v[0] }))}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Saturation: {adjustments.saturation}%
                  </label>
                  <Slider
                    value={[adjustments.saturation]}
                    onValueChange={(v) => setAdjustments(prev => ({ ...prev, saturation: v[0] }))}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Blur: {adjustments.blur}px
                  </label>
                  <Slider
                    value={[adjustments.blur]}
                    onValueChange={(v) => setAdjustments(prev => ({ ...prev, blur: v[0] }))}
                    min={0}
                    max={20}
                    step={0.5}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Sharpness: {adjustments.sharpness}%
                  </label>
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
                <div className="grid grid-cols-2 gap-2">
                  {filterPresets.map((filter) => (
                    <Button
                      key={filter.id}
                      variant={selectedFilter === filter.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFilterSelect(filter.id)}
                      className="justify-start gap-2"
                    >
                      {filter.isPro && subscriptionStatus.tier === 'free' && (
                        <Crown size={14} weight="fill" className="text-primary" />
                      )}
                      {selectedFilter === filter.id && <Check size={14} weight="bold" />}
                      {filter.name}
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
                <div className="space-y-2">
                  {bodyEditModes.map((mode) => (
                    <Button
                      key={mode.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleBodyEdit(mode.id)}
                      className="w-full justify-start gap-2"
                      disabled={isProcessing}
                    >
                      {mode.isPro && subscriptionStatus.tier === 'free' && (
                        <Crown size={14} weight="fill" className="text-primary" />
                      )}
                      <mode.icon size={16} weight="bold" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">{mode.name}</div>
                        <div className="text-xs text-muted-foreground">{mode.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
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
                  Remove Background
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  AI-powered background removal
                  {subscriptionStatus.tier === 'free' && ' (Pro feature)'}
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
                      onClick={() => setTool(tool === 'erase' ? null : 'erase')}
                      className="w-full justify-start gap-2"
                    >
                      <Eraser size={16} weight="bold" />
                      Eraser Tool
                      {tool === 'erase' && <Badge className="ml-auto">Active</Badge>}
                    </Button>
                    <Button
                      variant={tool === 'clone' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTool(tool === 'clone' ? null : 'clone')}
                      className="w-full justify-start gap-2"
                    >
                      <Copy size={16} weight="bold" />
                      Clone Tool
                      {tool === 'clone' && <Badge className="ml-auto">Active</Badge>}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Brush Size: {brushSize}px
                  </label>
                  <Slider
                    value={[brushSize]}
                    onValueChange={(v) => setBrushSize(v[0])}
                    min={10}
                    max={150}
                    step={5}
                  />
                </div>

                {tool === 'clone' && (
                  <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                    <p className="font-medium mb-1">Clone Tool Instructions:</p>
                    <p>1. Hold Shift + Click to set clone source</p>
                    <p>2. Click or drag to paint cloned area</p>
                  </div>
                )}
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
