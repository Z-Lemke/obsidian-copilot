import { ChatOpenAI } from "@langchain/openai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

export interface LLMProviderConfig {
    provider: "openai";  // Can expand to support other providers
    model: string;
    apiKey: string;
}

/**
 * A generic LLM provider service that can be used by any feature requiring LLM capabilities.
 * Currently supports OpenAI, but can be expanded to support other providers.
 */
export class LLMProvider {
    private static instance: LLMProvider;
    private model: BaseChatModel | null = null;
    private config: LLMProviderConfig | null = null;

    private constructor() {
        console.log("[LLMProvider] Initializing singleton instance");
    }

    /**
     * Get the singleton instance of LLMProvider
     */
    public static getInstance(): LLMProvider {
        console.log("[LLMProvider] Getting instance, exists:", !!LLMProvider.instance);
        if (!LLMProvider.instance) {
            LLMProvider.instance = new LLMProvider();
        }
        return LLMProvider.instance;
    }

    /**
     * Configure the LLM provider with the given settings
     */
    public configure(config: LLMProviderConfig): void {
        console.log("[LLMProvider] Configuring with:", { 
            provider: config.provider, 
            model: config.model, 
            apiKeyLength: config.apiKey?.length || 0 
        });
        
        this.config = config;
        try {
            switch (config.provider) {
                case "openai":
                    console.log("[LLMProvider] Creating ChatOpenAI instance");
                    this.model = new ChatOpenAI({
                        modelName: config.model,
                        openAIApiKey: config.apiKey,
                        temperature: 0.7,
                    });
                    console.log("[LLMProvider] ChatOpenAI instance created successfully");
                    break;
                default:
                    throw new Error(`Unsupported LLM provider: ${config.provider}`);
            }
        } catch (error) {
            console.error("[LLMProvider] Error configuring provider:", error);
            throw error;
        }
    }

    /**
     * Get the configured LLM model
     * @throws Error if the provider is not configured
     */
    public getModel<T extends BaseChatModel>(): T {
        console.log("[LLMProvider] Getting model, exists:", !!this.model);
        if (!this.model) {
            console.error("[LLMProvider] Model not configured. Config state:", {
                hasConfig: !!this.config,
                configDetails: this.config ? {
                    provider: this.config.provider,
                    model: this.config.model,
                    hasApiKey: !!this.config.apiKey
                } : null
            });
            throw new Error("LLM provider not configured");
        }
        return this.model as T;
    }

    /**
     * Check if the provider is configured
     */
    public isConfigured(): boolean {
        const configured = this.model !== null && this.config !== null;
        console.log("[LLMProvider] Checking if configured:", {
            hasModel: !!this.model,
            hasConfig: !!this.config,
            isConfigured: configured
        });
        return configured;
    }

    /**
     * Get the current configuration
     */
    public getConfig(): LLMProviderConfig | null {
        console.log("[LLMProvider] Getting config:", !!this.config);
        return this.config;
    }
}
