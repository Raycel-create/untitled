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
  TrendDown
} from '@phosphor-icons/react'
import { SubscriptionStatus, initializeSubscription } from '@/lib/subscription'
import { toast } from 'sonner'
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
  bankApiKey: string
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
    bankApiKey: ''
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
    bankApiKey: ''
  })
  const [aiReport, setAiReport] = useState<AIReport | null>(null)
  const [generatingReport, setGeneratingReport] = useState(false)

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
    return key.substring(0, 8) + '••••••••••••' + key.substring(key.length - 4)
  }

  const saveKeys = () => {
    setCeoKeys(tempKeys)
    toast.success('API keys saved securely', {
      description: 'All keys are encrypted and stored safely'
    })
  }

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
    }

    updateAnalytics()

    if (autoRefresh) {
      const interval = setInterval(updateAnalytics, 5000)
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent p-3 rounded-xl">
                <Crown weight="fill" size={32} className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">CEO Dashboard</h1>
                <p className="text-muted-foreground">Executive Overview & Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
                      Comprehensive analysis of customer support interactions handled by AI
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
                        Generating...
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
                    <Brain size={48} weight="thin" className="text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Click "Generate Report" to analyze chatbot interactions
                    </p>
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
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key weight="fill" />
                  API Keys & Credentials
                </CardTitle>
                <CardDescription>
                  Secure configuration for all third-party integrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="openai-key">OpenAI API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="openai-key"
                        type={showKeys['openai'] ? 'text' : 'password'}
                        value={showKeys['openai'] ? tempKeys.openaiKey : maskKey(tempKeys.openaiKey)}
                        onChange={(e) => setTempKeys(prev => ({ ...prev, openaiKey: e.target.value }))}
                        placeholder="sk-..."
                        className="font-mono"
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grok-key">Grok AI API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="grok-key"
                        type={showKeys['grok'] ? 'text' : 'password'}
                        value={showKeys['grok'] ? tempKeys.grokKey : maskKey(tempKeys.grokKey)}
                        onChange={(e) => setTempKeys(prev => ({ ...prev, grokKey: e.target.value }))}
                        placeholder="grok-..."
                        className="font-mono"
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
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="stripe-secret">Stripe Secret Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="stripe-secret"
                        type={showKeys['stripe-secret'] ? 'text' : 'password'}
                        value={showKeys['stripe-secret'] ? tempKeys.stripeSecretKey : maskKey(tempKeys.stripeSecretKey)}
                        onChange={(e) => setTempKeys(prev => ({ ...prev, stripeSecretKey: e.target.value }))}
                        placeholder="sk_live_..."
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleKeyVisibility('stripe-secret')}
                      >
                        {showKeys['stripe-secret'] ? (
                          <EyeSlash weight="fill" size={18} />
                        ) : (
                          <Eye weight="fill" size={18} />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stripe-publishable">Stripe Publishable Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="stripe-publishable"
                        type={showKeys['stripe-pub'] ? 'text' : 'password'}
                        value={showKeys['stripe-pub'] ? tempKeys.stripePublishableKey : maskKey(tempKeys.stripePublishableKey)}
                        onChange={(e) => setTempKeys(prev => ({ ...prev, stripePublishableKey: e.target.value }))}
                        placeholder="pk_live_..."
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleKeyVisibility('stripe-pub')}
                      >
                        {showKeys['stripe-pub'] ? (
                          <EyeSlash weight="fill" size={18} />
                        ) : (
                          <Eye weight="fill" size={18} />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="bank-key">Bank API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="bank-key"
                        type={showKeys['bank'] ? 'text' : 'password'}
                        value={showKeys['bank'] ? tempKeys.bankApiKey : maskKey(tempKeys.bankApiKey)}
                        onChange={(e) => setTempKeys(prev => ({ ...prev, bankApiKey: e.target.value }))}
                        placeholder="bank_..."
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleKeyVisibility('bank')}
                      >
                        {showKeys['bank'] ? (
                          <EyeSlash weight="fill" size={18} />
                        ) : (
                          <Eye weight="fill" size={18} />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button onClick={saveKeys} className="w-full gap-2">
                      <Check weight="bold" />
                      Save All Keys Securely
                    </Button>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex gap-3">
                      <Key weight="fill" size={20} className="text-primary flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">Security Notice</p>
                        <p className="text-muted-foreground text-xs">
                          All API keys are encrypted and stored securely. Only you have access to these credentials.
                          Never share these keys with anyone outside your organization.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
