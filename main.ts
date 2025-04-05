import { App, Plugin } from 'obsidian';
import TabCompletionProvider from './src/features/tabCompletion/TabCompletionProvider';
import CopilotSettingsTab from './src/settings/CopilotSettingsTab';
import { CopilotSettings, DEFAULT_SETTINGS } from './src/settings/SettingsModel';

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

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
