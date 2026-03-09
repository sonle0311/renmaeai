import {
    Controller,
    Post,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

interface ListModelsDto {
    provider: 'gemini' | 'openai';
    apiKey: string;
    baseUrl?: string;
}

interface ModelInfo {
    id: string;
    name: string;
    description?: string;
}

@Controller('api/v1/ai')
@UseGuards(JwtAuthGuard)
export class AiController {
    private readonly logger = new Logger(AiController.name);

    @Post('list-models')
    @HttpCode(HttpStatus.OK)
    async listModels(@Body() body: ListModelsDto): Promise<{
        success: boolean;
        models: ModelInfo[];
        error?: string;
    }> {
        const { provider, apiKey, baseUrl } = body;

        if (!apiKey || apiKey.trim().length < 5) {
            return { success: false, models: [], error: 'API Key không hợp lệ' };
        }

        try {
            if (provider === 'gemini') {
                return await this.listGeminiModels(apiKey);
            } else if (provider === 'openai') {
                return await this.listOpenAIModels(apiKey, baseUrl);
            }

            return { success: false, models: [], error: `Provider '${provider}' không được hỗ trợ` };
        } catch (error) {
            this.logger.warn(`Failed to list models for ${provider}: ${error.message}`);

            // Parse user-friendly error
            const msg = error.message || String(error);
            let friendlyError = 'Không thể kết nối tới API';

            if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('invalid'))
                friendlyError = 'API Key không hợp lệ. Kiểm tra lại key.';
            else if (msg.includes('403') || msg.includes('Forbidden'))
                friendlyError = 'API Key không có quyền. Kiểm tra billing/plan.';
            else if (msg.includes('429') || msg.includes('quota'))
                friendlyError = 'Key đã hết quota. Kiểm tra billing.';
            else if (msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED'))
                friendlyError = 'Không kết nối được tới server. Kiểm tra Base URL.';

            return { success: false, models: [], error: friendlyError };
        }
    }

    private async listGeminiModels(apiKey: string): Promise<{
        success: boolean;
        models: ModelInfo[];
    }> {
        const genAI = new GoogleGenerativeAI(apiKey);

        // Gemini SDK doesn't have listModels() in the npm package,
        // so we call the REST API directly
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        );

        if (!res.ok) {
            const error = await res.text();
            throw new Error(`Gemini API error (${res.status}): ${error}`);
        }

        const data = await res.json() as {
            models: Array<{
                name: string;
                displayName: string;
                description?: string;
                supportedGenerationMethods?: string[];
            }>;
        };

        // Filter to only generation-capable models
        const models: ModelInfo[] = (data.models || [])
            .filter(m =>
                m.supportedGenerationMethods?.includes('generateContent') &&
                !m.name.includes('embedding') &&
                !m.name.includes('aqa')
            )
            .map(m => ({
                id: m.name.replace('models/', ''),
                name: m.displayName,
                description: m.description?.substring(0, 100),
            }))
            .sort((a, b) => {
                // Prioritize flash models, then pro
                if (a.id.includes('flash') && !b.id.includes('flash')) return -1;
                if (!a.id.includes('flash') && b.id.includes('flash')) return 1;
                // Then by version (newest first)
                return b.id.localeCompare(a.id);
            });

        this.logger.log(`Listed ${models.length} Gemini models`);
        return { success: true, models };
    }

    private async listOpenAIModels(apiKey: string, baseUrl?: string): Promise<{
        success: boolean;
        models: ModelInfo[];
    }> {
        const client = new OpenAI({
            apiKey,
            baseURL: baseUrl || undefined,
        });

        const response = await client.models.list();
        const allModels: ModelInfo[] = [];

        for await (const model of response) {
            allModels.push({
                id: model.id,
                name: model.id,
            });
        }

        // Filter & sort: prioritize chat models
        const chatModels = allModels
            .filter(m =>
                m.id.includes('gpt') ||
                m.id.includes('claude') ||
                m.id.includes('llama') ||
                m.id.includes('mistral') ||
                m.id.includes('deepseek') ||
                m.id.includes('qwen') ||
                m.id.includes('gemma') ||
                // Include all if custom base URL (could be any provider)
                !!baseUrl
            )
            .sort((a, b) => a.id.localeCompare(b.id));

        this.logger.log(`Listed ${chatModels.length} OpenAI-compatible models`);
        return { success: true, models: chatModels.length > 0 ? chatModels : allModels };
    }
}
