import { APIKeys } from './api-keys'

export interface GenerationProgress {
  progress: number
  stage: string
  previewUrl?: string
}

export type ProgressCallback = (update: GenerationProgress) => void

export interface GenerationOptions {
  referenceImage?: string
  referenceVideo?: string
  strength?: number
  numOutputs?: number
}

export async function generateImage(
  prompt: string,
  apiKeys: APIKeys,
  provider: keyof APIKeys,
  onProgress: ProgressCallback,
  options?: GenerationOptions
): Promise<string> {
  onProgress({ progress: 10, stage: 'Initializing generation...' })

  switch (provider) {
    case 'openai':
      return await generateWithOpenAI(prompt, apiKeys.openai!, onProgress, options)
    case 'stabilityai':
      return await generateWithStabilityAI(prompt, apiKeys.stabilityai!, onProgress, options)
    case 'replicate':
      return await generateImageWithReplicate(prompt, apiKeys.replicate!, onProgress, options)
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}

export async function batchGenerateImages(
  prompt: string,
  apiKeys: APIKeys,
  provider: keyof APIKeys,
  onProgress: ProgressCallback,
  count: number,
  options?: GenerationOptions
): Promise<string[]> {
  const results: string[] = []
  
  for (let i = 0; i < count; i++) {
    onProgress({ progress: (i / count) * 90, stage: `Generating image ${i + 1} of ${count}...` })
    
    try {
      const url = await generateImage(prompt, apiKeys, provider, 
        (update) => {
          const adjustedProgress = (i / count) * 90 + (update.progress / count) * 0.9
          onProgress({ ...update, progress: adjustedProgress })
        },
        options
      )
      results.push(url)
    } catch (error) {
      console.error(`Failed to generate image ${i + 1}:`, error)
    }
  }
  
  return results
}

export async function upscaleImage(
  imageUrl: string,
  apiKeys: APIKeys,
  onProgress: ProgressCallback
): Promise<string> {
  if (!apiKeys.replicate) {
    throw new Error('Replicate API key required for upscaling')
  }

  onProgress({ progress: 10, stage: 'Preparing image for upscaling...' })

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${apiKeys.replicate}`
    },
    body: JSON.stringify({
      version: 'nightmareai/real-esrgan:42fd2a032a39c5f2f0b4b63dc9b5e6b90a1452afaa53d9d0c6ee97b88cb5c4fc',
      input: {
        image: imageUrl,
        scale: 4,
        face_enhance: false
      }
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `Upscaling failed: ${response.status}`)
  }

  const prediction = await response.json()
  
  onProgress({ progress: 30, stage: 'Upscaling image...' })
  
  const upscaledUrl = await pollReplicatePrediction(prediction.id, apiKeys.replicate, onProgress)
  
  onProgress({ progress: 100, stage: 'Upscaling complete!' })
  
  return upscaledUrl
}

export async function generateVideo(
  prompt: string,
  apiKeys: APIKeys,
  provider: keyof APIKeys,
  onProgress: ProgressCallback,
  options?: GenerationOptions
): Promise<string> {
  onProgress({ progress: 10, stage: 'Initializing video generation...' })

  switch (provider) {
    case 'runwayml':
      return await generateWithRunwayML(prompt, apiKeys.runwayml!, onProgress, options)
    case 'replicate':
      return await generateVideoWithReplicate(prompt, apiKeys.replicate!, onProgress, options)
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}

async function generateWithOpenAI(
  prompt: string,
  apiKey: string,
  onProgress: ProgressCallback,
  options?: GenerationOptions
): Promise<string> {
  onProgress({ progress: 20, stage: 'Connecting to OpenAI...' })

  if (options?.referenceImage) {
    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: await createImageEditFormData(options.referenceImage, prompt)
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

async function createImageEditFormData(imageUrl: string, prompt: string): Promise<FormData> {
  const formData = new FormData()
  
  const imageBlob = await fetch(imageUrl).then(r => r.blob())
  formData.append('image', imageBlob, 'image.png')
  formData.append('prompt', prompt)
  formData.append('n', '1')
  formData.append('size', '1024x1024')
  
  return formData
}

async function generateWithStabilityAI(
  prompt: string,
  apiKey: string,
  onProgress: ProgressCallback,
  options?: GenerationOptions
): Promise<string> {
  onProgress({ progress: 20, stage: 'Connecting to Stability AI...' })

  if (options?.referenceImage) {
    const formData = new FormData()
    const imageBlob = await fetch(options.referenceImage).then(r => r.blob())
    formData.append('init_image', imageBlob)
    formData.append('text_prompts[0][text]', prompt)
    formData.append('text_prompts[0][weight]', '1')
    formData.append('image_strength', String(options.strength || 0.35))
    formData.append('cfg_scale', '7')
    formData.append('samples', '1')
    formData.append('steps', '30')

    const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      body: formData
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
  onProgress: ProgressCallback,
  options?: GenerationOptions
): Promise<string> {
  onProgress({ progress: 20, stage: 'Connecting to Replicate...' })

  const input: any = {
    prompt: prompt,
    width: 1024,
    height: 1024,
    num_outputs: options?.numOutputs || 1
  }

  if (options?.referenceImage) {
    input.image = options.referenceImage
    input.prompt_strength = options.strength || 0.8
  }

  const version = options?.referenceImage 
    ? 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b'
    : 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4'

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${apiKey}`
    },
    body: JSON.stringify({
      version: version,
      input: input
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `Replicate API error: ${response.status}`)
  }

  const prediction = await response.json()
  
  onProgress({ progress: 40, stage: options?.referenceImage ? 'Transforming image...' : 'Generating image...' })
  
  const imageUrl = await pollReplicatePrediction(prediction.id, apiKey, onProgress)
  
  onProgress({ progress: 95, stage: 'Finalizing...' })
  
  return imageUrl
}

async function generateVideoWithReplicate(
  prompt: string,
  apiKey: string,
  onProgress: ProgressCallback,
  options?: GenerationOptions
): Promise<string> {
  onProgress({ progress: 20, stage: 'Connecting to Replicate...' })

  const input: any = {
    prompt: prompt,
    num_frames: 24,
    num_inference_steps: 50
  }

  let version = 'anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351'

  if (options?.referenceVideo) {
    version = 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438'
    input.video = options.referenceVideo
    input.cond_aug = 0.02
    input.decoding_t = 14
    input.motion_bucket_id = 127
    input.frames_per_second = 6
    
    if (options.strength !== undefined) {
      input.motion_bucket_id = Math.round(options.strength * 255)
    }
  } else if (options?.referenceImage) {
    version = 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438'
    input.image = options.referenceImage
    input.cond_aug = 0.02
    input.decoding_t = 14
    input.motion_bucket_id = 127
    input.frames_per_second = 6
    
    if (options.strength !== undefined) {
      input.motion_bucket_id = Math.round(options.strength * 255)
    }
  }

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${apiKey}`
    },
    body: JSON.stringify({
      version: version,
      input: input
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `Replicate API error: ${response.status}`)
  }

  const prediction = await response.json()
  
  onProgress({ 
    progress: 40, 
    stage: options?.referenceVideo 
      ? 'Transforming video...' 
      : options?.referenceImage 
        ? 'Animating image...' 
        : 'Generating video frames...' 
  })
  
  const videoUrl = await pollReplicatePrediction(prediction.id, apiKey, onProgress, true)
  
  onProgress({ progress: 95, stage: 'Finalizing...' })
  
  return videoUrl
}

async function generateWithRunwayML(
  prompt: string,
  apiKey: string,
  onProgress: ProgressCallback,
  options?: GenerationOptions
): Promise<string> {
  onProgress({ progress: 20, stage: 'Connecting to RunwayML...' })

  const payload: any = {
    model: 'gen2',
    prompt: prompt,
    duration: 4,
    resolution: '1280x768'
  }

  if (options?.referenceVideo) {
    payload.init_video = options.referenceVideo
    payload.interpolate = true
    payload.upscale = false
    
    if (options.strength !== undefined) {
      payload.init_video_strength = 1 - options.strength
    }
  } else if (options?.referenceImage) {
    payload.init_image = options.referenceImage
    
    if (options.strength !== undefined) {
      payload.init_image_strength = 1 - options.strength
    }
  }

  const response = await fetch('https://api.runwayml.com/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `RunwayML API error: ${response.status}`)
  }

  const data = await response.json()
  const taskId = data.id

  onProgress({ 
    progress: 40, 
    stage: options?.referenceVideo ? 'Transforming video...' : 'Generating video...' 
  })
  
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
