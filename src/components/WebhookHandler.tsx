import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plugs, CheckCircle, XCircle, Clock, Trash, Play } from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  processWebhookEvent,
  logWebhookEvent,
  getWebhookLogs,
  clearWebhookLogs,
  simulateWebhook,
  type WebhookLog,
  type StripeWebhookPayload,
  type WebhookEventType
} from '@/lib/stripe-webhook'

interface WebhookHandlerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubscriptionUpdate: (userId: string, subscriptionData: any) => void
  currentUserId: string
}

export function WebhookHandler({ open, onOpenChange, onSubscriptionUpdate, currentUserId }: WebhookHandlerProps) {
  const [webhookPayload, setWebhookPayload] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [selectedTab, setSelectedTab] = useState<'manual' | 'logs' | 'simulate'>('manual')

  useEffect(() => {
    if (open) {
      setLogs(getWebhookLogs())
    }
  }, [open])

  const handleProcessWebhook = async () => {
    if (!webhookPayload.trim()) {
      toast.error('Please enter a webhook payload')
      return
    }

    setIsProcessing(true)

    try {
      const payload: StripeWebhookPayload = JSON.parse(webhookPayload)
      
      const result = await processWebhookEvent(payload, onSubscriptionUpdate)

      const log: WebhookLog = {
        id: payload.id,
        eventType: payload.type,
        status: result.success ? 'success' : 'error',
        timestamp: Date.now(),
        data: payload,
        error: result.error
      }

      logWebhookEvent(log)
      setLogs(getWebhookLogs())

      if (result.success) {
        toast.success('Webhook processed successfully', {
          description: `Event: ${payload.type}`
        })
        setWebhookPayload('')
      } else {
        toast.error('Webhook processing failed', {
          description: result.error
        })
      }
    } catch (error) {
      toast.error('Invalid webhook payload', {
        description: 'Please ensure the payload is valid JSON'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSimulateWebhook = async (eventType: WebhookEventType) => {
    setIsProcessing(true)

    try {
      const payload = simulateWebhook(eventType, currentUserId, {
        priceId: 'price_pro_monthly',
        status: 'active'
      })

      const result = await processWebhookEvent(payload, onSubscriptionUpdate)

      const log: WebhookLog = {
        id: payload.id,
        eventType: payload.type,
        status: result.success ? 'success' : 'error',
        timestamp: Date.now(),
        data: payload,
        error: result.error
      }

      logWebhookEvent(log)
      setLogs(getWebhookLogs())

      if (result.success) {
        toast.success('Webhook simulated successfully', {
          description: `Event: ${payload.type}`
        })
      } else {
        toast.error('Webhook simulation failed', {
          description: result.error
        })
      }
    } catch (error) {
      toast.error('Simulation failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClearLogs = () => {
    clearWebhookLogs()
    setLogs([])
    toast.success('Webhook logs cleared')
  }

  const examplePayload = {
    id: 'evt_example',
    object: 'event',
    type: 'checkout.session.completed',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'cs_test_example',
        object: 'checkout.session',
        client_reference_id: 'user_123',
        customer: 'cus_example',
        subscription: 'sub_example',
        payment_status: 'paid',
        metadata: {
          userId: 'user_123',
          priceId: 'price_pro_monthly'
        }
      }
    }
  }

  const simulateEvents: Array<{ type: WebhookEventType; label: string; description: string }> = [
    {
      type: 'checkout.session.completed',
      label: 'Checkout Completed',
      description: 'Simulate successful checkout'
    },
    {
      type: 'customer.subscription.created',
      label: 'Subscription Created',
      description: 'New subscription created'
    },
    {
      type: 'customer.subscription.updated',
      label: 'Subscription Updated',
      description: 'Subscription status changed'
    },
    {
      type: 'customer.subscription.deleted',
      label: 'Subscription Deleted',
      description: 'Subscription canceled'
    },
    {
      type: 'invoice.payment_succeeded',
      label: 'Payment Succeeded',
      description: 'Successful payment'
    },
    {
      type: 'invoice.payment_failed',
      label: 'Payment Failed',
      description: 'Failed payment attempt'
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-lg">
              <Plugs weight="fill" className="text-white" size={24} />
            </div>
            <DialogTitle>Stripe Webhook Handler</DialogTitle>
          </div>
          <DialogDescription>
            Process Stripe webhooks manually or view webhook logs
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={selectedTab === 'manual' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('manual')}
            size="sm"
          >
            Manual Entry
          </Button>
          <Button
            variant={selectedTab === 'simulate' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('simulate')}
            size="sm"
          >
            Simulate
          </Button>
          <Button
            variant={selectedTab === 'logs' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('logs')}
            size="sm"
          >
            Logs ({logs.length})
          </Button>
        </div>

        {selectedTab === 'manual' && (
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <Card className="p-4 bg-muted/30">
              <p className="text-sm text-muted-foreground mb-2">
                In production, configure this URL in your Stripe Dashboard as the webhook endpoint:
              </p>
              <code className="text-xs bg-background px-2 py-1 rounded border block">
                https://your-domain.com/api/webhooks/stripe
              </code>
            </Card>

            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Webhook Payload (JSON)</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWebhookPayload(JSON.stringify(examplePayload, null, 2))}
                >
                  Load Example
                </Button>
              </div>
              <Textarea
                value={webhookPayload}
                onChange={(e) => setWebhookPayload(e.target.value)}
                placeholder='Paste Stripe webhook payload here...'
                className="flex-1 font-mono text-xs resize-none"
              />
            </div>

            <Button
              onClick={handleProcessWebhook}
              disabled={isProcessing || !webhookPayload.trim()}
              className="w-full gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin">⟳</div>
                  Processing...
                </>
              ) : (
                <>
                  <Play weight="fill" />
                  Process Webhook
                </>
              )}
            </Button>
          </div>
        )}

        {selectedTab === 'simulate' && (
          <div className="space-y-4 flex-1 overflow-auto">
            <Card className="p-4 bg-muted/30">
              <p className="text-sm text-muted-foreground">
                Simulate Stripe webhook events for testing. Events will be processed as if they came from Stripe.
              </p>
            </Card>

            <div className="grid gap-3">
              {simulateEvents.map((event) => (
                <Card key={event.type} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{event.label}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                      <code className="text-xs text-muted-foreground mt-1 block">{event.type}</code>
                    </div>
                    <Button
                      onClick={() => handleSimulateWebhook(event.type)}
                      disabled={isProcessing}
                      size="sm"
                      className="gap-2"
                    >
                      <Play weight="fill" size={14} />
                      Simulate
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'logs' && (
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Recent webhook events (last 100)
              </p>
              {logs.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearLogs}
                  className="gap-2"
                >
                  <Trash weight="bold" size={14} />
                  Clear Logs
                </Button>
              )}
            </div>

            {logs.length === 0 ? (
              <Card className="p-12 text-center">
                <Clock size={48} weight="thin" className="text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No webhook events yet</p>
              </Card>
            ) : (
              <ScrollArea className="flex-1">
                <div className="space-y-2 pr-4">
                  {logs.map((log) => (
                    <Card key={log.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {log.status === 'success' ? (
                            <CheckCircle weight="fill" className="text-green-500" size={16} />
                          ) : (
                            <XCircle weight="fill" className="text-red-500" size={16} />
                          )}
                          <code className="text-xs font-mono">{log.eventType}</code>
                        </div>
                        <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                          {log.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                      {log.error && (
                        <p className="text-xs text-red-500 mt-2">
                          Error: {log.error}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
