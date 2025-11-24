import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreditCard, Bank, Wallet, CurrencyBtc, Plus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { PaymentMethod } from '@/lib/payment-methods'

interface AddPaymentMethodDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddMethod: (method: PaymentMethod) => void
}

export function AddPaymentMethodDialog({ open, onOpenChange, onAddMethod }: AddPaymentMethodDialogProps) {
  const [methodType, setMethodType] = useState<PaymentMethod['type']>('card')
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiryMonth, setExpiryMonth] = useState('')
  const [expiryYear, setExpiryYear] = useState('')
  const [cvv, setCvv] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [routingNumber, setRoutingNumber] = useState('')
  const [paypalEmail, setPaypalEmail] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [billingName, setBillingName] = useState('')
  const [billingLine1, setBillingLine1] = useState('')
  const [billingLine2, setBillingLine2] = useState('')
  const [billingCity, setBillingCity] = useState('')
  const [billingState, setBillingState] = useState('')
  const [billingPostalCode, setBillingPostalCode] = useState('')
  const [billingCountry, setBillingCountry] = useState('US')

  const resetForm = () => {
    setCardNumber('')
    setCardName('')
    setExpiryMonth('')
    setExpiryYear('')
    setCvv('')
    setBankName('')
    setAccountNumber('')
    setRoutingNumber('')
    setPaypalEmail('')
    setWalletAddress('')
    setBillingName('')
    setBillingLine1('')
    setBillingLine2('')
    setBillingCity('')
    setBillingState('')
    setBillingPostalCode('')
    setBillingCountry('US')
  }

  const detectCardBrand = (number: string): string => {
    const cleaned = number.replace(/\s/g, '')
    if (/^4/.test(cleaned)) return 'visa'
    if (/^5[1-5]/.test(cleaned)) return 'mastercard'
    if (/^3[47]/.test(cleaned)) return 'amex'
    if (/^6(?:011|5)/.test(cleaned)) return 'discover'
    if (/^35/.test(cleaned)) return 'jcb'
    if (/^62/.test(cleaned)) return 'unionpay'
    return 'card'
  }

  const formatCardNumberInput = (value: string) => {
    const cleaned = value.replace(/\s/g, '')
    const chunks = cleaned.match(/.{1,4}/g) || []
    return chunks.join(' ')
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '')
    if (value.length <= 16 && /^\d*$/.test(value)) {
      setCardNumber(formatCardNumberInput(value))
    }
  }

  const handleSubmit = () => {
    if (methodType === 'card') {
      if (!cardNumber || !cardName || !expiryMonth || !expiryYear || !cvv) {
        toast.error('Please fill in all card details')
        return
      }
      if (cardNumber.replace(/\s/g, '').length < 13) {
        toast.error('Invalid card number')
        return
      }
    } else if (methodType === 'bank') {
      if (!bankName || !accountNumber || !routingNumber) {
        toast.error('Please fill in all bank account details')
        return
      }
    } else if (methodType === 'paypal') {
      if (!paypalEmail) {
        toast.error('Please enter your PayPal email')
        return
      }
    } else if (methodType === 'crypto') {
      if (!walletAddress) {
        toast.error('Please enter your wallet address')
        return
      }
    }

    const newMethod: PaymentMethod = {
      id: `pm_${Math.random().toString(36).substr(2, 24)}`,
      type: methodType,
      isDefault: false,
      details: {},
      createdAt: Date.now()
    }

    if (methodType === 'card') {
      const last4 = cardNumber.replace(/\s/g, '').slice(-4)
      newMethod.details = {
        last4,
        brand: detectCardBrand(cardNumber),
        expiryMonth: parseInt(expiryMonth),
        expiryYear: parseInt(expiryYear)
      }
    } else if (methodType === 'bank') {
      newMethod.details = {
        bankName,
        accountLast4: accountNumber.slice(-4)
      }
    } else if (methodType === 'paypal') {
      newMethod.details = {
        email: paypalEmail
      }
    } else if (methodType === 'crypto') {
      newMethod.details = {
        walletAddress
      }
    }

    if (billingName && billingLine1 && billingCity && billingState && billingPostalCode) {
      newMethod.billingAddress = {
        name: billingName,
        line1: billingLine1,
        line2: billingLine2,
        city: billingCity,
        state: billingState,
        postalCode: billingPostalCode,
        country: billingCountry
      }
    }

    onAddMethod(newMethod)
    resetForm()
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 15 }, (_, i) => currentYear + i)
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'))

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open)
      if (!open) resetForm()
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Plus weight="bold" size={24} />
            Add Payment Method
          </DialogTitle>
          <DialogDescription>
            Choose your preferred payment method and enter the details
          </DialogDescription>
        </DialogHeader>

        <Tabs value={methodType} onValueChange={(v) => setMethodType(v as PaymentMethod['type'])}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="card" className="gap-2">
              <CreditCard size={16} />
              Card
            </TabsTrigger>
            <TabsTrigger value="bank" className="gap-2">
              <Bank size={16} />
              Bank
            </TabsTrigger>
            <TabsTrigger value="paypal" className="gap-2">
              <Wallet size={16} />
              PayPal
            </TabsTrigger>
            <TabsTrigger value="crypto" className="gap-2">
              <CurrencyBtc size={16} />
              Crypto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="card" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="card-number">Card Number</Label>
              <Input
                id="card-number"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={handleCardNumberChange}
                maxLength={19}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="card-name">Cardholder Name</Label>
              <Input
                id="card-name"
                placeholder="John Doe"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry-month">Month</Label>
                <Select value={expiryMonth} onValueChange={setExpiryMonth}>
                  <SelectTrigger id="expiry-month">
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry-year">Year</Label>
                <Select value={expiryYear} onValueChange={setExpiryYear}>
                  <SelectTrigger id="expiry-year">
                    <SelectValue placeholder="YYYY" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  type="password"
                  value={cvv}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value.length <= 4 && /^\d*$/.test(value)) {
                      setCvv(value)
                    }
                  }}
                  maxLength={4}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bank" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="bank-name">Bank Name</Label>
              <Input
                id="bank-name"
                placeholder="Chase Bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                placeholder="000123456789"
                value={accountNumber}
                onChange={(e) => {
                  const value = e.target.value
                  if (/^\d*$/.test(value)) {
                    setAccountNumber(value)
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="routing-number">Routing Number</Label>
              <Input
                id="routing-number"
                placeholder="110000000"
                value={routingNumber}
                onChange={(e) => {
                  const value = e.target.value
                  if (value.length <= 9 && /^\d*$/.test(value)) {
                    setRoutingNumber(value)
                  }
                }}
                maxLength={9}
              />
            </div>

            <Card className="p-3 bg-muted/50">
              <p className="text-xs text-muted-foreground">
                Your bank account will be verified via micro-deposits. This process typically takes 1-2 business days.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="paypal" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="paypal-email">PayPal Email</Label>
              <Input
                id="paypal-email"
                type="email"
                placeholder="your@email.com"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
              />
            </div>

            <Card className="p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground">
                You'll be redirected to PayPal to authorize automatic payments. Make sure this email matches your PayPal account.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="crypto" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="wallet-address">Wallet Address</Label>
              <Input
                id="wallet-address"
                placeholder="0x1234567890abcdef..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
              />
            </div>

            <Card className="p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">
                Supported cryptocurrencies: Bitcoin (BTC), Ethereum (ETH), USDC, USDT
              </p>
              <p className="text-xs text-muted-foreground">
                Payments will be processed through our crypto payment provider. Exchange rates are locked at the time of payment.
              </p>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold">Billing Address (Optional)</h3>
          
          <div className="space-y-2">
            <Label htmlFor="billing-name">Full Name</Label>
            <Input
              id="billing-name"
              placeholder="John Doe"
              value={billingName}
              onChange={(e) => setBillingName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-line1">Address Line 1</Label>
            <Input
              id="billing-line1"
              placeholder="123 Main St"
              value={billingLine1}
              onChange={(e) => setBillingLine1(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-line2">Address Line 2 (Optional)</Label>
            <Input
              id="billing-line2"
              placeholder="Apt 4B"
              value={billingLine2}
              onChange={(e) => setBillingLine2(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billing-city">City</Label>
              <Input
                id="billing-city"
                placeholder="New York"
                value={billingCity}
                onChange={(e) => setBillingCity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing-state">State</Label>
              <Input
                id="billing-state"
                placeholder="NY"
                value={billingState}
                onChange={(e) => setBillingState(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billing-postal">Postal Code</Label>
              <Input
                id="billing-postal"
                placeholder="10001"
                value={billingPostalCode}
                onChange={(e) => setBillingPostalCode(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing-country">Country</Label>
              <Select value={billingCountry} onValueChange={setBillingCountry}>
                <SelectTrigger id="billing-country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="JP">Japan</SelectItem>
                  <SelectItem value="CN">China</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="gap-2">
            <Plus weight="bold" size={16} />
            Add Payment Method
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
