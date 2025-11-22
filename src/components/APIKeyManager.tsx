import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Key, Check, X, Eye, EyeSlash, Info, Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { 
  APIKeys, 
  API_PROVIDERS, 
  getConfiguredProviders, 
  maskAPIKey, 
  validateAPIKeyFormat 
} from '@/lib/api-keys'

interface APIKeyManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function APIKeyManager({ open, onOpenChange }: APIKeyManagerProps) {
  const [apiKeys, setApiKeys] = useKV<APIKeys>('api-keys', {})
  const [editingProvider, setEditingProvider] = useState<keyof APIKeys | null>(null)
  const [tempKey, setTempKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const configuredProviders = getConfiguredProviders(apiKeys ?? {})

  const handleEditProvider = (provider: keyof APIKeys) => {
    setEditingProvider(provider)
    setTempKey('')
    setShowKey(false)
    setValidationError(null)
  }

  const handleSaveKey = () => {
    if (!editingProvider) return

    const validation = validateAPIKeyFormat(editingProvider, tempKey)
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid API key format')
      return
    }

    setApiKeys(current => ({
      ...(current ?? {}),
      [editingProvider]: tempKey.trim()
    }))

    toast.success(`${API_PROVIDERS[editingProvider].name} API key saved`)
    setEditingProvider(null)
    setTempKey('')
    setValidationError(null)
  }

  const handleRemoveKey = (provider: keyof APIKeys) => {
    setApiKeys(current => {
      const updated = { ...(current ?? {}) }
      delete updated[provider]
      return updated
    })
    toast.success(`${API_PROVIDERS[provider].name} API key removed`)
  }

  const handleCancel = () => {
    setEditingProvider(null)
    setTempKey('')
    setValidationError(null)
    setShowKey(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key weight="fill" />
            API Key Management
          </DialogTitle>
          <DialogDescription>
            Configure your AI provider API keys to enable generation features
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Info weight="fill" className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Your API keys are stored securely in your browser and never sent to our servers. 
            They're only used to make direct requests to the AI providers you configure.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {(Object.keys(API_PROVIDERS) as Array<keyof APIKeys>).map((provider) => {
            const providerInfo = API_PROVIDERS[provider]
            const status = configuredProviders.find(p => p.provider === provider)
            const currentKey = apiKeys?.[provider]
            const isEditing = editingProvider === provider

            return (
              <Card key={provider} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{providerInfo.name}</h3>
                        {status?.isConfigured && (
                          <Badge variant="outline" className="gap-1 text-xs bg-primary/5">
                            <Check size={12} weight="bold" />
                            Configured
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {providerInfo.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {providerInfo.features.map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            <Sparkle size={10} weight="fill" className="mr-1" />
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {status?.isConfigured && !isEditing && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProvider(provider)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveKey(provider)}
                          >
                            <X weight="bold" />
                          </Button>
                        </>
                      )}
                      {!status?.isConfigured && !isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProvider(provider)}
                          className="gap-2"
                        >
                          <Key size={14} weight="bold" />
                          Add Key
                        </Button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 pt-3 border-t border-border">
                      <div className="space-y-2">
                        <Label htmlFor={`key-${provider}`}>API Key</Label>
                        <div className="relative">
                          <Input
                            id={`key-${provider}`}
                            type={showKey ? 'text' : 'password'}
                            value={tempKey}
                            onChange={(e) => {
                              setTempKey(e.target.value)
                              setValidationError(null)
                            }}
                            placeholder={`Enter your ${providerInfo.name} API key`}
                            className="pr-10"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showKey ? <EyeSlash size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {validationError && (
                          <p className="text-xs text-destructive">{validationError}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancel}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveKey}
                          disabled={!tempKey.trim()}
                          className="flex-1 gap-2"
                        >
                          <Check weight="bold" />
                          Save Key
                        </Button>
                      </div>
                    </div>
                  ) : currentKey ? (
                    <div className="pt-3 border-t border-border">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {maskAPIKey(currentKey)}
                        </code>
                      </div>
                    </div>
                  ) : null}
                </div>
              </Card>
            )
          })}
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Need API Keys?</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenAI API Keys</a></p>
            <p>• <a href="https://platform.stability.ai/account/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Stability AI API Keys</a></p>
            <p>• <a href="https://replicate.com/account/api-tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Replicate API Tokens</a></p>
            <p>• <a href="https://runwayml.com/account/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">RunwayML API Keys</a></p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
