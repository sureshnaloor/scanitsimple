export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' | 'text' };
}

export async function callDeepSeekChat(
  messages: ChatMessage[],
  options: DeepSeekChatOptions = {}
): Promise<string> {
  const apiKey = (
    process.env.OPENAI_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.DEEPSEEK_API_KEY ||
    ''
  ).trim();

  if (!apiKey) {
    throw new Error('No API key found. Please ensure OPENAI_KEY or DEEPSEEK_API_KEY is configured in .env');
  }

  const model = options.model || 'deepseek-chat';
  const temperature = options.temperature !== undefined ? options.temperature : 0.1;
  const max_tokens = options.max_tokens || 8192;

  const endpoints = [
    'https://api.deepseek.com/chat/completions',
    'https://api.deepseek.com/v1/chat/completions',
  ];

  let lastError: any = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens,
          ...(options.response_format ? { response_format: options.response_format } : {}),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response received from LLM model');
      }

      return content;
    } catch (err) {
      lastError = err;
      console.warn(`Attempt with endpoint ${endpoint} failed:`, err);
    }
  }

  throw lastError || new Error('Failed to communicate with DeepSeek API');
}
