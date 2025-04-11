import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";
import { LLMProvider } from "../../services/LLMProvider";

/**
 * Service responsible for generating tab completion suggestions using LLM
 */
export class TabSuggestionService {
    protected chain: RunnableSequence;

    constructor() {
        console.log("[TabSuggestionService] Initializing");
        try {
            const llm = LLMProvider.getInstance().getModel<ChatOpenAI>();
            console.log("[TabSuggestionService] Got LLM model");
            
            // Create a prompt template for generating suggestions
            const promptTemplate = PromptTemplate.fromTemplate(
                `Given the current line of text: "{text}", suggest 3 possible completions.
                The suggestions should be natural continuations of the text.
                Format your response as a comma-separated list of suggestions.`
            );
            console.log("[TabSuggestionService] Created prompt template");

            // Create a chain that will:
            // 1. Format the prompt with the input text
            // 2. Get completions from the LLM
            // 3. Parse the response into an array of suggestions
            this.chain = RunnableSequence.from([
                promptTemplate,
                llm,
                (response: BaseMessage) => {
                    const content = response.content.toString();
                    return content.split(',').map(s => s.trim());
                }
            ]);
            console.log("[TabSuggestionService] Chain created successfully");
        } catch (error) {
            console.error("[TabSuggestionService] Error initializing:", error);
            throw error;
        }
    }

    /**
     * Get suggestions for the given text
     * @param text The current line of text
     * @returns Array of suggestions
     */
    async getSuggestions(text: string): Promise<string[]> {
        console.log("[TabSuggestionService] Getting suggestions for:", text);
        try {
            if (!LLMProvider.getInstance().isConfigured()) {
                console.log("[TabSuggestionService] LLM not configured");
                return ['Please configure LLM in settings'];
            }

            console.log("[TabSuggestionService] Invoking chain");
            const suggestions = await this.chain.invoke({
                text
            });
            console.log("[TabSuggestionService] Got suggestions:", suggestions);

            return suggestions;
        } catch (error) {
            console.error('[TabSuggestionService] Error getting suggestions:', error);
            return ['Error getting suggestions'];
        }
    }
}
