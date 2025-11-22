import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Key, ArrowRight, Info } from '@phosphor-icons/react'

interface APIKeyBannerProps {
  onConfigureClick: () => void
  hasAnyKey: boolean
}

export function APIKeyBanner({ onConfigureClick, hasAnyKey }: APIKeyBannerProps) {
  if (hasAnyKey) return null

  return (
    <Alert className="border-primary/50 bg-primary/5">
      <div className="flex items-start gap-3">
        <Key weight="fill" className="h-5 w-5 text-primary mt-0.5" />
        <div className="flex-1 space-y-2">
          <AlertDescription className="text-sm">
            <strong className="font-semibold">API Keys Required</strong>
            <p className="mt-1 text-muted-foreground">
              To use AI generation features, you need to configure at least one API provider. 
              Your keys are stored securely in your browser and used only for direct API requests.
            </p>
          </AlertDescription>
          <Button
            size="sm"
            onClick={onConfigureClick}
            className="gap-2 mt-2"
          >
            <Key weight="bold" size={14} />
            Configure API Keys
            <ArrowRight weight="bold" size={14} />
          </Button>
        </div>
      </div>
    </Alert>
  )
}
