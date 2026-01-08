import OpenAI from 'openai'

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'placeholder-key',
})

// Use GPT-4o-mini for cost efficiency
export const DEFAULT_MODEL = 'gpt-4o-mini'

/**
 * Helper to call OpenAI with consistent error handling
 */
export async function callOpenAI(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: {
    model?: string
    temperature?: number
    maxTokens?: number
    responseFormat?: { type: 'json_object' }
  } = {}
): Promise<string> {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = 2000,
    responseFormat,
  } = options

  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: responseFormat,
    })

    return response.choices[0]?.message?.content || ''
  } catch (error) {
    console.error('[OpenAI] API call failed:', error)
    throw error
  }
}
