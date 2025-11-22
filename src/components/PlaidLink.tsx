import { useCallback, useState } from 'react'
import { usePlaidLink, PlaidLinkOnSuccess, PlaidLinkOptions } from 'react-plaid-link'
import { Button } from '@/components/ui/button'
import { Bank, Plus } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface PlaidLinkButtonProps {
  linkToken: string | null
  onSuccess: (publicToken: string, metadata: any) => void
  onExit?: (error: any, metadata: any) => void
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

export function PlaidLinkButton({ 
  linkToken, 
  onSuccess, 
  onExit,
  disabled = false,
  className,
  children 
}: PlaidLinkButtonProps) {
  const [isReady, setIsReady] = useState(false)

  const handleOnSuccess = useCallback<PlaidLinkOnSuccess>(
    (publicToken, metadata) => {
      onSuccess(publicToken, metadata)
    },
    [onSuccess]
  )

  const handleOnExit = useCallback(
    (error: any, metadata: any) => {
      if (error) {
        console.error('Plaid Link error:', error)
        toast.error('Bank connection failed')
      }
      onExit?.(error, metadata)
    },
    [onExit]
  )

  const config: PlaidLinkOptions = {
    token: linkToken,
    onSuccess: handleOnSuccess,
    onExit: handleOnExit,
    onLoad: () => setIsReady(true)
  }

  const { open, ready } = usePlaidLink(config)

  const handleClick = () => {
    if (ready && isReady) {
      open()
    } else {
      toast.error('Plaid Link is not ready yet')
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || !ready || !linkToken}
      className={className}
    >
      {children || (
        <>
          <Plus weight="bold" />
          Connect Bank
        </>
      )}
    </Button>
  )
}

interface PlaidLinkInlineProps {
  linkToken: string | null
  onSuccess: (publicToken: string, metadata: any) => void
  onExit?: (error: any, metadata: any) => void
}

export function PlaidLinkInline({ linkToken, onSuccess, onExit }: PlaidLinkInlineProps) {
  const handleOnSuccess = useCallback<PlaidLinkOnSuccess>(
    (publicToken, metadata) => {
      onSuccess(publicToken, metadata)
    },
    [onSuccess]
  )

  const handleOnExit = useCallback(
    (error: any, metadata: any) => {
      if (error) {
        console.error('Plaid Link error:', error)
      }
      onExit?.(error, metadata)
    },
    [onExit]
  )

  return (
    <div className="w-full min-h-[600px] border border-border rounded-lg overflow-hidden bg-card">
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <Bank size={64} weight="thin" className="text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {linkToken ? 'Initializing Plaid Link...' : 'Preparing secure bank connection...'}
          </p>
        </div>
      </div>
    </div>
  )
}
