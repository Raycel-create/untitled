import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, X, Lightning } from '@phosphor-icons/react'

interface StripePublishableKeyBannerProps {
  onConfigureClick: () => void
  onDismiss: () => void
}

export function StripePublishableKeyBanner({ onConfigureClick, onDismiss }: StripePublishableKeyBannerProps) {
  return (
    <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-primary/10 border-purple-500/20 relative overflow-hidden">
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
        title="Dismiss"
      >
        <X size={16} weight="bold" />
      </button>
      
      <div className="flex items-start gap-3 pr-6">
        <div className="bg-gradient-to-br from-purple-500 to-primary p-2.5 rounded-lg shrink-0">
          <Lightning weight="fill" className="text-white" size={20} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
            Complete Stripe Setup
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Your Stripe secret key is configured! Add your publishable key to start accepting payments.
          </p>
          <Button
            size="sm"
            onClick={onConfigureClick}
            className="gap-2 bg-gradient-to-r from-purple-500 to-primary hover:opacity-90"
          >
            <CreditCard weight="fill" size={16} />
            Add Publishable Key
          </Button>
        </div>
      </div>
    </Card>
  )
}
