import { useState, useRef, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ChatCircleDots, PaperPlaneRight, Sparkle, Lightbulb, X } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface AIAssistantProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPrompt?: string
  onApplyPrompt?: (prompt: string) => void
  mode?: 'image' | 'video'
}

const QUICK_SUGGESTIONS = [
  {
    icon: Sparkle,
    label: "Improve my prompt",
    description: "Enhance your current prompt with more details"
  },
  {
    icon: Lightbulb,
    label: "Give me ideas",
    description: "Suggest creative concepts to try"
  },
  {
    icon: ChatCircleDots,
    label: "How do I...",
    description: "Ask how to use a feature"
  }
]

export function AIAssistant({ open, onOpenChange, currentPrompt, onApplyPrompt, mode = 'image' }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI creative assistant. I can help you craft better prompts, suggest ideas, explain features, and troubleshoot any issues. How can I help you today?",
      timestamp: Date.now()
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [open])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      const context = `You are a helpful AI assistant for an AI image and video generation studio. 
Current context: User is in ${mode} mode. ${currentPrompt ? `Their current prompt is: "${currentPrompt}"` : 'They have no prompt yet.'}

The user asked: "${userMessage.content}"

Provide a helpful, concise response. If they're asking about improving a prompt, give specific suggestions. If asking for ideas, provide creative concepts. If asking how to use features, explain clearly. Keep responses under 150 words.`

      const response = await window.spark.llm(context, 'gpt-4o-mini')

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      toast.error('Failed to get response. Please try again.')
      console.error(error)
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickAction = async (action: string) => {
    let prompt = ''
    
    switch (action) {
      case 'improve':
        if (!currentPrompt) {
          toast.error('No prompt to improve. Enter a prompt first!')
          return
        }
        prompt = `Help me improve this ${mode} generation prompt: "${currentPrompt}". Make it more detailed and specific for better results.`
        break
      case 'ideas':
        prompt = `Give me 3 creative ${mode} generation ideas that would look stunning. Be specific and descriptive.`
        break
      case 'howto':
        prompt = 'How do I use reference images and style presets to get better results?'
        break
    }

    setInput(prompt)
    await handleSend()
  }

  const handleApplyPromptSuggestion = (content: string) => {
    const promptMatch = content.match(/"([^"]+)"/)
    if (promptMatch && onApplyPrompt) {
      onApplyPrompt(promptMatch[1])
      toast.success('Prompt applied!')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col h-full p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <ChatCircleDots weight="fill" className="text-primary" size={24} />
            </div>
            <div className="flex-1">
              <SheetTitle>AI Assistant</SheetTitle>
              <SheetDescription>24/7 creative support</SheetDescription>
            </div>
            <Badge variant="outline" className="bg-primary/5">
              <span className="relative flex h-2 w-2 mr-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Online
            </Badge>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'assistant' 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-secondary text-secondary-foreground'
              }`}>
                {message.role === 'assistant' ? (
                  <Sparkle weight="fill" size={16} />
                ) : (
                  <span className="text-xs font-medium">You</span>
                )}
              </div>
              <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block max-w-[85%] rounded-lg px-4 py-2.5 ${
                  message.role === 'assistant'
                    ? 'bg-muted text-foreground'
                    : 'bg-primary text-primary-foreground'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'assistant' && message.content.includes('"') && onApplyPrompt && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    onClick={() => handleApplyPromptSuggestion(message.content)}
                  >
                    Apply to prompt
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Sparkle weight="fill" size={16} />
              </div>
              <div className="bg-muted rounded-lg px-4 py-2.5">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="px-6 pb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Quick actions:</p>
            <div className="grid gap-2">
              {QUICK_SUGGESTIONS.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start h-auto py-2 px-3 text-left"
                  onClick={() => handleQuickAction(
                    index === 0 ? 'improve' : index === 1 ? 'ideas' : 'howto'
                  )}
                >
                  <suggestion.icon weight="fill" size={16} className="mr-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{suggestion.label}</p>
                    <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        <Separator />

        <div className="px-6 py-4">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Ask me anything..."
              rows={2}
              className="resize-none flex-1"
              disabled={isTyping}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              size="icon"
              className="h-auto px-3"
            >
              <PaperPlaneRight weight="fill" size={20} />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
