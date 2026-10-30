export class AiServiceError extends Error {
  public code: string;
  public status?: number;
  public isAgentBusy: boolean;

  constructor(
    message: string = 'The AI agent is currently busy. Please try again after some time. If the issue persists, please contact your administrator.',
    code: string = 'AI_AGENT_BUSY',
    status: number = 503
  ) {
    super(message);
    this.name = 'AiServiceError';
    this.code = code;
    this.status = status;
    this.isAgentBusy = true;
  }
}

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
    console.error('[AI Client] No API key configured (OPENAI_KEY / DEEPSEEK_API_KEY missing).');
    throw new AiServiceError(
      'The AI agent is currently busy. Please try again after some time. If the issue persists, please contact your administrator.',
      'MISSING_API_KEY',
      503
    );
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
        console.error(`[AI Client] Upstream API error (${response.status}) at ${endpoint}:`, errorText);

        let code = 'AI_AGENT_BUSY';
        if (response.status === 401 || response.status === 403) {
          code = 'AUTH_ERROR';
        } else if (
          response.status === 402 ||
          errorText.toLowerCase().includes('insufficient') ||
          errorText.toLowerCase().includes('balance') ||
          errorText.toLowerCase().includes('quota')
        ) {
          code = 'INSUFFICIENT_BALANCE';
        } else if (response.status === 429) {
          code = 'RATE_LIMITED';
        }

        throw new AiServiceError(
          'The AI agent is currently busy. Please try again after some time. If the issue persists, please contact your administrator.',
          code,
          response.status
        );
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;

      if (!content) {
        throw new AiServiceError(
          'The AI agent is currently busy. Please try again after some time. If the issue persists, please contact your administrator.',
          'EMPTY_RESPONSE',
          502
        );
      }

      return content;
    } catch (err: any) {
      lastError = err;
      if (err instanceof AiServiceError) {
        // If it was already identified as an auth/quota/balance error, don't keep retrying secondary endpoints with the same invalid key
        if (err.code === 'AUTH_ERROR' || err.code === 'INSUFFICIENT_BALANCE' || err.code === 'MISSING_API_KEY') {
          throw err;
        }
      }
      console.warn(`[AI Client] Attempt with endpoint ${endpoint} failed:`, err?.message || err);
    }
  }

  if (lastError instanceof AiServiceError) {
    throw lastError;
  }

  console.error('[AI Client] Communication failure:', lastError);
  throw new AiServiceError(
    'The AI agent is currently busy. Please try again after some time. If the issue persists, please contact your administrator.',
    'SERVICE_UNAVAILABLE',
    503
  );
}
