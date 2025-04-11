import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";

export interface LLMProviderConfig {
    provider: "openai";
    model: string;
    apiKey: string;
}

export class TabCompletionWorkflow {
    private llm: ChatOpenAI;

    constructor(config: LLMProviderConfig) {
        this.llm = new ChatOpenAI({
            modelName: config.model,
            openAIApiKey: config.apiKey,
            temperature: 0.7,
        });
    }

    async getSuggestions(currentText: string): Promise<string[]> {
        const prompt = PromptTemplate.fromTemplate(
            `Given the following text, provide 3 highly likely continuations that are between 2-5 words long. 
            Format your response as a JSON array of strings.
            Text: {text}
            Continuations:`
        );

        const chain = RunnableSequence.from([
            prompt,
            this.llm,
            (response: BaseMessage) => {
                try {
                    const suggestions = JSON.parse(response.content as string);
                    return Array.isArray(suggestions) ? suggestions.slice(0, 3) : [];
                } catch {
                    return [];
                }
            }
        ]);

        try {
            return await chain.invoke({ text: currentText });
        } catch (error) {
            console.error("Error getting suggestions:", error);
            return [];
        }
    }
}
