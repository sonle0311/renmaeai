/**
 * BYOK AI Client Service — Conversation-based AI Provider
 *
 * Port from v1 HybridAIClient (ai_automation.py) → NestJS.
 *
 * Key features:
 * - BYOK: Every call uses per-user API keys from user.aiSettings
 * - Server fallback: Uses GEMINI_API_KEY / OPENAI_API_KEY from env when user keys fail
 * - Auto-routing: Gemini (primary, fast) → OpenAI (fallback)
 * - Rate limit detection + auto-retry with backoff
 * - Conversation fallback when provider fails mid-conversation
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, type ChatSession } from '@google/generative-ai';
import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import {
    AIProvider,
    type UserAISettings,
    type ConversationState,
    type ConversationMessage,
    type AIResponse,
} from './ai-client.types';

const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';
const DEFAULT_OPENAI_MODEL = 'gpt-5.4';
const GENERATION_TIMEOUT_MS = 120_000; // 2 minutes
const RATE_LIMIT_RETRY_DELAY_MS = 5_000; // 5 seconds
const MAX_RATE_LIMIT_RETRIES = 3;

@Injectable()
export class AiClientService {
    private readonly logger = new Logger(AiClientService.name);
    private readonly conversations = new Map<string, ConversationState>();

    // Server-side fallback keys from environment
    private readonly serverGeminiKey?: string;
    private readonly serverOpenaiKey?: string;
    private readonly serverOpenaiBaseUrl?: string;

    constructor(private configService: ConfigService) {
        this.serverGeminiKey = this.configService.get<string>('GEMINI_API_KEY');
        this.serverOpenaiKey = this.configService.get<string>('OPENAI_API_KEY');
        this.serverOpenaiBaseUrl = this.configService.get<string>('OPENAI_BASE_URL');

        if (this.serverGeminiKey) {
            this.logger.log('Server fallback Gemini key loaded from env');
        }
        if (this.serverOpenaiKey) {
            this.logger.log('Server fallback OpenAI key loaded from env');
        }
    }

    /**
     * Build effective settings — merge user keys with server fallback keys.
     * User keys take priority; server keys are used when user keys are missing.
     */
    private getEffectiveSettings(settings: UserAISettings): UserAISettings {
        return {
            ...settings,
            geminiKey: settings.geminiKey || this.serverGeminiKey,
            openaiKey: settings.openaiKey || this.serverOpenaiKey,
            openaiBaseUrl: settings.openaiBaseUrl || this.serverOpenaiBaseUrl,
        };
    }

    // ─── Rate limit detection ─────────────────────────────────────

    private isRateLimitError(error: any): boolean {
        const msg = error?.message || String(error);
        return (
            msg.includes('429') ||
            msg.includes('RESOURCE_EXHAUSTED') ||
            msg.includes('rate limit') ||
            msg.includes('Rate limit') ||
            msg.includes('quota') ||
            msg.includes('Please retry') ||
            msg.includes('too many requests') ||
            msg.includes('Too Many Requests')
        );
    }

    private async retryWithBackoff<T>(
        fn: () => Promise<T>,
        maxRetries: number = MAX_RATE_LIMIT_RETRIES,
    ): Promise<T> {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                if (this.isRateLimitError(error) && attempt < maxRetries) {
                    const delay = RATE_LIMIT_RETRY_DELAY_MS * Math.pow(2, attempt);
                    this.logger.warn(
                        `Rate limited. Retrying in ${delay / 1000}s (attempt ${attempt + 1}/${maxRetries})...`,
                    );
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }
                throw error;
            }
        }
        throw new Error('Max retries exceeded');
    }

    // ─── Single-shot generation ───────────────────────────────────

    /**
     * Generate a single response (no conversation context).
     * Auto-routes: User Gemini → User OpenAI → Server Gemini → Server OpenAI.
     */
    async generate(
        settings: UserAISettings,
        prompt: string,
        options?: { temperature?: number; provider?: AIProvider; model?: string },
    ): Promise<AIResponse> {
        const temp = options?.temperature ?? 0.7;
        const provider = options?.provider ?? AIProvider.AUTO;
        const model = options?.model;
        const effective = this.getEffectiveSettings(settings);

        // Build key list: [user keys, server fallback keys]
        const keySources: Array<{ provider: AIProvider; key: string; label: string }> = [];

        if (provider !== AIProvider.OPENAI) {
            if (settings.geminiKey) keySources.push({ provider: AIProvider.GEMINI, key: settings.geminiKey, label: 'user-gemini' });
            if (this.serverGeminiKey && this.serverGeminiKey !== settings.geminiKey)
                keySources.push({ provider: AIProvider.GEMINI, key: this.serverGeminiKey, label: 'server-gemini' });
        }
        if (provider !== AIProvider.GEMINI) {
            if (settings.openaiKey) keySources.push({ provider: AIProvider.OPENAI, key: settings.openaiKey, label: 'user-openai' });
            if (this.serverOpenaiKey && this.serverOpenaiKey !== settings.openaiKey)
                keySources.push({ provider: AIProvider.OPENAI, key: this.serverOpenaiKey, label: 'server-openai' });
        }

        if (keySources.length === 0) {
            throw new Error('No AI provider configured. Add API keys in Settings.');
        }

        let lastError: Error | null = null;

        for (const source of keySources) {
            try {
                if (source.provider === AIProvider.GEMINI) {
                    return await this.retryWithBackoff(() =>
                        this.generateGemini(source.key, prompt, temp, model),
                    );
                }
                if (source.provider === AIProvider.OPENAI) {
                    const openaiSettings: UserAISettings = {
                        ...effective,
                        openaiKey: source.key,
                    };
                    return await this.retryWithBackoff(() =>
                        this.generateOpenAI(openaiSettings, prompt, temp, model),
                    );
                }
            } catch (error) {
                lastError = error;
                this.logger.warn(`[${source.label}] failed: ${error.message}. Trying next...`);
            }
        }

        throw new Error(
            `All AI providers failed. Last error: ${lastError?.message || 'unknown'}`,
        );
    }

    // ─── Conversation management ──────────────────────────────────

    /**
     * Start a new conversation session.
     * Uses conversation API to maintain context across multiple messages.
     */
    startConversation(
        settings: UserAISettings,
        systemPrompt?: string,
    ): string {
        const effective = this.getEffectiveSettings(settings);
        const convId = randomUUID();
        const provider = this.pickBestProvider(effective);

        const messages: ConversationMessage[] = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }

        if (provider === AIProvider.GEMINI && effective.geminiKey) {
            const geminiModelName = effective.geminiModel || DEFAULT_GEMINI_MODEL;
            const genAI = new GoogleGenerativeAI(effective.geminiKey);
            const model = genAI.getGenerativeModel({
                model: geminiModelName,
            });

            const history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
            if (systemPrompt) {
                history.push(
                    { role: 'user', parts: [{ text: `[System Context]\n${systemPrompt}` }] },
                    { role: 'model', parts: [{ text: 'Understood. I will follow these instructions.' }] },
                );
            }

            const chat = model.startChat({ history });

            this.conversations.set(convId, {
                provider: AIProvider.GEMINI,
                messages,
                model: geminiModelName,
                geminiChat: chat,
            });
        } else if (effective.openaiKey) {
            this.conversations.set(convId, {
                provider: AIProvider.OPENAI,
                messages,
                model: effective.openaiModel || DEFAULT_OPENAI_MODEL,
            });
        } else {
            throw new Error('No AI provider configured. Add API keys in Settings.');
        }

        this.logger.log(
            `Started conversation ${convId.slice(0, 8)}... (provider: ${provider})`,
        );
        return convId;
    }

    /**
     * Send a message within an existing conversation.
     * If the provider rate-limits mid-conversation, retries with backoff.
     * If provider completely fails, falls back to single-shot generate().
     */
    async sendMessage(
        settings: UserAISettings,
        conversationId: string,
        message: string,
        temperature = 0.7,
    ): Promise<string> {
        const effective = this.getEffectiveSettings(settings);
        const conv = this.conversations.get(conversationId);
        if (!conv) {
            throw new Error(`Conversation ${conversationId} not found`);
        }

        conv.messages.push({ role: 'user', content: message });

        try {
            let responseText: string;

            if (conv.provider === AIProvider.GEMINI) {
                responseText = await this.retryWithBackoff(() =>
                    this.sendGeminiMessage(conv, message, temperature),
                );
            } else {
                responseText = await this.retryWithBackoff(() =>
                    this.sendOpenAIMessage(effective, conv, temperature),
                );
            }

            conv.messages.push({ role: 'assistant', content: responseText });
            return responseText;
        } catch (error) {
            this.logger.warn(
                `Conversation provider ${conv.provider} failed completely: ${error.message}. ` +
                `Falling back to single-shot generate()...`,
            );

            // Fallback: use single-shot generate() with full conversation context
            const fullPrompt = conv.messages
                .map(m => `[${m.role}]: ${m.content}`)
                .join('\n\n');

            const result = await this.generate(effective, fullPrompt, { temperature });
            const responseText = result.text;

            conv.messages.push({ role: 'assistant', content: responseText });
            return responseText;
        }
    }

    /**
     * End conversation and cleanup resources.
     */
    endConversation(conversationId: string): void {
        if (this.conversations.has(conversationId)) {
            this.conversations.delete(conversationId);
            this.logger.log(
                `Ended conversation ${conversationId.slice(0, 8)}...`,
            );
        }
    }

    // ─── Gemini implementation ────────────────────────────────────

    private async generateGemini(
        apiKey: string,
        prompt: string,
        temperature: number,
        model?: string,
    ): Promise<AIResponse> {
        const genAI = new GoogleGenerativeAI(apiKey);
        const geminiModel = genAI.getGenerativeModel({
            model: model || DEFAULT_GEMINI_MODEL,
            generationConfig: { temperature },
        });

        const result = await this.withTimeout(
            geminiModel.generateContent(prompt),
            GENERATION_TIMEOUT_MS,
        );
        const text = result.response.text();

        return {
            text,
            provider: AIProvider.GEMINI,
            model: model || DEFAULT_GEMINI_MODEL,
        };
    }

    private async sendGeminiMessage(
        conv: ConversationState,
        message: string,
        temperature: number,
    ): Promise<string> {
        const chat = conv.geminiChat as ChatSession;
        if (!chat) throw new Error('Gemini chat session not initialized');

        const result = await this.withTimeout(
            chat.sendMessage(message),
            GENERATION_TIMEOUT_MS,
        );
        return result.response.text();
    }

    // ─── OpenAI implementation ────────────────────────────────────

    private async generateOpenAI(
        settings: UserAISettings,
        prompt: string,
        temperature: number,
        model?: string,
    ): Promise<AIResponse> {
        const client = new OpenAI({
            apiKey: settings.openaiKey,
            baseURL: settings.openaiBaseUrl || undefined,
        });

        const modelName = model || settings.openaiModel || DEFAULT_OPENAI_MODEL;

        const completion = await this.withTimeout(
            client.chat.completions.create({
                model: modelName,
                messages: [{ role: 'user', content: prompt }],
                temperature,
            }),
            GENERATION_TIMEOUT_MS,
        );

        const text = completion.choices[0]?.message?.content || '';

        return {
            text,
            provider: AIProvider.OPENAI,
            model: modelName,
            tokenUsage: completion.usage
                ? {
                    promptTokens: completion.usage.prompt_tokens,
                    completionTokens: completion.usage.completion_tokens,
                    totalTokens: completion.usage.total_tokens,
                }
                : undefined,
        };
    }

    private async sendOpenAIMessage(
        settings: UserAISettings,
        conv: ConversationState,
        temperature: number,
    ): Promise<string> {
        const client = new OpenAI({
            apiKey: settings.openaiKey,
            baseURL: settings.openaiBaseUrl || undefined,
        });

        const completion = await this.withTimeout(
            client.chat.completions.create({
                model: conv.model,
                messages: conv.messages.map((m) => ({
                    role: m.role as 'system' | 'user' | 'assistant',
                    content: m.content,
                })),
                temperature,
            }),
            GENERATION_TIMEOUT_MS,
        );

        return completion.choices[0]?.message?.content || '';
    }

    // ─── Helpers ──────────────────────────────────────────────────

    private resolveProviderOrder(
        settings: UserAISettings,
        preference: AIProvider,
    ): AIProvider[] {
        if (preference === AIProvider.GEMINI) return [AIProvider.GEMINI, AIProvider.OPENAI];
        if (preference === AIProvider.OPENAI) return [AIProvider.OPENAI, AIProvider.GEMINI];
        // AUTO: Gemini first (faster + cheaper), fallback OpenAI
        if (settings.geminiKey) return [AIProvider.GEMINI, AIProvider.OPENAI];
        return [AIProvider.OPENAI];
    }

    private pickBestProvider(settings: UserAISettings): AIProvider {
        if (settings.geminiKey) return AIProvider.GEMINI;
        if (settings.openaiKey) return AIProvider.OPENAI;
        return AIProvider.AUTO;
    }

    private async withTimeout<T>(
        promise: Promise<T>,
        timeoutMs: number,
    ): Promise<T> {
        return Promise.race([
            promise,
            new Promise<never>((_, reject) =>
                setTimeout(
                    () => reject(new Error(`AI request timed out after ${timeoutMs / 1000}s`)),
                    timeoutMs,
                ),
            ),
        ]);
    }
}
