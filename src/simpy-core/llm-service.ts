/**
 * Client-Side LLM Service for Browser-Direct Execution
 * Designed for GitHub Pages static deployment:
 * Supports:
 * - gemini 3 flash (Google Gemini API)
 * - deepseek-v4-pro (DeepSeek / OpenAI Compatible API)
 * Enforces mandatory API-Key validation before any calls.
 */

export type LLMModelType = 'gemini 3 flash' | 'deepseek-v4-pro';

export interface LLMConfig {
  model: LLMModelType;
  apiKey: string;
  baseUrl?: string; // Optional custom endpoint (for proxies or custom DeepSeek domains)
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  isError?: boolean;
}

const STORAGE_KEY = 'simpy_des_llm_config_v1';
const CHAT_HISTORY_KEY = 'simpy_des_chat_history_v1';

export function loadLLMConfig(): LLMConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        model: parsed.model || 'gemini 3 flash',
        apiKey: parsed.apiKey || '',
        baseUrl: parsed.baseUrl || '',
      };
    }
  } catch (e) {
    console.warn('Failed to load LLM config from localStorage:', e);
  }
  return {
    model: 'gemini 3 flash',
    apiKey: '',
    baseUrl: '',
  };
}

export function saveLLMConfig(config: LLMConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save LLM config to localStorage:', e);
  }
}

export function loadChatHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load chat history:', e);
  }
  return [];
}

export function saveChatHistory(history: ChatMessage[]): void {
  try {
    // Keep last 30 messages to prevent storage bloat
    const trimmed = history.slice(-30);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to save chat history:', e);
  }
}

/**
 * Executes direct client-side browser API call to the chosen model
 */
export async function callBrowserLLM(
  userPrompt: string,
  history: ChatMessage[],
  config: LLMConfig,
  contextData: {
    scenarioName: string;
    params: any;
    metrics: any;
  }
): Promise<string> {
  const apiKey = config.apiKey.trim();
  if (!apiKey) {
    throw new Error('未配置 API-Key！请点击右上角小齿轮 ⚙️ 设置并输入有效的 API-Key 后再进行调用。');
  }

  const { scenarioName, params, metrics } = contextData;
  const rho = params ? (params.lambda / (params.servers * params.mu)).toFixed(3) : 'N/A';

  const systemInstruction = `你是一位专注于离散事件仿真（Discrete-Event Simulation, DES）与 SimPy 建模的资深运筹学科学家。
你正在“SimPy 离散事件仿真实验室”为用户提供咨询。
当前实验环境指标如下：
- 当前场景: ${scenarioName || '自定义排队系统'}
- 到达率 lambda: ${params?.lambda}
- 单台服务率 mu: ${params?.mu}
- 服务台数量 c: ${params?.servers}
- 理论服务强度 rho: ${rho}
- 观测平均等待时间 Wq: ${metrics?.avgWaitTime ? metrics.avgWaitTime.toFixed(3) : '计算中'}
- 观测平均队长 Lq: ${metrics?.avgQueueLength ? metrics.avgQueueLength.toFixed(3) : '计算中'}
- 资源调度类型: ${params?.resourceType || 'Resource'}

请运用排队论（Little 定理、Lindley 积分方程、Erlang-C 公式、Kingman 近似）及 Python SimPy 协程生成器（yield timeout, request, interrupt）知识，严谨、通俗且结构清晰地回答用户的问题。如果回答涉及代码，请给出清晰的 SimPy Python 示例。`;

  if (config.model === 'gemini 3 flash') {
    return await callGeminiAPI(userPrompt, history, apiKey, systemInstruction);
  } else {
    return await callDeepSeekAPI(userPrompt, history, apiKey, config.baseUrl, systemInstruction);
  }
}

/**
 * Direct browser call to Google Gemini API
 */
async function callGeminiAPI(
  prompt: string,
  history: ChatMessage[],
  apiKey: string,
  systemInstruction: string
): Promise<string> {
  // Use gemini-2.5-flash endpoint (Gemini Flash modern model with CORS support)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;

  // Convert history to Gemini format (filter out system/error)
  const contents: any[] = [];

  // Add recent history (up to last 6 messages)
  const recentHistory = history
    .filter((m) => !m.isError && (m.role === 'user' || m.role === 'assistant'))
    .slice(-6);

  for (const msg of recentHistory) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }

  // Add current user prompt
  contents.push({
    role: 'user',
    parts: [{ text: prompt }],
  });

  const requestBody = {
    contents,
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 2048,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error?.message || response.statusText;
    } catch {
      errorDetail = `HTTP ${response.status} ${response.statusText}`;
    }
    throw new Error(`Gemini API 错误 (${response.status}): ${errorDetail}`);
  }

  const data = await response.json();
  const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!candidateText) {
    throw new Error('Gemini API 未返回有效文本内容，请检查模型配额或提示词。');
  }

  return candidateText;
}

/**
 * Direct browser call to DeepSeek API (OpenAI Compatible)
 */
async function callDeepSeekAPI(
  prompt: string,
  history: ChatMessage[],
  apiKey: string,
  customBaseUrl: string | undefined,
  systemInstruction: string
): Promise<string> {
  const baseUrl = (customBaseUrl && customBaseUrl.trim())
    ? customBaseUrl.trim().replace(/\/+$/, '')
    : 'https://api.deepseek.com';

  const endpoint = baseUrl.endsWith('/chat/completions')
    ? baseUrl
    : `${baseUrl}/chat/completions`;

  const messages: any[] = [{ role: 'system', content: systemInstruction }];

  // Recent history
  const recentHistory = history
    .filter((m) => !m.isError && (m.role === 'user' || m.role === 'assistant'))
    .slice(-6);

  for (const msg of recentHistory) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  messages.push({ role: 'user', content: prompt });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat', // deepseek-v4-pro mapping to deepseek-chat endpoint
      messages,
      temperature: 0.6,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error?.message || response.statusText;
    } catch {
      errorDetail = `HTTP ${response.status} ${response.statusText}`;
    }
    throw new Error(`DeepSeek API 错误 (${response.status}): ${errorDetail}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('DeepSeek API 未返回有效结果，请确认 API-Key 与服务状态。');
  }

  return content;
}
