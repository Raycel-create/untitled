import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ShoppingCart, 
  Check, 
  Warning, 
  CreditCard, 
  Crown, 
  Lightning,
  TestTube,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { getStoredStripeConfig } from '@/lib/stripe'
import { validateStripeKey, createCheckoutSession, type StripeConfig } from '@/lib/stripe-api'

interface StripePriceConfig {
  monthlyPriceId: string
  yearlyPriceId: string
}

interface TestResult {
  step: string
  status: 'pending' | 'success' | 'error'
  message: string
  timestamp: number
}

export function StripePricingTest() {
  const [priceConfig] = useKV<StripePriceConfig>('stripe-price-config', {
    monthlyPriceId: '',
    yearlyPriceId: ''
  })
  
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isTesting, setIsTesting] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [testStep, setTestStep] = useState(0)

  const stripeConfig = getStoredStripeConfig()
  const hasStripeKey = !!stripeConfig?.publishableKey
  const hasPriceIds = !!(priceConfig?.monthlyPriceId && priceConfig?.yearlyPriceId)

  const addTestResult = (step: string, status: TestResult['status'], message: string) => {
    setTestResults(prev => [...prev, {
      step,
      status,
      message,
      timestamp: Date.now()
    }])
  }

  const clearTestResults = () => {
    setTestResults([])
    setTestStep(0)
  }

  const runFullTest = async () => {
    if (!hasStripeKey || !hasPriceIds) {
      toast.error('Please configure Stripe and Price IDs first')
      return
    }

    setIsTesting(true)
    clearTestResults()

    try {
      setTestStep(1)
      addTestResult('Stripe Configuration', 'pending', 'Validating Stripe publishable key...')
      await new Promise(resolve => setTimeout(resolve, 500))

      const validation = validateStripeKey(stripeConfig.publishableKey)
      if (!validation.valid) {
        addTestResult('Stripe Configuration', 'error', 'Invalid Stripe publishable key format')
        setIsTesting(false)
        return
      }

      addTestResult(
        'Stripe Configuration', 
        'success', 
        `Valid ${validation.mode} mode key detected`
      )

      setTestStep(2)
      addTestResult('Price IDs', 'pending', 'Validating price ID formats...')
      await new Promise(resolve => setTimeout(resolve, 500))

      const monthlyValid = priceConfig.monthlyPriceId.startsWith('price_')
      const yearlyValid = priceConfig.yearlyPriceId.startsWith('price_')

      if (!monthlyValid || !yearlyValid) {
        addTestResult(
          'Price IDs', 
          'error', 
          'Invalid price ID format. Must start with "price_"'
        )
        setIsTesting(false)
        return
      }

      addTestResult(
        'Price IDs', 
        'success', 
        `Monthly: ${priceConfig.monthlyPriceId.slice(0, 15)}... • Yearly: ${priceConfig.yearlyPriceId.slice(0, 15)}...`
      )

      setTestStep(3)
      addTestResult('Monthly Plan', 'pending', 'Creating test checkout session...')
      await new Promise(resolve => setTimeout(resolve, 800))

      const config: StripeConfig = {
        publishableKey: stripeConfig.publishableKey,
        mode: validation.mode || 'test'
      }

      const monthlySession = await createCheckoutSession(config, {
        priceId: priceConfig.monthlyPriceId,
        userId: 'test-user-monthly',
        userEmail: 'test@example.com',
        successUrl: `${window.location.origin}?test=success`,
        cancelUrl: `${window.location.origin}?test=cancel`,
        mode: 'subscription',
        metadata: {
          plan: 'monthly',
          tier: 'pro',
          test: 'true'
        }
      })

      if (monthlySession) {
        addTestResult(
          'Monthly Plan', 
          'success', 
          `Session created: ${monthlySession.id}`
        )
      } else {
        addTestResult('Monthly Plan', 'error', 'Failed to create checkout session')
        setIsTesting(false)
        return
      }

      setTestStep(4)
      addTestResult('Yearly Plan', 'pending', 'Creating test checkout session...')
      await new Promise(resolve => setTimeout(resolve, 800))

      const yearlySession = await createCheckoutSession(config, {
        priceId: priceConfig.yearlyPriceId,
        userId: 'test-user-yearly',
        userEmail: 'test@example.com',
        successUrl: `${window.location.origin}?test=success`,
        cancelUrl: `${window.location.origin}?test=cancel`,
        mode: 'subscription',
        metadata: {
          plan: 'yearly',
          tier: 'pro',
          test: 'true'
        }
      })

      if (yearlySession) {
        addTestResult(
          'Yearly Plan', 
          'success', 
          `Session created: ${yearlySession.id}`
        )
      } else {
        addTestResult('Yearly Plan', 'error', 'Failed to create checkout session')
        setIsTesting(false)
        return
      }

      setTestStep(5)
      addTestResult('Integration Test', 'success', 'All tests passed! Your pricing is ready.')
      
      toast.success('All tests passed! 🎉', {
        description: 'Your Stripe pricing is configured correctly'
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addTestResult('Test Failed', 'error', errorMessage)
      toast.error('Test failed', {
        description: errorMessage
      })
    } finally {
      setIsTesting(false)
    }
  }

  const testSinglePlan = async (plan: 'monthly' | 'yearly') => {
    if (!hasStripeKey || !hasPriceIds) {
      toast.error('Please configure Stripe and Price IDs first')
      return
    }

    setSelectedPlan(plan)
    const priceId = plan === 'monthly' ? priceConfig.monthlyPriceId : priceConfig.yearlyPriceId

    toast.info(`Testing ${plan} plan...`, {
      description: 'Creating checkout session'
    })

    try {
      const validation = validateStripeKey(stripeConfig.publishableKey)
      const config: StripeConfig = {
        publishableKey: stripeConfig.publishableKey,
        mode: validation.mode || 'test'
      }

      const session = await createCheckoutSession(config, {
        priceId: priceId,
        userId: `test-user-${plan}-${Date.now()}`,
        userEmail: 'test@example.com',
        successUrl: `${window.location.origin}?test=success`,
        cancelUrl: `${window.location.origin}?test=cancel`,
        mode: 'subscription',
        metadata: {
          plan: plan,
          tier: 'pro',
          test: 'true'
        }
      })

      if (session) {
        toast.success(`${plan} plan test successful!`, {
          description: `Session ID: ${session.id.slice(0, 20)}...`
        })
      } else {
        toast.error(`${plan} plan test failed`)
      }
    } catch (error) {
      toast.error(`${plan} plan test failed`, {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const openLiveCheckout = async (plan: 'monthly' | 'yearly') => {
    if (!hasStripeKey || !hasPriceIds) {
      toast.error('Please configure Stripe and Price IDs first')
      return
    }

    const priceId = plan === 'monthly' ? priceConfig.monthlyPriceId : priceConfig.yearlyPriceId

    try {
      const validation = validateStripeKey(stripeConfig.publishableKey)
      const config: StripeConfig = {
        publishableKey: stripeConfig.publishableKey,
        mode: validation.mode || 'test'
      }

      const session = await createCheckoutSession(config, {
        priceId: priceId,
        userId: `live-test-${Date.now()}`,
        userEmail: 'test@example.com',
        successUrl: `${window.location.origin}?checkout=success`,
        cancelUrl: `${window.location.origin}?checkout=cancel`,
        mode: 'subscription',
        metadata: {
          plan: plan,
          tier: 'pro'
        }
      })

      if (session?.url) {
        toast.success('Opening Stripe Checkout...', {
          description: 'Test with card: 4242 4242 4242 4242'
        })
        setTimeout(() => {
          window.open(session.url, '_blank')
        }, 1000)
      }
    } catch (error) {
      toast.error('Failed to create checkout', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const TestStatusIcon = ({ status }: { status: TestResult['status'] }) => {
    switch (status) {
      case 'success':
        return <CheckCircle weight="fill" className="text-green-500" size={16} />
      case 'error':
        return <XCircle weight="fill" className="text-red-500" size={16} />
      case 'pending':
        return <Clock className="text-yellow-500 animate-pulse" size={16} />
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <div className="flex items-start gap-4">
          <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-3 rounded-lg flex-shrink-0">
            <TestTube weight="fill" className="text-white" size={24} />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">Test Your Stripe Pricing</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Verify that your custom Stripe products and prices are configured correctly before accepting real payments.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <Card className={`p-3 ${hasStripeKey ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <div className="flex items-center gap-2">
                  {hasStripeKey ? (
                    <CheckCircle weight="fill" className="text-green-500" size={16} />
                  ) : (
                    <XCircle weight="fill" className="text-red-500" size={16} />
                  )}
                  <span className="text-xs font-medium">Stripe Key</span>
                </div>
              </Card>
              
              <Card className={`p-3 ${hasPriceIds ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <div className="flex items-center gap-2">
                  {hasPriceIds ? (
                    <CheckCircle weight="fill" className="text-green-500" size={16} />
                  ) : (
                    <XCircle weight="fill" className="text-red-500" size={16} />
                  )}
                  <span className="text-xs font-medium">Price IDs</span>
                </div>
              </Card>

              <Card className={`p-3 ${hasStripeKey && hasPriceIds ? 'bg-blue-500/10 border-blue-500/20' : 'bg-muted/50'}`}>
                <div className="flex items-center gap-2">
                  <TestTube weight="fill" className={hasStripeKey && hasPriceIds ? 'text-blue-500' : 'text-muted-foreground'} size={16} />
                  <span className="text-xs font-medium">Ready to Test</span>
                </div>
              </Card>
            </div>

            <Button
              onClick={runFullTest}
              disabled={isTesting || !hasStripeKey || !hasPriceIds}
              className="w-full gap-2"
              size="lg"
            >
              {isTesting ? (
                <>
                  <div className="animate-spin">⟳</div>
                  Running Tests... (Step {testStep}/5)
                </>
              ) : (
                <>
                  <TestTube weight="fill" size={18} />
                  Run Full Integration Test
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {testResults.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <TestTube weight="fill" className="text-primary" size={20} />
              Test Results
            </h3>
            <Button variant="outline" size="sm" onClick={clearTestResults}>
              Clear
            </Button>
          </div>

          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.status === 'success' 
                    ? 'bg-green-500/10 border-green-500/20'
                    : result.status === 'error'
                    ? 'bg-red-500/10 border-red-500/20'
                    : 'bg-yellow-500/10 border-yellow-500/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <TestStatusIcon status={result.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{result.step}</p>
                    <p className="text-xs text-muted-foreground break-all">{result.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {testResults[testResults.length - 1]?.status === 'success' && testStep === 5 && (
            <Alert className="mt-4 bg-green-500/10 border-green-500/20">
              <CheckCircle weight="fill" className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-sm">
                <strong>Success!</strong> Your Stripe pricing configuration is working perfectly. You're ready to accept real payments.
              </AlertDescription>
            </Alert>
          )}
        </Card>
      )}

      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <ShoppingCart weight="fill" className="text-primary" size={20} />
          Test Individual Plans
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Card className="p-4 border-2 hover:border-primary/50 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown weight="fill" className="text-primary" size={16} />
                  <h4 className="font-semibold">Monthly Plan</h4>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-bold">$19</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>
                {priceConfig?.monthlyPriceId && (
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {priceConfig.monthlyPriceId}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Button
                onClick={() => testSinglePlan('monthly')}
                disabled={!hasStripeKey || !hasPriceIds}
                variant="outline"
                className="w-full gap-2"
                size="sm"
              >
                <TestTube weight="fill" size={14} />
                Test Session
              </Button>
              <Button
                onClick={() => openLiveCheckout('monthly')}
                disabled={!hasStripeKey || !hasPriceIds}
                className="w-full gap-2"
                size="sm"
              >
                <CreditCard weight="fill" size={14} />
                Open Checkout
              </Button>
            </div>
          </Card>

          <Card className="p-4 border-2 border-accent/50 hover:border-accent transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Lightning weight="fill" className="text-accent" size={16} />
                  <h4 className="font-semibold">Yearly Plan</h4>
                  <Badge className="text-[10px] h-4 px-1 bg-accent">Save 21%</Badge>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-bold">$15</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  $180/year • Save $48
                </p>
                {priceConfig?.yearlyPriceId && (
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {priceConfig.yearlyPriceId}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Button
                onClick={() => testSinglePlan('yearly')}
                disabled={!hasStripeKey || !hasPriceIds}
                variant="outline"
                className="w-full gap-2"
                size="sm"
              >
                <TestTube weight="fill" size={14} />
                Test Session
              </Button>
              <Button
                onClick={() => openLiveCheckout('yearly')}
                disabled={!hasStripeKey || !hasPriceIds}
                className="w-full gap-2 bg-accent hover:bg-accent/90"
                size="sm"
              >
                <CreditCard weight="fill" size={14} />
                Open Checkout
              </Button>
            </div>
          </Card>
        </div>

        <Alert>
          <CreditCard weight="fill" className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Test Card:</strong> Use 4242 4242 4242 4242 with any future expiry and CVC for testing Stripe checkout.
          </AlertDescription>
        </Alert>
      </Card>

      <Card className="p-4 bg-muted/30">
        <h4 className="text-sm font-semibold mb-3">What This Test Validates</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <Check weight="bold" className="text-primary mt-0.5 flex-shrink-0" size={14} />
            <span>Stripe publishable key is valid and properly formatted</span>
          </li>
          <li className="flex items-start gap-2">
            <Check weight="bold" className="text-primary mt-0.5 flex-shrink-0" size={14} />
            <span>Price IDs match real products in your Stripe account</span>
          </li>
          <li className="flex items-start gap-2">
            <Check weight="bold" className="text-primary mt-0.5 flex-shrink-0" size={14} />
            <span>Checkout sessions can be created successfully</span>
          </li>
          <li className="flex items-start gap-2">
            <Check weight="bold" className="text-primary mt-0.5 flex-shrink-0" size={14} />
            <span>Both monthly and yearly pricing plans work correctly</span>
          </li>
          <li className="flex items-start gap-2">
            <Check weight="bold" className="text-primary mt-0.5 flex-shrink-0" size={14} />
            <span>Integration is ready for real payment processing</span>
          </li>
        </ul>
      </Card>

      {!hasStripeKey && (
        <Alert variant="destructive">
          <Warning weight="fill" className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Stripe publishable key is missing. Configure your Stripe settings first.
          </AlertDescription>
        </Alert>
      )}

      {!hasPriceIds && hasStripeKey && (
        <Alert variant="destructive">
          <Warning weight="fill" className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Price IDs are missing. Go to the Pricing tab and configure your Stripe product Price IDs.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
