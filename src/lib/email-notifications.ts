export interface EmailNotificationConfig {
  enabled: boolean
  recipientEmail: string
  budgetAlerts: boolean
  spendingAlerts: boolean
  subscriptionAlerts: boolean
  weeklyReports: boolean
}

export interface EmailNotification {
  id: string
  type: 'budget_alert' | 'spending_limit' | 'subscription' | 'weekly_report'
  subject: string
  body: string
  recipient: string
  sentAt: number
  status: 'sent' | 'pending' | 'failed'
}

export function initializeEmailConfig(): EmailNotificationConfig {
  return {
    enabled: false,
    recipientEmail: '',
    budgetAlerts: true,
    spendingAlerts: true,
    subscriptionAlerts: true,
    weeklyReports: false
  }
}

export async function sendBudgetAlert(
  email: string,
  percentage: number,
  currentSpend: number,
  limit: number,
  period: string
): Promise<EmailNotification> {
  const notification: EmailNotification = {
    id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'budget_alert',
    subject: `Budget Alert: ${percentage}% of ${period} limit reached`,
    body: `You have spent $${currentSpend.toFixed(2)} of your $${limit.toFixed(2)} ${period} budget (${percentage}%).\n\nThis is an automated alert to help you track your spending.`,
    recipient: email,
    sentAt: Date.now(),
    status: 'sent'
  }

  console.log(`[Email Simulation] Sending to ${email}:`)
  console.log(`Subject: ${notification.subject}`)
  console.log(`Body: ${notification.body}`)
  
  return notification
}

export async function sendSpendingLimitAlert(
  email: string,
  alertName: string,
  currentSpend: number,
  threshold: number
): Promise<EmailNotification> {
  const notification: EmailNotification = {
    id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'spending_limit',
    subject: `Spending Alert: ${alertName}`,
    body: `Your spending has reached $${currentSpend.toFixed(2)}, triggering the alert "${alertName}" (threshold: $${threshold.toFixed(2)}).\n\nThis is an automated alert to help you monitor your expenses.`,
    recipient: email,
    sentAt: Date.now(),
    status: 'sent'
  }

  console.log(`[Email Simulation] Sending to ${email}:`)
  console.log(`Subject: ${notification.subject}`)
  console.log(`Body: ${notification.body}`)
  
  return notification
}

export async function sendWeeklyReport(
  email: string,
  weeklySpend: number,
  transactionCount: number,
  topCategories: Array<{ category: string; amount: number }>
): Promise<EmailNotification> {
  const categoriesText = topCategories
    .map(cat => `- ${cat.category}: $${cat.amount.toFixed(2)}`)
    .join('\n')

  const notification: EmailNotification = {
    id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'weekly_report',
    subject: 'Weekly Spending Report',
    body: `Your weekly spending summary:\n\nTotal Spent: $${weeklySpend.toFixed(2)}\nTransactions: ${transactionCount}\n\nTop Categories:\n${categoriesText}`,
    recipient: email,
    sentAt: Date.now(),
    status: 'sent'
  }

  console.log(`[Email Simulation] Sending to ${email}:`)
  console.log(`Subject: ${notification.subject}`)
  console.log(`Body: ${notification.body}`)
  
  return notification
}

export async function sendSubscriptionAlert(
  email: string,
  message: string,
  subscriptionStatus: string
): Promise<EmailNotification> {
  const notification: EmailNotification = {
    id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'subscription',
    subject: `Subscription ${subscriptionStatus}`,
    body: message,
    recipient: email,
    sentAt: Date.now(),
    status: 'sent'
  }

  console.log(`[Email Simulation] Sending to ${email}:`)
  console.log(`Subject: ${notification.subject}`)
  console.log(`Body: ${notification.body}`)
  
  return notification
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function formatEmailPreview(notification: EmailNotification): string {
  return `
To: ${notification.recipient}
Subject: ${notification.subject}
Sent: ${new Date(notification.sentAt).toLocaleString()}
Status: ${notification.status}

${notification.body}
  `.trim()
}
