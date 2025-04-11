import { App, Plugin } from 'obsidian';
import TabCompletionProvider from './src/features/tabCompletion/TabCompletionProvider';
import CopilotSettingsTab from './src/settings/CopilotSettingsTab';
import { CopilotSettings, DEFAULT_SETTINGS } from './src/settings/SettingsModel';
import { LLMProvider } from './src/services/LLMProvider';

export default class MyPlugin extends Plugin {
	settings: CopilotSettings;
	tabCompletionProvider: TabCompletionProvider;

	async onload() {
		await this.loadSettings();

		// Register the tab completion provider
		this.tabCompletionProvider = new TabCompletionProvider(this);
		this.registerEditorSuggest(this.tabCompletionProvider);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new CopilotSettingsTab(this.app, this));
	}

	onunload() {
		// Clean up
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.configureLLMProvider();
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.configureLLMProvider();
	}

	private configureLLMProvider() {
		if (this.settings.llmProvider?.apiKey) {
			LLMProvider.getInstance().configure({
				provider: this.settings.llmProvider.provider,
				model: this.settings.llmProvider.model,
				apiKey: this.settings.llmProvider.apiKey
			});
		}
	}
}
