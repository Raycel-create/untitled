import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { EnvelopeSimple, Bell, Check, Warning, ChartBar, Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { EmailNotificationConfig, EmailNotification, initializeEmailConfig, validateEmail, sendBudgetAlert } from '@/lib/email-notifications'

interface EmailSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmailSettings({ open, onOpenChange }: EmailSettingsProps) {
  const [emailConfig, setEmailConfig] = useKV<EmailNotificationConfig>('email-notifications-config', initializeEmailConfig())
  const [emailHistory, setEmailHistory] = useKV<EmailNotification[]>('email-history', [])
  const [testEmail, setTestEmail] = useState('')
  const [isTesting, setIsTesting] = useState(false)

  const handleSave = () => {
    if (emailConfig?.enabled && emailConfig.recipientEmail) {
      if (!validateEmail(emailConfig.recipientEmail)) {
        toast.error('Invalid email address')
        return
      }
    }
    
    toast.success('Email settings saved', {
      description: emailConfig?.enabled 
        ? `Notifications will be sent to ${emailConfig.recipientEmail}`
        : 'Email notifications are disabled'
    })
  }

  const handleTestEmail = async () => {
    const email = testEmail || emailConfig?.recipientEmail
    
    if (!email) {
      toast.error('Please enter an email address')
      return
    }

    if (!validateEmail(email)) {
      toast.error('Invalid email address')
      return
    }

    setIsTesting(true)
    
    try {
      const notification = await sendBudgetAlert(
        email,
        80,
        80,
        100,
        'monthly'
      )
      
      setEmailHistory(current => [notification, ...(current ?? [])].slice(0, 50))
      
      toast.success('Test email sent!', {
        description: `Check ${email} for the test notification`
      })
      setTestEmail('')
    } catch (error) {
      toast.error('Failed to send test email')
    } finally {
      setIsTesting(false)
    }
  }

  const config = emailConfig ?? initializeEmailConfig()
  const history = emailHistory ?? []
  const recentEmails = history.slice(0, 5)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EnvelopeSimple weight="fill" />
            Email Notifications
          </DialogTitle>
          <DialogDescription>
            Configure email alerts for budget thresholds and spending activity
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Email Configuration</CardTitle>
              <CardDescription>
                Set up your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Enable Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive alerts via email
                  </p>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(checked) => 
                    setEmailConfig(current => ({ ...(current ?? initializeEmailConfig()), enabled: checked }))
                  }
                />
              </div>

              {config.enabled && (
                <>
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="recipient-email">Recipient Email Address</Label>
                    <Input
                      id="recipient-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={config.recipientEmail}
                      onChange={(e) => 
                        setEmailConfig(current => ({ 
                          ...(current ?? initializeEmailConfig()), 
                          recipientEmail: e.target.value 
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      All notifications will be sent to this address
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {config.enabled && config.recipientEmail && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alert Types</CardTitle>
                <CardDescription>
                  Choose which notifications to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-primary" />
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Budget Alerts</Label>
                      <p className="text-xs text-muted-foreground">
                        Notify when reaching 80% or 100% of budget
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={config.budgetAlerts}
                    onCheckedChange={(checked) => 
                      setEmailConfig(current => ({ 
                        ...(current ?? initializeEmailConfig()), 
                        budgetAlerts: checked 
                      }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Warning size={16} className="text-accent" />
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Spending Limit Alerts</Label>
                      <p className="text-xs text-muted-foreground">
                        Notify when custom spending thresholds are reached
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={config.spendingAlerts}
                    onCheckedChange={(checked) => 
                      setEmailConfig(current => ({ 
                        ...(current ?? initializeEmailConfig()), 
                        spendingAlerts: checked 
                      }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkle size={16} className="text-secondary" />
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Subscription Alerts</Label>
                      <p className="text-xs text-muted-foreground">
                        Notify about subscription changes and renewals
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={config.subscriptionAlerts}
                    onCheckedChange={(checked) => 
                      setEmailConfig(current => ({ 
                        ...(current ?? initializeEmailConfig()), 
                        subscriptionAlerts: checked 
                      }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChartBar size={16} className="text-muted-foreground" />
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Weekly Reports</Label>
                      <p className="text-xs text-muted-foreground">
                        Receive a summary of your spending every week
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={config.weeklyReports}
                    onCheckedChange={(checked) => 
                      setEmailConfig(current => ({ 
                        ...(current ?? initializeEmailConfig()), 
                        weeklyReports: checked 
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {config.enabled && config.recipientEmail && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Test Email</CardTitle>
                <CardDescription>
                  Send a test notification to verify your settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder={config.recipientEmail}
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleTestEmail}
                    disabled={isTesting}
                    variant="outline"
                  >
                    {isTesting ? 'Sending...' : 'Send Test'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave blank to use the configured recipient email
                </p>
              </CardContent>
            </Card>
          )}

          {recentEmails.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Notifications</CardTitle>
                <CardDescription>
                  Last {recentEmails.length} email alerts sent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentEmails.map((email) => (
                    <div key={email.id} className="flex items-start justify-between gap-4 text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{email.subject}</span>
                          <Badge variant={email.status === 'sent' ? 'default' : 'secondary'} className="shrink-0">
                            {email.status === 'sent' && <Check size={10} className="mr-1" weight="bold" />}
                            {email.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(email.sentAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              className="flex-1 gap-2"
            >
              <Check weight="bold" />
              Save Settings
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
