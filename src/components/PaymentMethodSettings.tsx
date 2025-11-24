import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  CreditCard, 
  Bank, 
  Warning, 
  Trash, 
  Check, 
  Plus,
  Star,
  Receipt,
  DownloadSimple,
  CaretRight,
  Wallet,
  CurrencyBtc,
  Globe,
  ShieldCheck
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { 
  PaymentMethod, 
  PaymentPreferences, 
  PaymentHistory,
  initializePaymentPreferences,
  formatCardNumber,
  formatExpiryDate,
  isCardExpired,
  isCardExpiringSoon,
  formatAmount,
  SUPPORTED_CURRENCIES,
  generateMockPaymentHistory
} from '@/lib/payment-methods'
import { AddPaymentMethodDialog } from '@/components/AddPaymentMethodDialog'
import { PaymentHistoryView } from '@/components/PaymentHistoryView'

interface PaymentMethodSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userEmail: string
  onOpenSpendingLimits?: () => void
}

export function PaymentMethodSettings({ open, onOpenChange, userEmail, onOpenSpendingLimits }: PaymentMethodSettingsProps) {
  const [paymentMethods, setPaymentMethods] = useKV<PaymentMethod[]>('payment-methods', [])
  const [preferences, setPreferences] = useKV<PaymentPreferences>('payment-preferences', {
    ...initializePaymentPreferences(),
    billingEmail: userEmail
  })
  const [paymentHistory] = useKV<PaymentHistory[]>('payment-history', generateMockPaymentHistory())
  
  const [activeTab, setActiveTab] = useState('methods')
  const [addMethodOpen, setAddMethodOpen] = useState(false)
  const [deletingMethodId, setDeletingMethodId] = useState<string | null>(null)

  const handleSetDefault = (methodId: string) => {
    setPaymentMethods(current =>
      (current ?? []).map(method => ({
        ...method,
        isDefault: method.id === methodId
      }))
    )
    
    setPreferences(current => ({
      ...(current ?? initializePaymentPreferences()),
      defaultPaymentMethodId: methodId
    }))
    
    toast.success('Default payment method updated')
  }

  const handleDeleteMethod = (methodId: string) => {
    const method = (paymentMethods ?? []).find(m => m.id === methodId)
    if (method?.isDefault) {
      toast.error('Cannot delete default payment method', {
        description: 'Please set another payment method as default first'
      })
      return
    }

    setPaymentMethods(current => (current ?? []).filter(m => m.id !== methodId))
    setDeletingMethodId(null)
    toast.success('Payment method removed')
  }

  const handleAddPaymentMethod = (method: PaymentMethod) => {
    const isFirstMethod = (paymentMethods ?? []).length === 0
    const newMethod = {
      ...method,
      isDefault: isFirstMethod
    }
    
    setPaymentMethods(current => [...(current ?? []), newMethod])
    
    if (isFirstMethod) {
      setPreferences(current => ({
        ...(current ?? initializePaymentPreferences()),
        defaultPaymentMethodId: method.id
      }))
    }
    
    setAddMethodOpen(false)
    toast.success('Payment method added successfully')
  }

  const handlePreferenceChange = (key: keyof PaymentPreferences, value: any) => {
    setPreferences(current => ({
      ...(current ?? initializePaymentPreferences()),
      [key]: value
    }))
  }

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method.type) {
      case 'card':
        return <CreditCard weight="fill" size={20} />
      case 'bank':
        return <Bank weight="fill" size={20} />
      case 'paypal':
        return <Wallet weight="fill" size={20} />
      case 'crypto':
        return <CurrencyBtc weight="fill" size={20} />
    }
  }

  const getPaymentMethodDisplay = (method: PaymentMethod) => {
    switch (method.type) {
      case 'card':
        return {
          title: `${method.details.brand?.toUpperCase() || 'Card'} ${formatCardNumber(method.details.last4 || '0000')}`,
          subtitle: `Expires ${formatExpiryDate(method.details.expiryMonth || 12, method.details.expiryYear || 2024)}`
        }
      case 'bank':
        return {
          title: `${method.details.bankName || 'Bank Account'}`,
          subtitle: `Account ••••${method.details.accountLast4 || '0000'}`
        }
      case 'paypal':
        return {
          title: 'PayPal',
          subtitle: method.details.email || 'PayPal Account'
        }
      case 'crypto':
        return {
          title: 'Crypto Wallet',
          subtitle: `${method.details.walletAddress?.slice(0, 10)}...${method.details.walletAddress?.slice(-8)}`
        }
    }
  }

  const currentPreferences = preferences ?? initializePaymentPreferences()
  const methods = paymentMethods ?? []

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <CreditCard weight="fill" size={28} />
              Payment Settings
            </DialogTitle>
            <DialogDescription>
              Manage your payment methods, billing preferences, and view transaction history
            </DialogDescription>
          </DialogHeader>

          {onOpenSpendingLimits && (
            <Card className="p-4 bg-accent/5 border-accent">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <ShieldCheck size={24} weight="fill" className="text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Set Spending Limits</h4>
                    <p className="text-sm text-muted-foreground">
                      Control your budget with spending limits and alerts
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onOpenSpendingLimits}
                  className="gap-2"
                >
                  Configure
                  <CaretRight weight="bold" size={14} />
                </Button>
              </div>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="methods" className="gap-2">
                <CreditCard size={16} />
                Payment Methods
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-2">
                <Globe size={16} />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <Receipt size={16} />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="methods" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Your Payment Methods</h3>
                  <p className="text-sm text-muted-foreground">
                    {methods.length === 0 
                      ? 'No payment methods added yet'
                      : `${methods.length} payment method${methods.length > 1 ? 's' : ''} on file`
                    }
                  </p>
                </div>
                <Button onClick={() => setAddMethodOpen(true)} className="gap-2">
                  <Plus weight="bold" size={16} />
                  Add Payment Method
                </Button>
              </div>

              {methods.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <CreditCard size={48} weight="thin" className="text-muted-foreground" />
                    <div>
                      <p className="text-lg font-medium mb-1">No payment methods</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add a payment method to enable auto-renewal and faster checkout
                      </p>
                      <Button onClick={() => setAddMethodOpen(true)} className="gap-2">
                        <Plus weight="bold" size={16} />
                        Add Your First Payment Method
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="space-y-3">
                  {methods.map((method) => {
                    const display = getPaymentMethodDisplay(method)
                    const isExpired = method.type === 'card' && method.details.expiryMonth && method.details.expiryYear
                      ? isCardExpired(method.details.expiryMonth, method.details.expiryYear)
                      : false
                    const isExpiringSoon = method.type === 'card' && method.details.expiryMonth && method.details.expiryYear
                      ? isCardExpiringSoon(method.details.expiryMonth, method.details.expiryYear)
                      : false

                    return (
                      <Card 
                        key={method.id} 
                        className={`p-4 transition-all ${
                          method.isDefault 
                            ? 'border-primary shadow-md shadow-primary/20' 
                            : 'hover:border-muted-foreground/30'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 bg-muted rounded-lg">
                              {getPaymentMethodIcon(method)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{display.title}</h4>
                                {method.isDefault && (
                                  <Badge variant="default" className="gap-1">
                                    <Star weight="fill" size={12} />
                                    Default
                                  </Badge>
                                )}
                                {isExpired && (
                                  <Badge variant="destructive" className="gap-1">
                                    <Warning weight="fill" size={12} />
                                    Expired
                                  </Badge>
                                )}
                                {isExpiringSoon && !isExpired && (
                                  <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600">
                                    <Warning weight="fill" size={12} />
                                    Expiring Soon
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{display.subtitle}</p>
                              {method.billingAddress && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {method.billingAddress.city}, {method.billingAddress.state} {method.billingAddress.postalCode}
                                </p>
                              )}
                              {method.lastUsed && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Last used: {new Date(method.lastUsed).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!method.isDefault && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetDefault(method.id)}
                                className="gap-1"
                              >
                                <Star size={14} />
                                Set Default
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingMethodId(method.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash weight="bold" size={18} />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6 mt-6">
              <div>
                <h3 className="font-semibold text-lg mb-4">Billing Preferences</h3>
                <Card className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-renew" className="text-base font-medium">
                        Automatic Renewal
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically renew your subscription when it expires
                      </p>
                    </div>
                    <Switch
                      id="auto-renew"
                      checked={currentPreferences.autoRenew}
                      onCheckedChange={(checked) => handlePreferenceChange('autoRenew', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="invoices" className="text-base font-medium">
                        Email Invoices
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive invoice emails for all payments
                      </p>
                    </div>
                    <Switch
                      id="invoices"
                      checked={currentPreferences.receiveInvoices}
                      onCheckedChange={(checked) => handlePreferenceChange('receiveInvoices', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="reminders" className="text-base font-medium">
                        Payment Reminders
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified before your subscription renews
                      </p>
                    </div>
                    <Switch
                      id="reminders"
                      checked={currentPreferences.receivePaymentReminders}
                      onCheckedChange={(checked) => handlePreferenceChange('receivePaymentReminders', checked)}
                    />
                  </div>
                </Card>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4">Billing Information</h3>
                <Card className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="billing-email">Billing Email</Label>
                    <Input
                      id="billing-email"
                      type="email"
                      value={currentPreferences.billingEmail}
                      onChange={(e) => handlePreferenceChange('billingEmail', e.target.value)}
                      placeholder="billing@example.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      All billing notifications will be sent to this email
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Preferred Currency</Label>
                    <Select
                      value={currentPreferences.currency}
                      onValueChange={(value) => handlePreferenceChange('currency', value)}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_CURRENCIES.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.code} - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      This is your display currency. Actual charges may vary based on your payment method.
                    </p>
                  </div>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => toast.success('Preferences saved successfully')}>
                  <Check weight="bold" className="mr-2" size={16} />
                  Save Preferences
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <PaymentHistoryView 
                history={paymentHistory ?? []}
                currency={currentPreferences.currency}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AddPaymentMethodDialog
        open={addMethodOpen}
        onOpenChange={setAddMethodOpen}
        onAddMethod={handleAddPaymentMethod}
      />

      <Dialog open={!!deletingMethodId} onOpenChange={() => setDeletingMethodId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Warning weight="fill" size={24} className="text-destructive" />
              Delete Payment Method
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this payment method? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeletingMethodId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingMethodId && handleDeleteMethod(deletingMethodId)}
              className="gap-2"
            >
              <Trash weight="bold" size={16} />
              Delete Method
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
