/**
 * AI Client Types — BYOK Provider Abstraction
 *
 * Port from v1 ai_automation.py → TypeScript interfaces.
 * Supports Gemini API + OpenAI with per-user API keys (BYOK).
 */

export enum AIProvider {
    GEMINI = 'gemini',
    OPENAI = 'openai',
    AUTO = 'auto',
}

/** Per-user AI settings stored in user.aiSettings JSON field */
export interface UserAISettings {
    geminiKey?: string;
    geminiModel?: string;
    openaiKey?: string;
    openaiBaseUrl?: string;
    openaiModel?: string;
    glabsToken?: string;
    elevenLabsKey?: string;
}

export interface ConversationMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AIResponse {
    text: string;
    provider: AIProvider;
    model: string;
    tokenUsage?: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
    };
}

/** Internal conversation state */
export interface ConversationState {
    provider: AIProvider;
    messages: ConversationMessage[];
    model: string;
    // Gemini-specific: ChatSession reference
    geminiChat?: unknown;
}
