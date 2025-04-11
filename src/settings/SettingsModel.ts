export interface CopilotSettings {
	enableTabCompletion: boolean;
	llmProvider?: {
		provider: "openai";
		model: string;
		apiKey: string;
	};
}

export const DEFAULT_SETTINGS: CopilotSettings = {
	enableTabCompletion: true,
	llmProvider: undefined
};
