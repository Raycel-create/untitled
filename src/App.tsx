import { useState, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Sparkle, Image as ImageIcon, VideoCamera, Download, Trash, X, Play, Pause, Upload, PencilSimple, FlipHorizontal, ArrowsClockwise, ArrowCounterClockwise, Check, ChatCircleDots, Crown, Lightning, Scissors, Key, SignOut, CreditCard, GearSix } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { AIAssistant } from '@/components/AIAssistant'
import { SubscriptionModal } from '@/components/SubscriptionModal'
import { UsageIndicator } from '@/components/UsageIndicator'
import { PhotoEditor } from '@/components/PhotoEditor'
import { APIKeyManager } from '@/components/APIKeyManager'
import { APIKeyBanner } from '@/components/APIKeyBanner'
import { LandingPage } from '@/components/LandingPage'
import { StripeConfigDialog } from '@/components/StripeConfigDialog'
import { StripeCheckout } from '@/components/StripeCheckout'
import { SubscriptionManagement } from '@/components/SubscriptionManagement'
import { CEODashboard } from '@/components/CEODashboard'
import { AdminLogin } from '@/components/AdminLogin'
import { AdminSettings } from '@/components/AdminSettings'
import { 
  initializeSubscription, 
  resetMonthlyUsage, 
  canGenerate, 
  shouldShowUpgradePrompt,
  SUBSCRIPTION_LIMITS,
  type SubscriptionStatus 
} from '@/lib/subscription'
import { APIKeys, hasAnyProvider, getProviderForFeature } from '@/lib/api-keys'
import { initializeAuth, type User, type AuthState } from '@/lib/auth'
import { getStoredStripeConfig, simulateSuccessfulPayment } from '@/lib/stripe'
import { 
  createAdminSession, 
  isAdminSessionValid, 
  initializeAdminSession,
  type AdminSession 
} from '@/lib/admin-auth'

type MediaType = 'image' | 'video'

interface MediaItem {
  id: string
  type: MediaType
  prompt: string
  url: string
  createdAt: number
}

interface StylePreset {
  id: string
  name: string
  description: string
  promptModifier: string
}

interface ImageAdjustments {
  brightness: number
  contrast: number
  blur: number
  rotation: number
  flipH: boolean
}

interface ReferenceImage {
  original: string
  edited?: string
  adjustments: ImageAdjustments
}

const stylePresets: StylePreset[] = [
  { id: 'photorealistic', name: 'Photorealistic', description: 'Lifelike photography', promptModifier: 'photorealistic, 8K, ultra detailed, professional photography' },
  { id: 'artistic', name: 'Artistic', description: 'Painterly and expressive', promptModifier: 'artistic painting, vibrant colors, expressive brushstrokes, fine art' },
  { id: 'cinematic', name: 'Cinematic', description: 'Movie-quality visuals', promptModifier: 'cinematic lighting, dramatic composition, film grain, anamorphic' },
  { id: 'anime', name: 'Anime', description: 'Japanese animation style', promptModifier: 'anime style, cel shaded, vibrant colors, detailed linework' },
  { id: 'minimalist', name: 'Minimalist', description: 'Clean and simple', promptModifier: 'minimalist design, clean lines, simple composition, negative space' },
  { id: 'surreal', name: 'Surreal', description: 'Dreamlike and abstract', promptModifier: 'surreal art, dreamlike, abstract, otherworldly, imaginative' },
  { id: 'vintage', name: 'Vintage', description: 'Retro aesthetic', promptModifier: 'vintage photography, retro colors, film grain, nostalgic' },
  { id: '3d-render', name: '3D Render', description: 'Computer graphics', promptModifier: '3D render, octane render, ray tracing, photorealistic CGI' },
]

function App() {
  const [authState, setAuthState] = useKV<AuthState>('auth-state', initializeAuth())
  const [mainTab, setMainTab] = useState<'generate' | 'edit'>('generate')
  const [mode, setMode] = useState<MediaType>('image')
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [gallery, setGallery] = useKV<MediaItem[]>('ai-creator-gallery', [])
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([])
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null)
  const [tempAdjustments, setTempAdjustments] = useState<ImageAdjustments>({
    brightness: 100,
    contrast: 100,
    blur: 0,
    rotation: 0,
    flipH: false,
  })
  const [subscriptionStatus, setSubscriptionStatus] = useKV<SubscriptionStatus>(
    'subscription-status',
    initializeSubscription()
  )
  const [apiKeys] = useKV<APIKeys>('api-keys', {})
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<'limit_reached' | 'video_locked' | 'upgrade_prompt'>('upgrade_prompt')
  const [apiKeyManagerOpen, setApiKeyManagerOpen] = useState(false)
  const [stripeConfigOpen, setStripeConfigOpen] = useState(false)
  const [stripeCheckoutOpen, setStripeCheckoutOpen] = useState(false)
  const [subscriptionManagementOpen, setSubscriptionManagementOpen] = useState(false)
  const [adminSession, setAdminSession] = useKV<AdminSession>('admin-session', initializeAdminSession())
  const [adminLoginOpen, setAdminLoginOpen] = useState(false)
  const [adminSettingsOpen, setAdminSettingsOpen] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const filteredGallery = (gallery ?? []).filter(item => item.type === mode)
  const hasConfiguredKeys = hasAnyProvider(apiKeys ?? {})
  const stripeConfig = getStoredStripeConfig()
  const hasStripeConfigured = !!stripeConfig
  const isCEOMode = isAdminSessionValid(adminSession ?? null)

  useEffect(() => {
    setSubscriptionStatus(current => resetMonthlyUsage(current ?? initializeSubscription()))
  }, [])

  useEffect(() => {
    if (editingImageIndex !== null && canvasRef.current) {
      applyAdjustmentsToCanvas()
    }
  }, [tempAdjustments, editingImageIndex])

  const handleAuthenticate = (user: User) => {
    setAuthState({
      isAuthenticated: true,
      user
    })
  }

  const handleSignOut = () => {
    setAuthState(initializeAuth())
    toast.success('Signed out successfully')
  }

  if (!authState?.isAuthenticated || !authState.user) {
    return <LandingPage onAuthenticate={handleAuthenticate} />
  }

  if (isCEOMode) {
    return <CEODashboard onSignOut={() => {
      setAdminSession(initializeAdminSession())
      toast.success('CEO Dashboard Deactivated', {
        description: 'Returned to standard view'
      })
    }} />
  }

  const applyAdjustmentsToCanvas = () => {
    if (editingImageIndex === null || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = referenceImages[editingImageIndex].original
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((tempAdjustments.rotation * Math.PI) / 180)
      if (tempAdjustments.flipH) {
        ctx.scale(-1, 1)
      }
      ctx.translate(-canvas.width / 2, -canvas.height / 2)
      
      ctx.filter = `brightness(${tempAdjustments.brightness}%) contrast(${tempAdjustments.contrast}%) blur(${tempAdjustments.blur}px)`
      ctx.drawImage(img, 0, 0)
      ctx.restore()
    }
  }

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    const currentStatus = subscriptionStatus ?? initializeSubscription()
    const maxImages = currentStatus.tier === 'pro' 
      ? SUBSCRIPTION_LIMITS.pro.maxReferenceImages 
      : SUBSCRIPTION_LIMITS.free.maxReferenceImages

    if (referenceImages.length >= maxImages) {
      toast.error(`Maximum ${maxImages} reference images allowed${currentStatus.tier === 'free' ? ' on free tier' : ''}`)
      if (currentStatus.tier === 'free') {
        setUpgradeReason('upgrade_prompt')
        setUpgradeModalOpen(true)
      }
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      setReferenceImages(prev => [...prev, {
        original: imageUrl,
        adjustments: {
          brightness: 100,
          contrast: 100,
          blur: 0,
          rotation: 0,
          flipH: false,
        }
      }])
      toast.success('Reference image added')
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    
    if (files.length === 0) {
      toast.error('No valid image files found')
      return
    }

    const currentStatus = subscriptionStatus ?? initializeSubscription()
    const maxImages = currentStatus.tier === 'pro' 
      ? SUBSCRIPTION_LIMITS.pro.maxReferenceImages 
      : SUBSCRIPTION_LIMITS.free.maxReferenceImages

    const availableSlots = maxImages - referenceImages.length
    if (files.length > availableSlots) {
      toast.error(`Can only add ${availableSlots} more image(s)`)
    }

    files.slice(0, availableSlots).forEach(file => handleImageUpload(file))
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) handleImageUpload(file)
        break
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const currentStatus = subscriptionStatus ?? initializeSubscription()
    const maxImages = currentStatus.tier === 'pro' 
      ? SUBSCRIPTION_LIMITS.pro.maxReferenceImages 
      : SUBSCRIPTION_LIMITS.free.maxReferenceImages

    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    const availableSlots = maxImages - referenceImages.length
    
    if (imageFiles.length > availableSlots) {
      toast.error(`Can only add ${availableSlots} more image(s)`)
    }

    imageFiles.slice(0, availableSlots).forEach(file => handleImageUpload(file))
  }

  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index))
    if (fileInputRef.current) fileInputRef.current.value = ''
    toast.success('Reference image removed')
  }

  const openImageEditor = (index: number) => {
    const img = referenceImages[index]
    setEditingImageIndex(index)
    setTempAdjustments(img.adjustments)
  }

  const saveImageEdits = () => {
    if (editingImageIndex === null || !canvasRef.current) return
    
    const editedUrl = canvasRef.current.toDataURL('image/png')
    setReferenceImages(prev => prev.map((img, idx) => 
      idx === editingImageIndex 
        ? { ...img, edited: editedUrl, adjustments: tempAdjustments }
        : img
    ))
    setEditingImageIndex(null)
    toast.success('Image edits saved')
  }

  const cancelImageEdits = () => {
    setEditingImageIndex(null)
    setTempAdjustments({
      brightness: 100,
      contrast: 100,
      blur: 0,
      rotation: 0,
      flipH: false,
    })
  }

  const resetImageEdits = (index: number) => {
    setReferenceImages(prev => prev.map((img, idx) => 
      idx === index 
        ? { ...img, edited: undefined, adjustments: {
            brightness: 100,
            contrast: 100,
            blur: 0,
            rotation: 0,
            flipH: false,
          }}
        : img
    ))
    toast.success('Image reset to original')
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    if (!hasConfiguredKeys) {
      toast.error('Please configure API keys first')
      setApiKeyManagerOpen(true)
      return
    }

    const currentStatus = subscriptionStatus ?? initializeSubscription()

    if (mode === 'video' && !SUBSCRIPTION_LIMITS[currentStatus.tier].features.videoGeneration) {
      setUpgradeReason('video_locked')
      setUpgradeModalOpen(true)
      return
    }

    if (!canGenerate(currentStatus)) {
      setUpgradeReason('limit_reached')
      setUpgradeModalOpen(true)
      return
    }

    const provider = getProviderForFeature(apiKeys ?? {}, mode)
    if (!provider) {
      toast.error(`No API provider configured for ${mode} generation`)
      setApiKeyManagerOpen(true)
      return
    }

    setIsGenerating(true)

    try {
      let finalPrompt = prompt
      
      if (selectedStyle) {
        const preset = stylePresets.find(p => p.id === selectedStyle)
        if (preset) {
          finalPrompt = `${prompt}, ${preset.promptModifier}`
        }
      }

      const promptText = `You are an AI art director. Based on this user prompt: "${finalPrompt}", create a detailed, vivid description suitable for image generation. Include specific details about style, lighting, composition, colors, and mood. Keep it under 100 words but make it highly descriptive and evocative.`
      
      const enhancedPrompt = await window.spark.llm(promptText, 'gpt-4o-mini')

      const mockUrl = mode === 'image' 
        ? `https://picsum.photos/seed/${Date.now()}/800/600`
        : `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`

      await new Promise(resolve => setTimeout(resolve, mode === 'image' ? 2000 : 4000))

      const newItem: MediaItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: mode,
        prompt: prompt,
        url: mockUrl,
        createdAt: Date.now(),
      }

      setGallery(current => [...(current ?? []), newItem])

      setSubscriptionStatus(current => {
        const updated = current ?? initializeSubscription()
        return {
          ...updated,
          generationsUsed: updated.generationsUsed + 1
        }
      })
      
      toast.success(`${mode === 'image' ? 'Image' : 'Video'} generated successfully!`)
      setPrompt('')
      setSelectedStyle(null)

      if (shouldShowUpgradePrompt(currentStatus)) {
        setTimeout(() => {
          setUpgradeReason('upgrade_prompt')
          setUpgradeModalOpen(true)
        }, 1500)
      }
    } catch (error) {
      toast.error('Generation failed. Please try again.')
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDelete = (id: string) => {
    setGallery(current => (current ?? []).filter(item => item.id !== id))
    setSelectedMedia(null)
    toast.success('Deleted successfully')
  }

  const handleDownload = (item: MediaItem) => {
    const link = document.createElement('a')
    link.href = item.url
    link.download = `${item.type}-${item.id}.${item.type === 'image' ? 'jpg' : 'mp4'}`
    link.click()
    toast.success('Download started')
  }

  const handleUpgrade = () => {
    setUpgradeModalOpen(false)
    if (hasStripeConfigured) {
      setStripeCheckoutOpen(true)
    } else {
      setStripeConfigOpen(true)
    }
  }

  const handleStripeConfigured = () => {
    setStripeCheckoutOpen(true)
  }

  const handlePaymentSuccess = () => {
    const userId = authState?.user?.id || 'default-user'
    const stripeSubscription = simulateSuccessfulPayment('session_id', userId)
    
    setSubscriptionStatus(current => ({
      ...(current ?? initializeSubscription()),
      tier: 'pro',
      generationsLimit: null,
      stripeCustomerId: userId,
      stripeSubscriptionId: stripeSubscription.id,
      stripeStatus: stripeSubscription.status,
      currentPeriodEnd: stripeSubscription.currentPeriodEnd,
      cancelAtPeriodEnd: false
    }))
  }

  const handleSubscriptionCanceled = () => {
    setSubscriptionStatus(current => ({
      ...(current ?? initializeSubscription()),
      cancelAtPeriodEnd: true
    }))
  }

  const handleModeChange = (newMode: string) => {
    const currentStatus = subscriptionStatus ?? initializeSubscription()
    
    if (newMode === 'video' && !SUBSCRIPTION_LIMITS[currentStatus.tier].features.videoGeneration) {
      setUpgradeReason('video_locked')
      setUpgradeModalOpen(true)
      return
    }
    
    setMode(newMode as MediaType)
  }

  const currentStatus = subscriptionStatus ?? initializeSubscription()
  const maxReferenceImages = currentStatus.tier === 'pro' 
    ? SUBSCRIPTION_LIMITS.pro.maxReferenceImages 
    : SUBSCRIPTION_LIMITS.free.maxReferenceImages

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">AI Creator Studio</h1>
              {currentStatus.tier === 'pro' && (
                <Badge className="bg-gradient-to-r from-primary to-accent text-white gap-1">
                  <Crown weight="fill" size={14} />
                  Pro
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setApiKeyManagerOpen(true)}
                className="relative"
                title="API Keys"
              >
                <Key weight="fill" size={20} />
                {hasConfiguredKeys && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setStripeConfigOpen(true)}
                className="relative"
                title="Stripe Settings"
              >
                <CreditCard weight="fill" size={20} />
                {hasStripeConfigured && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setAdminSettingsOpen(true)}
                className="relative"
                title="Admin Settings"
              >
                <GearSix weight="fill" size={20} />
              </Button>
              {currentStatus.tier === 'pro' && (
                <Button
                  variant="outline"
                  onClick={() => setSubscriptionManagementOpen(true)}
                  className="gap-2"
                  title="Manage Subscription"
                >
                  <Crown weight="fill" size={20} />
                  Manage Pro
                </Button>
              )}
              <Button
                variant={isCEOMode ? "default" : "outline"}
                onClick={() => {
                  if (isCEOMode) {
                    setAdminSession(initializeAdminSession())
                    toast.success('CEO Dashboard Deactivated', {
                      description: 'Returned to standard view'
                    })
                  } else {
                    setAdminLoginOpen(true)
                  }
                }}
                className="gap-2"
                title={isCEOMode ? "Exit CEO Dashboard" : "CEO Dashboard"}
              >
                <Lightning weight="fill" size={20} />
                {isCEOMode ? 'Exit CEO' : 'CEO Mode'}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setAssistantOpen(true)}
                className="relative"
                title="AI Assistant"
              >
                <ChatCircleDots weight="fill" size={20} />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="gap-2"
                title="Sign Out"
              >
                <SignOut weight="bold" size={20} />
                Sign Out
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground">Welcome back, {authState.user?.name}!</p>
        </header>

        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as 'generate' | 'edit')} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="generate" className="gap-2">
              <Sparkle weight="fill" size={16} />
              AI Generate
            </TabsTrigger>
            <TabsTrigger value="edit" className="gap-2">
              <Scissors weight="fill" size={16} />
              Photo Editor
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {mainTab === 'generate' ? (
          <div className="grid lg:grid-cols-[400px_1fr] gap-8">
          <div className="space-y-6">
            <APIKeyBanner 
              hasAnyKey={hasConfiguredKeys}
              onConfigureClick={() => setApiKeyManagerOpen(true)}
            />

            <UsageIndicator 
              subscriptionStatus={currentStatus}
              onUpgradeClick={() => {
                setUpgradeReason('upgrade_prompt')
                setUpgradeModalOpen(true)
              }}
            />

            <Card className="p-6">
              <Tabs value={mode} onValueChange={handleModeChange}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="image" className="gap-2">
                    <ImageIcon weight="fill" />
                    Image
                  </TabsTrigger>
                  <TabsTrigger value="video" className="gap-2 relative">
                    <VideoCamera weight="fill" />
                    Video
                    {currentStatus.tier === 'free' && (
                      <Crown weight="fill" className="absolute -top-1 -right-1 text-primary" size={14} />
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="image" className="mt-0 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Describe your image
                    </label>
                    <Textarea
                      placeholder="A serene mountain landscape at sunset, with vibrant orange and purple skies..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onPaste={handlePaste}
                      rows={6}
                      className="resize-none"
                      disabled={isGenerating}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {prompt.length} characters
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">
                        Reference Images {referenceImages.length > 0 && `(${referenceImages.length}/${maxReferenceImages})`}
                      </label>
                      {referenceImages.length > 0 && (
                        <button
                          onClick={() => {
                            setReferenceImages([])
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {referenceImages.map((img, index) => (
                        <div
                          key={index}
                          className="relative w-20 h-20 border-2 border-border rounded-lg overflow-hidden group"
                        >
                          <img src={img.edited || img.original} alt={`Reference ${index + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openImageEditor(index)
                              }}
                              className="bg-primary text-primary-foreground rounded-full p-1.5 hover:scale-110 transition-transform"
                              title="Edit image"
                            >
                              <PencilSimple size={14} weight="bold" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeReferenceImage(index)
                              }}
                              className="bg-destructive text-destructive-foreground rounded-full p-1.5 hover:scale-110 transition-transform"
                              title="Remove image"
                            >
                              <X size={14} weight="bold" />
                            </button>
                          </div>
                          {img.edited && (
                            <Badge className="absolute top-1 right-1 px-1 py-0 text-[10px] h-4">
                              <PencilSimple size={10} weight="fill" />
                            </Badge>
                          )}
                        </div>
                      ))}
                      {referenceImages.length < maxReferenceImages && (
                        <div
                          className="w-20 h-20 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors cursor-pointer flex items-center justify-center bg-muted/30"
                          onDrop={handleDrop}
                          onDragOver={(e) => e.preventDefault()}
                          onClick={() => fileInputRef.current?.click()}
                          title="Add reference image"
                        >
                          <Upload size={24} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Style Presets
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {stylePresets.map((preset) => (
                        <Badge
                          key={preset.id}
                          variant={selectedStyle === preset.id ? "default" : "outline"}
                          className={`cursor-pointer transition-all hover:scale-105 ${
                            selectedStyle === preset.id 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-primary/10'
                          }`}
                          onClick={() => setSelectedStyle(selectedStyle === preset.id ? null : preset.id)}
                        >
                          {selectedStyle === preset.id && (
                            <Check size={12} weight="bold" className="mr-1" />
                          )}
                          {preset.name}
                        </Badge>
                      ))}
                    </div>
                    {selectedStyle && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {stylePresets.find(p => p.id === selectedStyle)?.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt.trim() || !hasConfiguredKeys}
                      className="flex-1 gap-2"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin">⟳</div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkle weight="fill" />
                          Generate Image
                        </>
                      )}
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </TabsContent>

                <TabsContent value="video" className="mt-0 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Describe your video
                    </label>
                    <Textarea
                      placeholder="A time-lapse of a bustling city street transitioning from day to night..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onPaste={handlePaste}
                      rows={6}
                      className="resize-none"
                      disabled={isGenerating}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {prompt.length} characters
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">
                        Reference Images {referenceImages.length > 0 && `(${referenceImages.length}/${maxReferenceImages})`}
                      </label>
                      {referenceImages.length > 0 && (
                        <button
                          onClick={() => {
                            setReferenceImages([])
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {referenceImages.map((img, index) => (
                        <div
                          key={index}
                          className="relative w-20 h-20 border-2 border-border rounded-lg overflow-hidden group"
                        >
                          <img src={img.edited || img.original} alt={`Reference ${index + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openImageEditor(index)
                              }}
                              className="bg-accent text-accent-foreground rounded-full p-1.5 hover:scale-110 transition-transform"
                              title="Edit image"
                            >
                              <PencilSimple size={14} weight="bold" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeReferenceImage(index)
                              }}
                              className="bg-destructive text-destructive-foreground rounded-full p-1.5 hover:scale-110 transition-transform"
                              title="Remove image"
                            >
                              <X size={14} weight="bold" />
                            </button>
                          </div>
                          {img.edited && (
                            <Badge className="absolute top-1 right-1 px-1 py-0 text-[10px] h-4">
                              <PencilSimple size={10} weight="fill" />
                            </Badge>
                          )}
                        </div>
                      ))}
                      {referenceImages.length < maxReferenceImages && (
                        <div
                          className="w-20 h-20 border-2 border-dashed border-border rounded-lg hover:border-accent transition-colors cursor-pointer flex items-center justify-center bg-muted/30"
                          onDrop={handleDrop}
                          onDragOver={(e) => e.preventDefault()}
                          onClick={() => fileInputRef.current?.click()}
                          title="Add reference image"
                        >
                          <Upload size={24} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt.trim() || !hasConfiguredKeys}
                      className="flex-1 gap-2 bg-accent hover:bg-accent/90"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin">⟳</div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkle weight="fill" />
                          Generate Video
                        </>
                      )}
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </TabsContent>
              </Tabs>
            </Card>

            {isGenerating && (
              <Card className="p-6 shimmer">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="animate-pulse">
                      <Sparkle weight="fill" className="text-primary" size={24} />
                    </div>
                    <div>
                      <p className="font-medium">Creating your {mode}...</p>
                      <p className="text-sm text-muted-foreground">This may take a moment</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Your {mode === 'image' ? 'Images' : 'Videos'} ({filteredGallery.length})
              </h2>
            </div>

            {filteredGallery.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  {mode === 'image' ? (
                    <ImageIcon size={48} weight="thin" className="text-muted-foreground" />
                  ) : (
                    <VideoCamera size={48} weight="thin" className="text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-lg font-medium mb-1">No {mode}s yet</p>
                    <p className="text-sm text-muted-foreground">
                      Generate your first {mode} to get started
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredGallery.map((item) => (
                  <Card
                    key={item.id}
                    className="group cursor-pointer overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20"
                    onClick={() => setSelectedMedia(item)}
                  >
                    <div className="aspect-video relative bg-muted">
                      {item.type === 'image' ? (
                        <img
                          src={item.url}
                          alt={item.prompt}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={item.url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Badge className="absolute top-2 right-2">
                        {item.type === 'image' ? (
                          <ImageIcon weight="fill" size={12} />
                        ) : (
                          <VideoCamera weight="fill" size={12} />
                        )}
                      </Badge>
                    </div>
                    <div className="p-3">
                      <p className="text-sm line-clamp-2">{item.prompt}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
        ) : (
          <PhotoEditor 
            subscriptionStatus={currentStatus}
            onUpgradeClick={() => {
              setUpgradeReason('upgrade_prompt')
              setUpgradeModalOpen(true)
            }}
          />
        )}
      </div>

      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMedia?.type === 'image' ? (
                <ImageIcon weight="fill" />
              ) : (
                <VideoCamera weight="fill" />
              )}
              {selectedMedia?.type === 'image' ? 'Image' : 'Video'} Details
            </DialogTitle>
          </DialogHeader>
          {selectedMedia && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden bg-muted">
                {selectedMedia.type === 'image' ? (
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.prompt}
                    className="w-full h-auto"
                  />
                ) : (
                  <div className="relative">
                    <video
                      src={selectedMedia.url}
                      className="w-full h-auto"
                      controls
                      autoPlay
                      loop
                    />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium mb-1">Prompt</h3>
                <p className="text-sm text-muted-foreground">{selectedMedia.prompt}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleDownload(selectedMedia)}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Download weight="bold" />
                  Download
                </Button>
                <Button
                  onClick={() => handleDelete(selectedMedia.id)}
                  variant="destructive"
                  className="flex-1 gap-2"
                >
                  <Trash weight="bold" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editingImageIndex !== null} onOpenChange={() => cancelImageEdits()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PencilSimple weight="fill" />
              Edit Reference Image
            </DialogTitle>
          </DialogHeader>
          {editingImageIndex !== null && (
            <div className="space-y-6">
              <div className="rounded-lg overflow-hidden bg-muted flex items-center justify-center p-4">
                <canvas 
                  ref={canvasRef}
                  className="max-w-full max-h-[400px] w-auto h-auto"
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Brightness: {tempAdjustments.brightness}%
                  </label>
                  <Slider
                    value={[tempAdjustments.brightness]}
                    onValueChange={(v) => setTempAdjustments(prev => ({ ...prev, brightness: v[0] }))}
                    min={0}
                    max={200}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Contrast: {tempAdjustments.contrast}%
                  </label>
                  <Slider
                    value={[tempAdjustments.contrast]}
                    onValueChange={(v) => setTempAdjustments(prev => ({ ...prev, contrast: v[0] }))}
                    min={0}
                    max={200}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Blur: {tempAdjustments.blur}px
                  </label>
                  <Slider
                    value={[tempAdjustments.blur]}
                    onValueChange={(v) => setTempAdjustments(prev => ({ ...prev, blur: v[0] }))}
                    min={0}
                    max={10}
                    step={0.5}
                    className="w-full"
                  />
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium mb-3 block">
                    Transformations
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTempAdjustments(prev => ({ ...prev, flipH: !prev.flipH }))}
                      className={tempAdjustments.flipH ? 'bg-primary/10' : ''}
                    >
                      <FlipHorizontal weight="bold" className="mr-2" />
                      Flip Horizontal
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTempAdjustments(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))}
                    >
                      <ArrowsClockwise weight="bold" className="mr-2" />
                      Rotate 90°
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTempAdjustments(prev => ({ ...prev, rotation: (prev.rotation - 90 + 360) % 360 }))}
                    >
                      <ArrowCounterClockwise weight="bold" className="mr-2" />
                      Rotate -90°
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTempAdjustments({
                        brightness: 100,
                        contrast: 100,
                        blur: 0,
                        rotation: 0,
                        flipH: false,
                      })
                    }}
                    className="flex-1"
                  >
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    onClick={cancelImageEdits}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveImageEdits}
                    className="flex-1 gap-2"
                  >
                    <Check weight="bold" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AIAssistant
        open={assistantOpen}
        onOpenChange={setAssistantOpen}
        currentPrompt={prompt}
        onApplyPrompt={(newPrompt) => setPrompt(newPrompt)}
        mode={mode}
      />

      <SubscriptionModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        onUpgrade={handleUpgrade}
        onCheckoutClick={handleUpgrade}
        subscriptionStatus={currentStatus}
        reason={upgradeReason}
      />

      <StripeConfigDialog
        open={stripeConfigOpen}
        onOpenChange={setStripeConfigOpen}
        onConfigured={handleStripeConfigured}
      />

      <StripeCheckout
        open={stripeCheckoutOpen}
        onOpenChange={setStripeCheckoutOpen}
        userEmail={authState?.user?.email || ''}
        onSuccess={handlePaymentSuccess}
        onConfigureStripe={() => {
          setStripeCheckoutOpen(false)
          setStripeConfigOpen(true)
        }}
      />

      <SubscriptionManagement
        open={subscriptionManagementOpen}
        onOpenChange={setSubscriptionManagementOpen}
        subscriptionStatus={currentStatus}
        userId={authState?.user?.id || 'default-user'}
        onCanceled={handleSubscriptionCanceled}
      />

      <APIKeyManager
        open={apiKeyManagerOpen}
        onOpenChange={setApiKeyManagerOpen}
      />

      <AdminLogin
        open={adminLoginOpen}
        onOpenChange={setAdminLoginOpen}
        onAuthenticated={() => {
          setAdminSession(createAdminSession())
        }}
      />

      <AdminSettings
        open={adminSettingsOpen}
        onOpenChange={setAdminSettingsOpen}
      />
    </div>
  )
}

export default App
