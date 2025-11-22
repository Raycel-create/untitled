import { useState, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Sparkle, Image as ImageIcon, VideoCamera, Download, Trash, X, Play, Pause, Upload } from '@phosphor-icons/react'
import { toast } from 'sonner'

type MediaType = 'image' | 'video'

interface MediaItem {
  id: string
  type: MediaType
  prompt: string
  url: string
  createdAt: number
}

function App() {
  const [mode, setMode] = useState<MediaType>('image')
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [gallery, setGallery] = useKV<MediaItem[]>('ai-creator-gallery', [])
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredGallery = (gallery ?? []).filter(item => item.type === mode)

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setReferenceImage(e.target?.result as string)
      toast.success('Reference image added')
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleImageUpload(file)
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
    const file = e.target.files?.[0]
    if (file) handleImageUpload(file)
  }

  const removeReferenceImage = () => {
    setReferenceImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    toast.success('Reference image removed')
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    setIsGenerating(true)

    try {
      const promptText = `You are an AI art director. Based on this user prompt: "${prompt}", create a detailed, vivid description suitable for image generation. Include specific details about style, lighting, composition, colors, and mood. Keep it under 100 words but make it highly descriptive and evocative.`
      
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
      
      toast.success(`${mode === 'image' ? 'Image' : 'Video'} generated successfully!`)
      setPrompt('')
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">AI Creator Studio</h1>
          <p className="text-muted-foreground">Generate stunning images and videos with AI</p>
        </header>

        <div className="grid lg:grid-cols-[400px_1fr] gap-8">
          <div className="space-y-6">
            <Card className="p-6">
              <Tabs value={mode} onValueChange={(v) => setMode(v as MediaType)}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="image" className="gap-2">
                    <ImageIcon weight="fill" />
                    Image
                  </TabsTrigger>
                  <TabsTrigger value="video" className="gap-2">
                    <VideoCamera weight="fill" />
                    Video
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
                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt.trim()}
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
                    <div
                      className="relative w-14 h-11 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors cursor-pointer flex items-center justify-center bg-muted/30"
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => fileInputRef.current?.click()}
                      title="Drop or paste reference image"
                    >
                      {referenceImage ? (
                        <>
                          <img src={referenceImage} alt="Reference" className="w-full h-full object-cover rounded-md" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeReferenceImage()
                            }}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:scale-110 transition-transform"
                          >
                            <X size={12} weight="bold" />
                          </button>
                        </>
                      ) : (
                        <Upload size={20} className="text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
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
                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt.trim()}
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
                    <div
                      className="relative w-14 h-11 border-2 border-dashed border-border rounded-lg hover:border-accent transition-colors cursor-pointer flex items-center justify-center bg-muted/30"
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => fileInputRef.current?.click()}
                      title="Drop or paste reference image"
                    >
                      {referenceImage ? (
                        <>
                          <img src={referenceImage} alt="Reference" className="w-full h-full object-cover rounded-md" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeReferenceImage()
                            }}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:scale-110 transition-transform"
                          >
                            <X size={12} weight="bold" />
                          </button>
                        </>
                      ) : (
                        <Upload size={20} className="text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
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
    </div>
  )
}

export default App
