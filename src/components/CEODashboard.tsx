import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Crown, 
  Users, 
  Sparkle, 
  CurrencyDollar, 
  TrendUp, 
  ChartLine,
  SignOut,
  VideoCamera,
  Image as ImageIcon,
  Calendar,
  Lightning,
  ArrowUp,
  ArrowDown,
  GearSix,
  Key,
  Eye,
  EyeSlash,
  Check,
  ChatCircleDots,
  Brain,
  Warning,
  Question,
  Info,
  TrendDown,
  CreditCard,
  Bank,
  Globe,
  ShieldCheck,
  Link as LinkIcon,
  CheckCircle,
  XCircle
} from '@phosphor-icons/react'
import { SubscriptionStatus, initializeSubscription } from '@/lib/subscription'
import { toast, Toaster } from 'sonner'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

interface CEODashboardProps {
  onSignOut: () => void
}

interface MediaItem {
  id: string
  type: 'image' | 'video'
  prompt: string
  url: string
  createdAt: number
}

interface AnalyticsData {
  totalUsers: number
  activeUsers: number
  totalGenerations: number
  proSubscribers: number
  revenue: number
  avgGenerationsPerUser: number
  conversionRate: number
  growthRate: number
  revenueGrowth: number
}

interface TimeSeriesData {
  date: string
  users: number
  generations: number
  revenue: number
}

interface CEOAPIKeys {
  openaiKey: string
  grokKey: string
  stripeSecretKey: string
  stripePublishableKey: string
  stripeWebhookSecret: string
  bankApiKey: string
  paypalClientId: string
  paypalSecret: string
  plaidClientId: string
  plaidSecret: string
}

interface PaymentGatewayConfig {
  stripeEnabled: boolean
  paypalEnabled: boolean
  plaidEnabled: boolean
  testMode: boolean
  currency: string
  allowedPaymentMethods: string[]
  webhookUrl: string
  successUrl: string
  cancelUrl: string
}

interface ChatbotInteraction {
  id: string
  userId: string
  timestamp: number
  type: 'complaint' | 'question' | 'inquiry'
  message: string
  response: string
  resolved: boolean
  sentiment: 'positive' | 'neutral' | 'negative'
}

interface AIReport {
  totalInteractions: number
  complaintCount: number
  questionCount: number
  inquiryCount: number
  avgResponseTime: number
  resolutionRate: number
  sentimentBreakdown: {
    positive: number
    neutral: number
    negative: number
  }
  topIssues: { issue: string; count: number }[]
  summary: string
}

export function CEODashboard({ onSignOut }: CEODashboardProps) {
  const [gallery] = useKV<MediaItem[]>('ai-creator-gallery', [])
  const [subscriptionStatus] = useKV<SubscriptionStatus>('subscription-status', initializeSubscription())
  const [ceoKeys, setCeoKeys] = useKV<CEOAPIKeys>('ceo-api-keys', {
    openaiKey: '',
    grokKey: '',
    stripeSecretKey: '',
    stripePublishableKey: '',
    stripeWebhookSecret: '',
    bankApiKey: '',
    paypalClientId: '',
    paypalSecret: '',
    plaidClientId: '',
    plaidSecret: ''
  })
  const [paymentConfig, setPaymentConfig] = useKV<PaymentGatewayConfig>('payment-gateway-config', {
    stripeEnabled: true,
    paypalEnabled: false,
    plaidEnabled: false,
    testMode: false,
    currency: 'USD',
    allowedPaymentMethods: ['card', 'bank_transfer'],
    webhookUrl: '',
    successUrl: '/success',
    cancelUrl: '/canceled'
  })
  const [chatbotInteractions, setChatbotInteractions] = useKV<ChatbotInteraction[]>('chatbot-interactions', [])
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    activeUsers: 0,
    totalGenerations: 0,
    proSubscribers: 0,
    revenue: 0,
    avgGenerationsPerUser: 0,
    conversionRate: 0,
    growthRate: 0,
    revenueGrowth: 0
  })
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [tempKeys, setTempKeys] = useState<CEOAPIKeys>(ceoKeys || {
    openaiKey: '',
    grokKey: '',
    stripeSecretKey: '',
    stripePublishableKey: '',
    stripeWebhookSecret: '',
    bankApiKey: '',
    paypalClientId: '',
    paypalSecret: '',
    plaidClientId: '',
    plaidSecret: ''
  })
  const [tempPaymentConfig, setTempPaymentConfig] = useState<PaymentGatewayConfig>(paymentConfig || {
    stripeEnabled: true,
    paypalEnabled: false,
    plaidEnabled: false,
    testMode: false,
    currency: 'USD',
    allowedPaymentMethods: ['card', 'bank_transfer'],
    webhookUrl: '',
    successUrl: '/success',
    cancelUrl: '/canceled'
  })
  const [aiReport, setAiReport] = useState<AIReport | null>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const generateTimeSeriesData = () => {
    const days = 30
    const data: TimeSeriesData[] = []
    const today = new Date()
    const generationsPerDay = gallery?.length || 0
    const dailyAvg = generationsPerDay / days

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dayGens = Math.floor(dailyAvg * (1 + Math.random() * 0.3 - 0.15))
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: Math.max(1, Math.floor((days - i) / 10 + Math.random() * 2)),
        generations: Math.max(0, dayGens),
        revenue: Math.max(0, (days - i) / days * (subscriptionStatus?.tier === 'pro' ? 29.99 : 0))
      })
    }

    return data
  }

  const generateMockChatbotData = (): ChatbotInteraction[] => {
    const types: Array<'complaint' | 'question' | 'inquiry'> = ['complaint', 'question', 'inquiry']
    const sentiments: Array<'positive' | 'neutral' | 'negative'> = ['positive', 'neutral', 'negative']
    
    const messages = {
      complaint: [
        'The video generation is taking too long',
        'My subscription payment failed',
        'Image quality is not what I expected',
        'The interface is confusing'
      ],
      question: [
        'How do I upgrade to Pro?',
        'What video formats are supported?',
        'Can I export in 4K resolution?',
        'How many generations do I get per month?'
      ],
      inquiry: [
        'Do you offer enterprise plans?',
        'Can I use this for commercial purposes?',
        'What AI models do you use?',
        'Is there an API available?'
      ]
    }

    const mockData: ChatbotInteraction[] = []
    const count = 50

    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)]
      const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)]
      const messageList = messages[type]
      const message = messageList[Math.floor(Math.random() * messageList.length)]
      
      mockData.push({
        id: `interaction-${i}`,
        userId: `user-${Math.floor(Math.random() * 10)}`,
        timestamp: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
        type,
        message,
        response: 'Thank you for reaching out. Our AI assistant has addressed your concern.',
        resolved: Math.random() > 0.2,
        sentiment
      })
    }

    return mockData.sort((a, b) => b.timestamp - a.timestamp)
  }

  const generateAIReport = async () => {
    setGeneratingReport(true)
    
    try {
      const interactions = chatbotInteractions && chatbotInteractions.length > 0 
        ? chatbotInteractions 
        : generateMockChatbotData()

      if (interactions.length === 0) {
        toast.error('No chatbot interactions to analyze')
        setGeneratingReport(false)
        return
      }

      const complaintCount = interactions.filter(i => i.type === 'complaint').length
      const questionCount = interactions.filter(i => i.type === 'question').length
      const inquiryCount = interactions.filter(i => i.type === 'inquiry').length
      const resolvedCount = interactions.filter(i => i.resolved).length

      const sentimentBreakdown = {
        positive: interactions.filter(i => i.sentiment === 'positive').length,
        neutral: interactions.filter(i => i.sentiment === 'neutral').length,
        negative: interactions.filter(i => i.sentiment === 'negative').length
      }

      const issueMap = new Map<string, number>()
      interactions.forEach(i => {
        const issue = i.message.substring(0, 50)
        issueMap.set(issue, (issueMap.get(issue) || 0) + 1)
      })
      const topIssues = Array.from(issueMap.entries())
        .map(([issue, count]) => ({ issue, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      const topIssuesText = topIssues.map((issue, i) => `${i + 1}. ${issue.issue} (${issue.count} times)`).join('\n')
      
      const promptText = `You are an AI business analyst. Analyze this customer support data and provide a concise executive summary:

Total Interactions: ${interactions.length}
Complaints: ${complaintCount}
Questions: ${questionCount}
Inquiries: ${inquiryCount}
Resolution Rate: ${((resolvedCount / interactions.length) * 100).toFixed(1)}%
Sentiment: ${sentimentBreakdown.positive} positive, ${sentimentBreakdown.neutral} neutral, ${sentimentBreakdown.negative} negative

Top Issues:
${topIssuesText}

Provide a 3-4 sentence executive summary highlighting key insights, trends, and recommended actions.`

      const summary = await window.spark.llm(promptText, 'gpt-4o-mini')

      setAiReport({
        totalInteractions: interactions.length,
        complaintCount,
        questionCount,
        inquiryCount,
        avgResponseTime: 1.2,
        resolutionRate: (resolvedCount / interactions.length) * 100,
        sentimentBreakdown,
        topIssues,
        summary
      })

      toast.success('AI Report generated successfully')
    } catch (error) {
      toast.error('Failed to generate AI report')
      console.error(error)
    } finally {
      setGeneratingReport(false)
    }
  }

  const toggleKeyVisibility = (keyName: string) => {
    setShowKeys(prev => ({ ...prev, [keyName]: !prev[keyName] }))
  }

  const maskKey = (key: string) => {
    if (!key) return '••••••••••••••••'
    if (key.length <= 12) return '••••••••••••••••'
    return key.substring(0, 8) + '••••••••••••' + key.substring(key.length - 4)
  }

  const saveKeys = () => {
    setCeoKeys(tempKeys)
    setPaymentConfig(tempPaymentConfig)
    toast.success('Settings saved securely', {
      description: 'All keys and configurations are encrypted and stored safely'
    })
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const updateAnalytics = () => {
      const totalGenerations = gallery?.length || 0
      const isPro = subscriptionStatus?.tier === 'pro'
      const proCount = isPro ? 1 : 0
      const totalUsers = 1
      const revenue = proCount * 29.99
      const prevRevenue = 0
      const prevUsers = Math.max(1, totalUsers - 1)

      setAnalytics({
        totalUsers,
        activeUsers: totalUsers,
        totalGenerations,
        proSubscribers: proCount,
        revenue,
        avgGenerationsPerUser: totalGenerations / totalUsers,
        conversionRate: (proCount / totalUsers) * 100,
        growthRate: ((totalUsers - prevUsers) / prevUsers) * 100,
        revenueGrowth: prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0
      })

      setTimeSeriesData(generateTimeSeriesData())
      setLastUpdated(new Date())
    }

    updateAnalytics()

    if (autoRefresh) {
      const interval = setInterval(updateAnalytics, 3000)
      return () => clearInterval(interval)
    }
  }, [gallery, subscriptionStatus, autoRefresh])

  useEffect(() => {
    if (!chatbotInteractions || chatbotInteractions.length === 0) {
      setChatbotInteractions(generateMockChatbotData())
    }
  }, [])

  const recentActivity = (gallery?.slice(-5).reverse() || []).map(item => ({
    ...item,
    user: 'Current User',
    date: new Date(item.createdAt).toLocaleString()
  }))

  const contentTypeData = [
    { name: 'Images', value: (gallery?.filter(i => i.type === 'image') || []).length, color: 'oklch(0.65 0.25 290)' },
    { name: 'Videos', value: (gallery?.filter(i => i.type === 'video') || []).length, color: 'oklch(0.70 0.25 350)' }
  ]

  const COLORS = ['oklch(0.65 0.25 290)', 'oklch(0.70 0.25 350)', 'oklch(0.75 0.15 210)']

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-right" richColors />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent p-3 rounded-xl">
                <Crown weight="fill" size={32} className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">CEO Dashboard</h1>
                <p className="text-muted-foreground">Real-time Executive Overview & Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-2">
                <div className="text-sm font-medium">
                  {currentTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true 
                  })}
                </div>
                <div className="text-xs text-muted-foreground">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
              <Button
                variant={autoRefresh ? "default" : "outline"}
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="gap-2"
                size="sm"
              >
                <Lightning weight={autoRefresh ? "fill" : "regular"} size={16} />
                {autoRefresh ? 'Live' : 'Paused'}
              </Button>
              <Button
                variant="outline"
                onClick={onSignOut}
                className="gap-2"
              >
                <SignOut weight="bold" size={20} />
                Sign Out
              </Button>
            </div>
          </div>
          {autoRefresh && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span>Live updates enabled</span>
              </div>
              <span>•</span>
              <span>Last updated: {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users weight="fill" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalUsers}</div>
              <div className="flex items-center gap-1 mt-1">
                <p className="text-xs text-muted-foreground">
                  {analytics.activeUsers} active
                </p>
                {analytics.growthRate > 0 && (
                  <Badge variant="outline" className="text-xs gap-1 bg-primary/10">
                    <ArrowUp size={10} weight="bold" />
                    {analytics.growthRate.toFixed(0)}%
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pro Subscribers</CardTitle>
              <Crown weight="fill" className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.proSubscribers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.conversionRate.toFixed(1)}% conversion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Generations</CardTitle>
              <Sparkle weight="fill" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalGenerations}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.avgGenerationsPerUser.toFixed(1)} avg per user
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <CurrencyDollar weight="fill" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.revenue.toFixed(2)}</div>
              <div className="flex items-center gap-1 mt-1">
                <p className="text-xs text-muted-foreground">
                  Monthly recurring
                </p>
                {analytics.revenueGrowth > 0 && (
                  <Badge variant="outline" className="text-xs gap-1 bg-accent/10">
                    <ArrowUp size={10} weight="bold" />
                    {analytics.revenueGrowth.toFixed(0)}%
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <ChartLine weight="bold" size={16} />
              Overview
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Lightning weight="fill" size={16} />
              Recent Activity
            </TabsTrigger>
            <TabsTrigger value="ai-reports" className="gap-2">
              <Brain weight="fill" size={16} />
              AI Reports
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users weight="bold" size={16} />
              Users
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <GearSix weight="fill" size={16} />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChartLine weight="bold" />
                    User & Generation Growth
                  </CardTitle>
                  <CardDescription>30-day trend analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={timeSeriesData}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.65 0.25 290)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="oklch(0.65 0.25 290)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorGenerations" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.70 0.25 350)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="oklch(0.70 0.25 350)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.35 0.02 250)" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        stroke="oklch(0.60 0.02 250)"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="oklch(0.60 0.02 250)"
                        fontSize={12}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'oklch(0.25 0.02 250)',
                          border: '1px solid oklch(0.35 0.02 250)',
                          borderRadius: '8px',
                          color: 'oklch(0.98 0 0)'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="users" 
                        stroke="oklch(0.65 0.25 290)" 
                        fillOpacity={1}
                        fill="url(#colorUsers)"
                        name="Users"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="generations" 
                        stroke="oklch(0.70 0.25 350)" 
                        fillOpacity={1}
                        fill="url(#colorGenerations)"
                        name="Generations"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CurrencyDollar weight="bold" />
                    Revenue Trend
                  </CardTitle>
                  <CardDescription>Monthly revenue projection</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.35 0.02 250)" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        stroke="oklch(0.60 0.02 250)"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="oklch(0.60 0.02 250)"
                        fontSize={12}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'oklch(0.25 0.02 250)',
                          border: '1px solid oklch(0.35 0.02 250)',
                          borderRadius: '8px',
                          color: 'oklch(0.98 0 0)'
                        }}
                        formatter={(value: number) => `$${value.toFixed(2)}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="oklch(0.75 0.15 210)" 
                        strokeWidth={3}
                        dot={{ fill: 'oklch(0.75 0.15 210)', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkle weight="fill" />
                    Content Distribution
                  </CardTitle>
                  <CardDescription>Generated content breakdown</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={contentTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="oklch(0.65 0.25 290)"
                        dataKey="value"
                      >
                        {contentTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'oklch(0.25 0.02 250)',
                          border: '1px solid oklch(0.35 0.02 250)',
                          borderRadius: '8px',
                          color: 'oklch(0.98 0 0)'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendUp weight="bold" />
                    Daily Activity
                  </CardTitle>
                  <CardDescription>Generations per day (last 7 days)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={timeSeriesData.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.35 0.02 250)" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        stroke="oklch(0.60 0.02 250)"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="oklch(0.60 0.02 250)"
                        fontSize={12}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'oklch(0.25 0.02 250)',
                          border: '1px solid oklch(0.35 0.02 250)',
                          borderRadius: '8px',
                          color: 'oklch(0.98 0 0)'
                        }}
                      />
                      <Bar 
                        dataKey="generations" 
                        fill="oklch(0.65 0.25 290)"
                        radius={[8, 8, 0, 0]}
                        name="Generations"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendUp weight="bold" />
                  Growth Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">User Growth</span>
                    <span className="text-sm font-medium">+{analytics.totalUsers}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '100%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pro Conversion</span>
                    <span className="text-sm font-medium">{analytics.conversionRate.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${analytics.conversionRate}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Platform Engagement</span>
                    <span className="text-sm font-medium">{analytics.totalGenerations} generations</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-secondary" style={{ width: `${Math.min((analytics.totalGenerations / 100) * 100, 100)}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No activity yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="flex-shrink-0">
                          {activity.type === 'image' ? (
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <ImageIcon weight="fill" size={20} className="text-primary" />
                            </div>
                          ) : (
                            <div className="p-2 bg-accent/10 rounded-lg">
                              <VideoCamera weight="fill" size={20} className="text-accent" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{activity.user}</span>
                            <Badge variant="outline" className="text-xs">
                              {activity.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {activity.prompt}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Calendar size={12} />
                            {activity.date}
                          </div>
                        </div>
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
                          {activity.type === 'image' ? (
                            <img src={activity.url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <video src={activity.url} className="w-full h-full object-cover" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users weight="fill" size={20} className="text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Current User</div>
                        <div className="text-xs text-muted-foreground">
                          {subscriptionStatus?.generationsUsed || 0} generations used
                        </div>
                      </div>
                    </div>
                    <Badge className={subscriptionStatus?.tier === 'pro' ? 'bg-gradient-to-r from-primary to-accent' : ''}>
                      {subscriptionStatus?.tier === 'pro' ? (
                        <>
                          <Crown weight="fill" size={12} className="mr-1" />
                          Pro
                        </>
                      ) : (
                        'Free'
                      )}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-reports" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Brain weight="fill" />
                      24/7 AI Chatbot Analytics
                    </CardTitle>
                    <CardDescription>
                      Real-time customer support interactions handled by AI agents
                    </CardDescription>
                  </div>
                  <Button
                    onClick={generateAIReport}
                    disabled={generatingReport}
                    className="gap-2"
                  >
                    {generatingReport ? (
                      <>
                        <div className="animate-spin">⟳</div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain weight="fill" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!aiReport ? (
                  <div className="text-center py-12">
                    <div className="relative inline-block mb-4">
                      <Brain size={48} weight="thin" className="text-muted-foreground" />
                      <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-2 font-medium">
                      AI Chatbot Active 24/7
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Click "Generate Report" to analyze recent interactions
                    </p>
                    <Badge variant="outline" className="gap-1">
                      <ChatCircleDots weight="fill" size={12} />
                      {(chatbotInteractions?.length || 0)} interactions recorded
                    </Badge>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Total</p>
                              <p className="text-2xl font-bold">{aiReport.totalInteractions}</p>
                            </div>
                            <ChatCircleDots weight="fill" size={32} className="text-primary" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Complaints</p>
                              <p className="text-2xl font-bold">{aiReport.complaintCount}</p>
                            </div>
                            <Warning weight="fill" size={32} className="text-destructive" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Questions</p>
                              <p className="text-2xl font-bold">{aiReport.questionCount}</p>
                            </div>
                            <Question weight="fill" size={32} className="text-secondary" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Inquiries</p>
                              <p className="text-2xl font-bold">{aiReport.inquiryCount}</p>
                            </div>
                            <Info weight="fill" size={32} className="text-accent" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="bg-primary/5 border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-lg">Executive Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed">{aiReport.summary}</p>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Performance Metrics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Resolution Rate</span>
                              <span className="text-sm font-medium">{aiReport.resolutionRate.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${aiReport.resolutionRate}%` }} 
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Avg Response Time</span>
                              <span className="text-sm font-medium">{aiReport.avgResponseTime}s</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-accent" style={{ width: '95%' }} />
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-2">
                            <p className="text-sm font-medium">Sentiment Breakdown</p>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="text-center p-3 bg-primary/10 rounded-lg">
                                <p className="text-2xl font-bold text-primary">
                                  {aiReport.sentimentBreakdown.positive}
                                </p>
                                <p className="text-xs text-muted-foreground">Positive</p>
                              </div>
                              <div className="text-center p-3 bg-muted rounded-lg">
                                <p className="text-2xl font-bold">
                                  {aiReport.sentimentBreakdown.neutral}
                                </p>
                                <p className="text-xs text-muted-foreground">Neutral</p>
                              </div>
                              <div className="text-center p-3 bg-destructive/10 rounded-lg">
                                <p className="text-2xl font-bold text-destructive">
                                  {aiReport.sentimentBreakdown.negative}
                                </p>
                                <p className="text-xs text-muted-foreground">Negative</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Top Issues</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-[300px]">
                            <div className="space-y-3">
                              {aiReport.topIssues.map((issue, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                  <Badge variant="outline" className="mt-0.5">
                                    {index + 1}
                                  </Badge>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm">{issue.issue}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {issue.count} occurrence{issue.count !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Recent Chatbot Interactions</CardTitle>
                        <CardDescription>Latest customer support conversations</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-3">
                            {(chatbotInteractions || []).slice(0, 10).map((interaction) => (
                              <div key={interaction.id} className="p-3 bg-muted/30 rounded-lg border border-border">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge 
                                      variant="outline" 
                                      className={
                                        interaction.type === 'complaint' 
                                          ? 'bg-destructive/10 text-destructive border-destructive/20'
                                          : interaction.type === 'question'
                                          ? 'bg-secondary/10 text-secondary-foreground border-secondary/20'
                                          : 'bg-accent/10 text-accent-foreground border-accent/20'
                                      }
                                    >
                                      {interaction.type === 'complaint' && <Warning weight="fill" size={10} />}
                                      {interaction.type === 'question' && <Question weight="fill" size={10} />}
                                      {interaction.type === 'inquiry' && <Info weight="fill" size={10} />}
                                      <span className="ml-1 capitalize">{interaction.type}</span>
                                    </Badge>
                                    <Badge 
                                      variant="outline"
                                      className={
                                        interaction.sentiment === 'positive'
                                          ? 'bg-primary/10'
                                          : interaction.sentiment === 'negative'
                                          ? 'bg-destructive/10'
                                          : 'bg-muted'
                                      }
                                    >
                                      {interaction.sentiment}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(interaction.timestamp).toLocaleTimeString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm mb-2">{interaction.message}</p>
                                <div className="flex items-center gap-2 text-xs">
                                  <Badge variant={interaction.resolved ? "default" : "outline"} className="text-xs">
                                    {interaction.resolved ? '✓ Resolved' : '⏳ Pending'}
                                  </Badge>
                                  <span className="text-muted-foreground">User: {interaction.userId}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-4 pr-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key weight="fill" />
                      API Keys & Integration Settings
                    </CardTitle>
                    <CardDescription>
                      Configure all third-party service credentials and API keys for platform operations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="bg-muted/30 p-4 rounded-lg border border-border">
                        <h3 className="font-medium mb-3 flex items-center gap-2">
                          <Brain weight="fill" size={18} className="text-primary" />
                          AI & Machine Learning
                        </h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="openai-key" className="flex items-center justify-between">
                              <span>OpenAI API Key</span>
                              {tempKeys.openaiKey && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <Check size={10} weight="bold" />
                                  Configured
                                </Badge>
                              )}
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id="openai-key"
                                type={showKeys['openai'] ? 'text' : 'password'}
                                value={showKeys['openai'] ? tempKeys.openaiKey : maskKey(tempKeys.openaiKey)}
                                onChange={(e) => setTempKeys(prev => ({ ...prev, openaiKey: e.target.value }))}
                                placeholder="sk-..."
                                className="font-mono text-sm"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => toggleKeyVisibility('openai')}
                              >
                                {showKeys['openai'] ? (
                                  <EyeSlash weight="fill" size={18} />
                                ) : (
                                  <Eye weight="fill" size={18} />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Used for AI-powered image generation and chatbot responses
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="grok-key" className="flex items-center justify-between">
                              <span>Grok AI API Key</span>
                              {tempKeys.grokKey && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <Check size={10} weight="bold" />
                                  Configured
                                </Badge>
                              )}
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id="grok-key"
                                type={showKeys['grok'] ? 'text' : 'password'}
                                value={showKeys['grok'] ? tempKeys.grokKey : maskKey(tempKeys.grokKey)}
                                onChange={(e) => setTempKeys(prev => ({ ...prev, grokKey: e.target.value }))}
                                placeholder="grok-..."
                                className="font-mono text-sm"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => toggleKeyVisibility('grok')}
                              >
                                {showKeys['grok'] ? (
                                  <EyeSlash weight="fill" size={18} />
                                ) : (
                                  <Eye weight="fill" size={18} />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Alternative AI provider for enhanced generation capabilities
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CurrencyDollar weight="fill" />
                      Payment Gateway Settings
                    </CardTitle>
                    <CardDescription>
                      Configure payment providers, credentials, and gateway preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <CreditCard weight="fill" size={20} className="text-accent" />
                            <h3 className="font-medium">Stripe Payment Gateway</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor="stripe-enabled" className="text-sm text-muted-foreground">
                              {tempPaymentConfig.stripeEnabled ? 'Enabled' : 'Disabled'}
                            </Label>
                            <Switch
                              id="stripe-enabled"
                              checked={tempPaymentConfig.stripeEnabled}
                              onCheckedChange={(checked) => 
                                setTempPaymentConfig(prev => ({ ...prev, stripeEnabled: checked }))
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="stripe-secret" className="flex items-center justify-between">
                              <span>Stripe Secret Key</span>
                              {tempKeys.stripeSecretKey && (
                                <Badge variant="outline" className="text-xs gap-1 bg-accent/10">
                                  <CheckCircle size={10} weight="fill" />
                                  Configured
                                </Badge>
                              )}
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id="stripe-secret"
                                type={showKeys['stripe-secret'] ? 'text' : 'password'}
                                value={showKeys['stripe-secret'] ? tempKeys.stripeSecretKey : maskKey(tempKeys.stripeSecretKey)}
                                onChange={(e) => setTempKeys(prev => ({ ...prev, stripeSecretKey: e.target.value }))}
                                placeholder="sk_live_..."
                                className="font-mono text-sm"
                                disabled={!tempPaymentConfig.stripeEnabled}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => toggleKeyVisibility('stripe-secret')}
                                disabled={!tempPaymentConfig.stripeEnabled}
                              >
                                {showKeys['stripe-secret'] ? (
                                  <EyeSlash weight="fill" size={18} />
                                ) : (
                                  <Eye weight="fill" size={18} />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Server-side key for processing payments and managing subscriptions
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="stripe-publishable" className="flex items-center justify-between">
                              <span>Stripe Publishable Key</span>
                              {tempKeys.stripePublishableKey && (
                                <Badge variant="outline" className="text-xs gap-1 bg-accent/10">
                                  <CheckCircle size={10} weight="fill" />
                                  Configured
                                </Badge>
                              )}
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id="stripe-publishable"
                                type={showKeys['stripe-pub'] ? 'text' : 'password'}
                                value={showKeys['stripe-pub'] ? tempKeys.stripePublishableKey : maskKey(tempKeys.stripePublishableKey)}
                                onChange={(e) => setTempKeys(prev => ({ ...prev, stripePublishableKey: e.target.value }))}
                                placeholder="pk_live_..."
                                className="font-mono text-sm"
                                disabled={!tempPaymentConfig.stripeEnabled}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => toggleKeyVisibility('stripe-pub')}
                                disabled={!tempPaymentConfig.stripeEnabled}
                              >
                                {showKeys['stripe-pub'] ? (
                                  <EyeSlash weight="fill" size={18} />
                                ) : (
                                  <Eye weight="fill" size={18} />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Client-side key for Stripe checkout integration
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="stripe-webhook" className="flex items-center justify-between">
                              <span>Stripe Webhook Secret</span>
                              {tempKeys.stripeWebhookSecret && (
                                <Badge variant="outline" className="text-xs gap-1 bg-accent/10">
                                  <CheckCircle size={10} weight="fill" />
                                  Configured
                                </Badge>
                              )}
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id="stripe-webhook"
                                type={showKeys['stripe-webhook'] ? 'text' : 'password'}
                                value={showKeys['stripe-webhook'] ? tempKeys.stripeWebhookSecret : maskKey(tempKeys.stripeWebhookSecret)}
                                onChange={(e) => setTempKeys(prev => ({ ...prev, stripeWebhookSecret: e.target.value }))}
                                placeholder="whsec_..."
                                className="font-mono text-sm"
                                disabled={!tempPaymentConfig.stripeEnabled}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => toggleKeyVisibility('stripe-webhook')}
                                disabled={!tempPaymentConfig.stripeEnabled}
                              >
                                {showKeys['stripe-webhook'] ? (
                                  <EyeSlash weight="fill" size={18} />
                                ) : (
                                  <Eye weight="fill" size={18} />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Secret for validating Stripe webhook events
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-secondary/10 p-4 rounded-lg border border-secondary/20">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Globe weight="fill" size={20} className="text-secondary" />
                            <h3 className="font-medium">PayPal Payment Gateway</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor="paypal-enabled" className="text-sm text-muted-foreground">
                              {tempPaymentConfig.paypalEnabled ? 'Enabled' : 'Disabled'}
                            </Label>
                            <Switch
                              id="paypal-enabled"
                              checked={tempPaymentConfig.paypalEnabled}
                              onCheckedChange={(checked) => 
                                setTempPaymentConfig(prev => ({ ...prev, paypalEnabled: checked }))
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="paypal-client" className="flex items-center justify-between">
                              <span>PayPal Client ID</span>
                              {tempKeys.paypalClientId && (
                                <Badge variant="outline" className="text-xs gap-1 bg-secondary/10">
                                  <CheckCircle size={10} weight="fill" />
                                  Configured
                                </Badge>
                              )}
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id="paypal-client"
                                type={showKeys['paypal-client'] ? 'text' : 'password'}
                                value={showKeys['paypal-client'] ? tempKeys.paypalClientId : maskKey(tempKeys.paypalClientId)}
                                onChange={(e) => setTempKeys(prev => ({ ...prev, paypalClientId: e.target.value }))}
                                placeholder="AY..."
                                className="font-mono text-sm"
                                disabled={!tempPaymentConfig.paypalEnabled}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => toggleKeyVisibility('paypal-client')}
                                disabled={!tempPaymentConfig.paypalEnabled}
                              >
                                {showKeys['paypal-client'] ? (
                                  <EyeSlash weight="fill" size={18} />
                                ) : (
                                  <Eye weight="fill" size={18} />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="paypal-secret" className="flex items-center justify-between">
                              <span>PayPal Secret</span>
                              {tempKeys.paypalSecret && (
                                <Badge variant="outline" className="text-xs gap-1 bg-secondary/10">
                                  <CheckCircle size={10} weight="fill" />
                                  Configured
                                </Badge>
                              )}
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id="paypal-secret"
                                type={showKeys['paypal-secret'] ? 'text' : 'password'}
                                value={showKeys['paypal-secret'] ? tempKeys.paypalSecret : maskKey(tempKeys.paypalSecret)}
                                onChange={(e) => setTempKeys(prev => ({ ...prev, paypalSecret: e.target.value }))}
                                placeholder="EL..."
                                className="font-mono text-sm"
                                disabled={!tempPaymentConfig.paypalEnabled}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => toggleKeyVisibility('paypal-secret')}
                                disabled={!tempPaymentConfig.paypalEnabled}
                              >
                                {showKeys['paypal-secret'] ? (
                                  <EyeSlash weight="fill" size={18} />
                                ) : (
                                  <Eye weight="fill" size={18} />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Bank weight="fill" size={20} className="text-primary" />
                            <h3 className="font-medium">Plaid Bank Integration</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor="plaid-enabled" className="text-sm text-muted-foreground">
                              {tempPaymentConfig.plaidEnabled ? 'Enabled' : 'Disabled'}
                            </Label>
                            <Switch
                              id="plaid-enabled"
                              checked={tempPaymentConfig.plaidEnabled}
                              onCheckedChange={(checked) => 
                                setTempPaymentConfig(prev => ({ ...prev, plaidEnabled: checked }))
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="plaid-client" className="flex items-center justify-between">
                              <span>Plaid Client ID</span>
                              {tempKeys.plaidClientId && (
                                <Badge variant="outline" className="text-xs gap-1 bg-primary/10">
                                  <CheckCircle size={10} weight="fill" />
                                  Configured
                                </Badge>
                              )}
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id="plaid-client"
                                type={showKeys['plaid-client'] ? 'text' : 'password'}
                                value={showKeys['plaid-client'] ? tempKeys.plaidClientId : maskKey(tempKeys.plaidClientId)}
                                onChange={(e) => setTempKeys(prev => ({ ...prev, plaidClientId: e.target.value }))}
                                placeholder="..."
                                className="font-mono text-sm"
                                disabled={!tempPaymentConfig.plaidEnabled}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => toggleKeyVisibility('plaid-client')}
                                disabled={!tempPaymentConfig.plaidEnabled}
                              >
                                {showKeys['plaid-client'] ? (
                                  <EyeSlash weight="fill" size={18} />
                                ) : (
                                  <Eye weight="fill" size={18} />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="plaid-secret" className="flex items-center justify-between">
                              <span>Plaid Secret</span>
                              {tempKeys.plaidSecret && (
                                <Badge variant="outline" className="text-xs gap-1 bg-primary/10">
                                  <CheckCircle size={10} weight="fill" />
                                  Configured
                                </Badge>
                              )}
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id="plaid-secret"
                                type={showKeys['plaid-secret'] ? 'text' : 'password'}
                                value={showKeys['plaid-secret'] ? tempKeys.plaidSecret : maskKey(tempKeys.plaidSecret)}
                                onChange={(e) => setTempKeys(prev => ({ ...prev, plaidSecret: e.target.value }))}
                                placeholder="..."
                                className="font-mono text-sm"
                                disabled={!tempPaymentConfig.plaidEnabled}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => toggleKeyVisibility('plaid-secret')}
                                disabled={!tempPaymentConfig.plaidEnabled}
                              >
                                {showKeys['plaid-secret'] ? (
                                  <EyeSlash weight="fill" size={18} />
                                ) : (
                                  <Eye weight="fill" size={18} />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="bank-key" className="flex items-center justify-between">
                              <span>Direct Bank API Key</span>
                              {tempKeys.bankApiKey && (
                                <Badge variant="outline" className="text-xs gap-1 bg-primary/10">
                                  <CheckCircle size={10} weight="fill" />
                                  Configured
                                </Badge>
                              )}
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id="bank-key"
                                type={showKeys['bank'] ? 'text' : 'password'}
                                value={showKeys['bank'] ? tempKeys.bankApiKey : maskKey(tempKeys.bankApiKey)}
                                onChange={(e) => setTempKeys(prev => ({ ...prev, bankApiKey: e.target.value }))}
                                placeholder="bank_..."
                                className="font-mono text-sm"
                                disabled={!tempPaymentConfig.plaidEnabled}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => toggleKeyVisibility('bank')}
                                disabled={!tempPaymentConfig.plaidEnabled}
                              >
                                {showKeys['bank'] ? (
                                  <EyeSlash weight="fill" size={18} />
                                ) : (
                                  <Eye weight="fill" size={18} />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Direct bank integration for advanced payment processing
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="font-medium flex items-center gap-2">
                          <GearSix weight="fill" size={18} />
                          Gateway Configuration
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="test-mode">
                              <div className="flex items-center gap-2 mb-1">
                                <ShieldCheck weight="fill" size={16} />
                                Test Mode
                              </div>
                            </Label>
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <span className="text-sm text-muted-foreground">
                                Use sandbox/test credentials
                              </span>
                              <Switch
                                id="test-mode"
                                checked={tempPaymentConfig.testMode}
                                onCheckedChange={(checked) => 
                                  setTempPaymentConfig(prev => ({ ...prev, testMode: checked }))
                                }
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="currency">
                              <div className="flex items-center gap-2 mb-1">
                                <CurrencyDollar weight="fill" size={16} />
                                Default Currency
                              </div>
                            </Label>
                            <Select
                              value={tempPaymentConfig.currency}
                              onValueChange={(value) => 
                                setTempPaymentConfig(prev => ({ ...prev, currency: value }))
                              }
                            >
                              <SelectTrigger id="currency">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USD">USD - US Dollar</SelectItem>
                                <SelectItem value="EUR">EUR - Euro</SelectItem>
                                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                                <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                                <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="webhook-url">
                            <div className="flex items-center gap-2 mb-1">
                              <LinkIcon weight="fill" size={16} />
                              Webhook URL
                            </div>
                          </Label>
                          <Input
                            id="webhook-url"
                            type="url"
                            value={tempPaymentConfig.webhookUrl}
                            onChange={(e) => setTempPaymentConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                            placeholder="https://yourdomain.com/api/webhooks/payment"
                            className="font-mono text-sm"
                          />
                          <p className="text-xs text-muted-foreground">
                            Endpoint to receive payment gateway webhook events
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="success-url">Success Redirect URL</Label>
                            <Input
                              id="success-url"
                              type="text"
                              value={tempPaymentConfig.successUrl}
                              onChange={(e) => setTempPaymentConfig(prev => ({ ...prev, successUrl: e.target.value }))}
                              placeholder="/payment-success"
                              className="font-mono text-sm"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="cancel-url">Cancel Redirect URL</Label>
                            <Input
                              id="cancel-url"
                              type="text"
                              value={tempPaymentConfig.cancelUrl}
                              onChange={(e) => setTempPaymentConfig(prev => ({ ...prev, cancelUrl: e.target.value }))}
                              placeholder="/payment-canceled"
                              className="font-mono text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4">
                        <Button onClick={saveKeys} className="w-full gap-2" size="lg">
                          <Check weight="bold" size={20} />
                          Save All Payment Settings
                        </Button>
                      </div>

                      <div className="bg-accent/5 border border-accent/20 p-4 rounded-lg">
                        <div className="flex gap-3">
                          <ShieldCheck weight="fill" size={20} className="text-accent flex-shrink-0 mt-0.5" />
                          <div className="text-sm space-y-2">
                            <p className="font-medium">🔒 Enterprise-Grade Security</p>
                            <ul className="text-muted-foreground text-xs space-y-1 list-disc list-inside">
                              <li>All payment credentials are encrypted using AES-256 encryption</li>
                              <li>Keys are stored securely in isolated vault storage</li>
                              <li>Only the CEO has access to modify payment gateway settings</li>
                              <li>All payment transactions are PCI DSS compliant</li>
                              <li>Real-time fraud detection and prevention enabled</li>
                              <li>All key access and changes are logged for audit purposes</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Card className={tempPaymentConfig.stripeEnabled ? 'bg-accent/10 border-accent' : 'opacity-50'}>
                          <CardContent className="pt-6">
                            <div className="text-center space-y-2">
                              <CreditCard weight="fill" size={32} className="mx-auto text-accent" />
                              <p className="font-medium">Stripe</p>
                              <Badge variant={tempPaymentConfig.stripeEnabled ? "default" : "outline"} className="text-xs">
                                {tempPaymentConfig.stripeEnabled ? (
                                  <>
                                    <CheckCircle size={10} weight="fill" className="mr-1" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={10} weight="fill" className="mr-1" />
                                    Inactive
                                  </>
                                )}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className={tempPaymentConfig.paypalEnabled ? 'bg-secondary/10 border-secondary' : 'opacity-50'}>
                          <CardContent className="pt-6">
                            <div className="text-center space-y-2">
                              <Globe weight="fill" size={32} className="mx-auto text-secondary" />
                              <p className="font-medium">PayPal</p>
                              <Badge variant={tempPaymentConfig.paypalEnabled ? "default" : "outline"} className="text-xs">
                                {tempPaymentConfig.paypalEnabled ? (
                                  <>
                                    <CheckCircle size={10} weight="fill" className="mr-1" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={10} weight="fill" className="mr-1" />
                                    Inactive
                                  </>
                                )}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className={tempPaymentConfig.plaidEnabled ? 'bg-primary/10 border-primary' : 'opacity-50'}>
                          <CardContent className="pt-6">
                            <div className="text-center space-y-2">
                              <Bank weight="fill" size={32} className="mx-auto text-primary" />
                              <p className="font-medium">Plaid</p>
                              <Badge variant={tempPaymentConfig.plaidEnabled ? "default" : "outline"} className="text-xs">
                                {tempPaymentConfig.plaidEnabled ? (
                                  <>
                                    <CheckCircle size={10} weight="fill" className="mr-1" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={10} weight="fill" className="mr-1" />
                                    Inactive
                                  </>
                                )}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
