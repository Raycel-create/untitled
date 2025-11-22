import { APIKeys } from './api-keys'

export interface GenerationProgress {
  progress: number
  stage: string
  previewUrl?: string
}

export type ProgressCallback = (update: GenerationProgress) => void

export async function generateImage(
  prompt: string,
  apiKeys: APIKeys,
  provider: keyof APIKeys,
  onProgress: ProgressCallback
): Promise<string> {
  onProgress({ progress: 10, stage: 'Initializing generation...' })

  switch (provider) {
    case 'openai':
      return await generateWithOpenAI(prompt, apiKeys.openai!, onProgress)
    case 'stabilityai':
      return await generateWithStabilityAI(prompt, apiKeys.stabilityai!, onProgress)
    case 'replicate':
      return await generateImageWithReplicate(prompt, apiKeys.replicate!, onProgress)
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}

export async function generateVideo(
  prompt: string,
  apiKeys: APIKeys,
  provider: keyof APIKeys,
  onProgress: ProgressCallback
): Promise<string> {
  onProgress({ progress: 10, stage: 'Initializing video generation...' })

  switch (provider) {
    case 'runwayml':
      return await generateWithRunwayML(prompt, apiKeys.runwayml!, onProgress)
    case 'replicate':
      return await generateVideoWithReplicate(prompt, apiKeys.replicate!, onProgress)
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}

async function generateWithOpenAI(
  prompt: string,
  apiKey: string,
  onProgress: ProgressCallback
): Promise<string> {
  onProgress({ progress: 20, stage: 'Connecting to OpenAI...' })

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url'
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`)
  }

  onProgress({ progress: 80, stage: 'Processing image...' })

  const data = await response.json()
  
  if (!data.data || !data.data[0] || !data.data[0].url) {
    throw new Error('No image URL returned from OpenAI')
  }

  onProgress({ progress: 95, stage: 'Finalizing...' })
  
  return data.data[0].url
}

async function generateWithStabilityAI(
  prompt: string,
  apiKey: string,
  onProgress: ProgressCallback
): Promise<string> {
  onProgress({ progress: 20, stage: 'Connecting to Stability AI...' })

  const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      text_prompts: [
        {
          text: prompt,
          weight: 1
        }
      ],
      cfg_scale: 7,
      height: 1024,
      width: 1024,
      samples: 1,
      steps: 30
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message || `Stability AI API error: ${response.status}`)
  }

  onProgress({ progress: 80, stage: 'Processing image...' })

  const data = await response.json()
  
  if (!data.artifacts || !data.artifacts[0] || !data.artifacts[0].base64) {
    throw new Error('No image data returned from Stability AI')
  }

  onProgress({ progress: 95, stage: 'Finalizing...' })
  
  return `data:image/png;base64,${data.artifacts[0].base64}`
}

async function generateImageWithReplicate(
  prompt: string,
  apiKey: string,
  onProgress: ProgressCallback
): Promise<string> {
  onProgress({ progress: 20, stage: 'Connecting to Replicate...' })

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${apiKey}`
    },
    body: JSON.stringify({
      version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4',
      input: {
        prompt: prompt,
        width: 1024,
        height: 1024,
        num_outputs: 1
      }
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `Replicate API error: ${response.status}`)
  }

  const prediction = await response.json()
  
  onProgress({ progress: 40, stage: 'Generating image...' })
  
  const imageUrl = await pollReplicatePrediction(prediction.id, apiKey, onProgress)
  
  onProgress({ progress: 95, stage: 'Finalizing...' })
  
  return imageUrl
}

async function generateVideoWithReplicate(
  prompt: string,
  apiKey: string,
  onProgress: ProgressCallback
): Promise<string> {
  onProgress({ progress: 20, stage: 'Connecting to Replicate...' })

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${apiKey}`
    },
    body: JSON.stringify({
      version: 'anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351',
      input: {
        prompt: prompt,
        num_frames: 24,
        num_inference_steps: 50
      }
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `Replicate API error: ${response.status}`)
  }

  const prediction = await response.json()
  
  onProgress({ progress: 40, stage: 'Generating video frames...' })
  
  const videoUrl = await pollReplicatePrediction(prediction.id, apiKey, onProgress, true)
  
  onProgress({ progress: 95, stage: 'Finalizing...' })
  
  return videoUrl
}

async function generateWithRunwayML(
  prompt: string,
  apiKey: string,
  onProgress: ProgressCallback
): Promise<string> {
  onProgress({ progress: 20, stage: 'Connecting to RunwayML...' })

  const response = await fetch('https://api.runwayml.com/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gen2',
      prompt: prompt,
      duration: 4,
      resolution: '1280x768'
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `RunwayML API error: ${response.status}`)
  }

  const data = await response.json()
  const taskId = data.id

  onProgress({ progress: 40, stage: 'Generating video...' })
  
  const videoUrl = await pollRunwayMLTask(taskId, apiKey, onProgress)
  
  onProgress({ progress: 95, stage: 'Finalizing...' })
  
  return videoUrl
}

async function pollReplicatePrediction(
  predictionId: string,
  apiKey: string,
  onProgress: ProgressCallback,
  isVideo: boolean = false
): Promise<string> {
  const maxAttempts = 120
  let attempts = 0
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Token ${apiKey}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to check prediction status: ${response.status}`)
    }

    const prediction = await response.json()
    
    const progress = 40 + (attempts / maxAttempts) * 50
    onProgress({ 
      progress, 
      stage: isVideo ? 'Rendering video frames...' : 'Creating image...'
    })

    if (prediction.status === 'succeeded') {
      if (Array.isArray(prediction.output) && prediction.output.length > 0) {
        return prediction.output[0]
      } else if (typeof prediction.output === 'string') {
        return prediction.output
      }
      throw new Error('No output URL in prediction')
    }

    if (prediction.status === 'failed') {
      throw new Error(prediction.error || 'Prediction failed')
    }

    attempts++
  }

  throw new Error('Generation timed out')
}

async function pollRunwayMLTask(
  taskId: string,
  apiKey: string,
  onProgress: ProgressCallback
): Promise<string> {
  const maxAttempts = 120
  let attempts = 0
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const response = await fetch(`https://api.runwayml.com/v1/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to check task status: ${response.status}`)
    }

    const task = await response.json()
    
    const progress = 40 + (attempts / maxAttempts) * 50
    onProgress({ 
      progress, 
      stage: 'Processing video...'
    })

    if (task.status === 'SUCCEEDED') {
      if (task.output && task.output.url) {
        return task.output.url
      }
      throw new Error('No video URL in task output')
    }

    if (task.status === 'FAILED') {
      throw new Error(task.error || 'Video generation failed')
    }

    attempts++
  }

  throw new Error('Video generation timed out')
}
