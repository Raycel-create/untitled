import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Check, ArrowRight } from '@phosphor-icons/react'

export function StripePriceSetup() {
  return (
    <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
      <div className="flex items-start gap-4">
        <div className="bg-purple-500 p-3 rounded-lg flex-shrink-0">
          <ShoppingCart weight="fill" className="text-white" size={24} />
        </div>
        
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Create Your Subscription Products</h3>
            <p className="text-sm text-muted-foreground">
              Set up your pricing before accepting payments
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-card/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">Steps to create products:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Go to <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Stripe Products</a></li>
                <li>Click "+ Add product"</li>
                <li>Name: "AI Creator Studio Pro"</li>
                <li>Add two prices:
                  <ul className="ml-6 mt-1 space-y-0.5 list-disc">
                    <li>Monthly: $29/month</li>
                    <li>Yearly: $290/year</li>
                  </ul>
                </li>
                <li>Save and copy each Price ID (starts with price_)</li>
              </ol>
            </div>

            <div className="bg-card/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Update price IDs in code:</p>
              <p className="text-xs text-muted-foreground mb-2">
                Edit <code className="bg-muted px-1 py-0.5 rounded">src/lib/stripe.ts</code> lines 53-56:
              </p>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`export const STRIPE_PRICE_IDS = {
  pro_monthly: 'price_YOUR_MONTHLY_ID',
  pro_yearly: 'price_YOUR_YEARLY_ID',
}`}
              </pre>
            </div>
          </div>

          <Button
            onClick={() => window.open('https://dashboard.stripe.com/products', '_blank')}
            className="w-full gap-2"
          >
            <ShoppingCart weight="fill" size={16} />
            Create Products in Stripe
            <ArrowRight weight="bold" size={16} />
          </Button>
        </div>
      </div>
    </Card>
  )
}
