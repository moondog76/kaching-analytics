/**
 * Opper AI Client for KaChing Analytics
 * Handles streaming chat responses via Opper's API
 */

export interface OpperMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface OpperCallOptions {
  name: string
  instructions: string
  input: string | Record<string, unknown>
  model?: string
}

export interface OpperStreamChunk {
  span_id?: string
  delta?: string
  chunk_type?: 'text' | 'json'
  json_path?: string
}

/**
 * Make a streaming call to Opper API
 * Returns a ReadableStream that yields text chunks
 */
export async function opperStreamCall(options: OpperCallOptions): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.OPPER_API_KEY

  if (!apiKey) {
    throw new Error('OPPER_API_KEY is not configured')
  }

  const response = await fetch('https://api.opper.ai/v2/call/stream', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: options.name,
      instructions: options.instructions,
      input: options.input,
      model: options.model || 'azure/gpt-4o-eu',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Opper API error: ${response.status} - ${errorText}`)
  }

  if (!response.body) {
    throw new Error('No response body from Opper API')
  }

  // Transform SSE stream to plain text stream
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buffer = ''

  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read()

        if (done) {
          controller.close()
          return
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data && data !== '[DONE]') {
              try {
                const parsed: OpperStreamChunk = JSON.parse(data)
                if (parsed.delta) {
                  controller.enqueue(encoder.encode(parsed.delta))
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }
      } catch (error) {
        controller.error(error)
      }
    },
    cancel() {
      reader.cancel()
    }
  })
}

/**
 * Make a non-streaming call to Opper API
 * Returns the complete response
 */
export async function opperCall(options: OpperCallOptions): Promise<{
  message: string
  span_id: string
  usage?: { input_tokens: number; output_tokens: number; total_tokens: number }
}> {
  const apiKey = process.env.OPPER_API_KEY

  if (!apiKey) {
    throw new Error('OPPER_API_KEY is not configured')
  }

  const response = await fetch('https://api.opper.ai/v2/call', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: options.name,
      instructions: options.instructions,
      input: options.input,
      model: options.model || 'azure/gpt-4o-eu',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Opper API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  return {
    message: data.message || '',
    span_id: data.span_id,
    usage: data.usage,
  }
}

/**
 * Build conversation input for Opper from message history
 */
export function buildConversationInput(
  query: string,
  conversationHistory: OpperMessage[]
): string {
  if (conversationHistory.length === 0) {
    return query
  }

  // Format conversation history for context
  const historyText = conversationHistory
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n\n')

  return `Previous conversation:\n${historyText}\n\nUser: ${query}`
}
