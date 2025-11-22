export interface APIKeys {
  openai?: string
  stabilityai?: string
  replicate?: string
  runwayml?: string
}

export interface APIKeyStatus {
  provider: keyof APIKeys
  isConfigured: boolean
  lastValidated?: number
}

export const API_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    description: 'DALL-E 3 for high-quality image generation',
    features: ['Image Generation', 'Advanced Prompts'],
    required: false,
  },
  stabilityai: {
    name: 'Stability AI',
    description: 'Stable Diffusion for versatile image creation',
    features: ['Image Generation', 'Style Transfer'],
    required: false,
  },
  replicate: {
    name: 'Replicate',
    description: 'Access to various AI models including image and video',
    features: ['Image Generation', 'Video Generation', 'Background Removal'],
    required: false,
  },
  runwayml: {
    name: 'RunwayML',
    description: 'Gen-2 for professional video generation',
    features: ['Video Generation', 'Advanced Effects'],
    required: false,
  },
} as const

export function getConfiguredProviders(keys: APIKeys): APIKeyStatus[] {
  return Object.keys(API_PROVIDERS).map(provider => ({
    provider: provider as keyof APIKeys,
    isConfigured: !!keys[provider as keyof APIKeys],
    lastValidated: undefined,
  }))
}

export function hasAnyProvider(keys: APIKeys): boolean {
  return Object.values(keys).some(key => !!key)
}

export function getProviderForFeature(keys: APIKeys, feature: 'image' | 'video'): keyof APIKeys | null {
  if (feature === 'image') {
    if (keys.openai) return 'openai'
    if (keys.stabilityai) return 'stabilityai'
    if (keys.replicate) return 'replicate'
  } else {
    if (keys.runwayml) return 'runwayml'
    if (keys.replicate) return 'replicate'
  }
  return null
}

export function maskAPIKey(key: string): string {
  if (!key || key.length < 8) return '••••••••'
  return `${key.slice(0, 4)}${'•'.repeat(Math.min(20, key.length - 8))}${key.slice(-4)}`
}

export function validateAPIKeyFormat(provider: keyof APIKeys, key: string): { valid: boolean; error?: string } {
  if (!key || key.trim().length === 0) {
    return { valid: false, error: 'API key cannot be empty' }
  }

  switch (provider) {
    case 'openai':
      if (!key.startsWith('sk-')) {
        return { valid: false, error: 'OpenAI keys should start with "sk-"' }
      }
      if (key.length < 20) {
        return { valid: false, error: 'OpenAI key appears too short' }
      }
      break
    case 'stabilityai':
      if (key.length < 20) {
        return { valid: false, error: 'Stability AI key appears too short' }
      }
      break
    case 'replicate':
      if (key.length < 30) {
        return { valid: false, error: 'Replicate token appears too short' }
      }
      break
    case 'runwayml':
      if (key.length < 20) {
        return { valid: false, error: 'RunwayML key appears too short' }
      }
      break
  }

  return { valid: true }
}
