import { httpsCallable } from "firebase/functions";

import { functions } from "../firebase";

export type AIProvider = "groq" | "xai";
export type AITransport = "firebase-functions" | "direct";

export interface ChatCompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  endpoint: string;
  model: string;
  serviceTier?: string;
}

export interface AIExecutionConfig {
  transport: AITransport;
  provider: AIProvider | "proxy";
  model: string;
  functionName?: string;
}

interface RequestChatCompletionArgs {
  messages: ChatCompletionMessage[];
  temperature?: number;
  maxCompletionTokens?: number;
}

function envFlag(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

function pickGroqConfig(): AIProviderConfig | null {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY?.trim();
  if (!apiKey) return null;

  return {
    provider: "groq",
    apiKey,
    endpoint: import.meta.env.VITE_GROQ_BASE_URL?.trim() || "https://api.groq.com/openai/v1/chat/completions",
    model: import.meta.env.VITE_GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
    serviceTier: import.meta.env.VITE_GROQ_SERVICE_TIER?.trim() || "on_demand",
  };
}

function pickXAIConfig(): AIProviderConfig | null {
  const apiKey = import.meta.env.VITE_GROK_API_KEY?.trim() || import.meta.env.VITE_XAI_API_KEY?.trim();
  if (!apiKey) return null;

  return {
    provider: "xai",
    apiKey,
    endpoint: import.meta.env.VITE_GROK_BASE_URL?.trim() || "https://api.x.ai/v1/chat/completions",
    model: import.meta.env.VITE_GROK_MODEL?.trim() || "grok-2-latest",
  };
}

function isFirebaseAIProxyEnabled() {
  return envFlag(import.meta.env.VITE_USE_FIREBASE_AI_PROXY);
}

function getFirebaseAIProxyName() {
  return import.meta.env.VITE_FIREBASE_AI_FUNCTION_NAME?.trim() || "aiChatProxy";
}

function getDirectProviderConfig(): AIProviderConfig {
  const groq = pickGroqConfig();
  if (groq) return groq;

  const xai = pickXAIConfig();
  if (xai) return xai;

  throw new Error("AI_PROVIDER_NOT_CONFIGURED");
}

export function resolveAIProviderConfig(): AIProviderConfig {
  return getDirectProviderConfig();
}

export function resolveAIExecutionConfig(): AIExecutionConfig {
  if (isFirebaseAIProxyEnabled()) {
    return {
      transport: "firebase-functions",
      provider: "proxy",
      functionName: getFirebaseAIProxyName(),
      model: import.meta.env.VITE_GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
    };
  }

  const provider = getDirectProviderConfig();
  return {
    transport: "direct",
    provider: provider.provider,
    model: provider.model,
  };
}

function normalizeContent(content: unknown): string {
  if (typeof content === "string") return content.trim();

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: unknown }).text || "");
        }
        return "";
      })
      .join("\n")
      .trim();
  }

  return "";
}

async function requestViaFirebaseProxy({
  messages,
  temperature = 0.7,
  maxCompletionTokens = 420,
}: RequestChatCompletionArgs): Promise<string> {
  const callable = httpsCallable(functions, getFirebaseAIProxyName());
  const response = await callable({
    messages,
    temperature,
    maxCompletionTokens,
  });

  const data = response.data as { content?: unknown };
  const content = normalizeContent(data?.content);
  if (!content) throw new Error("FIREBASE_AI_PROXY_EMPTY_REPLY");
  return content;
}

async function requestDirectChatCompletion(
  config: AIProviderConfig,
  { messages, temperature = 0.7, maxCompletionTokens = 420 }: RequestChatCompletionArgs,
): Promise<string> {
  const payload: Record<string, unknown> = {
    model: config.model,
    temperature,
    max_completion_tokens: maxCompletionTokens,
    messages,
  };

  if (config.provider === "groq" && config.serviceTier) {
    payload.service_tier = config.serviceTier;
  }

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error?.message || `${config.provider.toUpperCase()}_REQUEST_FAILED`);
  }

  const content = normalizeContent(data?.choices?.[0]?.message?.content);
  if (!content) {
    throw new Error(`${config.provider.toUpperCase()}_EMPTY_REPLY`);
  }

  return content;
}

export async function requestChatCompletion(args: RequestChatCompletionArgs): Promise<string> {
  if (isFirebaseAIProxyEnabled()) {
    try {
      return await requestViaFirebaseProxy(args);
    } catch (error) {
      console.warn("[AI] Firebase proxy failed, falling back to direct provider:", error);
    }
  }

  const config = getDirectProviderConfig();
  return requestDirectChatCompletion(config, args);
}
