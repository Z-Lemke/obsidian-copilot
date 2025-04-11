import { App, PluginSettingTab, Setting, TextComponent } from 'obsidian';
import MyPlugin from '../../main';
import { CopilotSettings } from './SettingsModel';

export default class CopilotSettingsTab extends PluginSettingTab {
	plugin: MyPlugin;
	private apiKeyInput: TextComponent;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
				
		new Setting(containerEl)
			.setName('Enable Tab Completion')
			.setDesc('Enable the beta tab completion feature')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableTabCompletion)
				.onChange(async (value) => {
					this.plugin.settings.enableTabCompletion = value;
					await this.plugin.saveSettings();
				}));

		const llmSection = containerEl.createEl('div');
		llmSection.createEl('h3', { text: 'LLM Configuration' });

		new Setting(llmSection)
			.setName('LLM Provider')
			.setDesc('Select your LLM provider')
			.addDropdown(dropdown => dropdown
				.addOption('openai', 'OpenAI')
				.setValue(this.plugin.settings.llmProvider?.provider || 'openai')
				.onChange(async (value) => {
					if (!this.plugin.settings.llmProvider) {
						this.plugin.settings.llmProvider = {
							provider: 'openai',
							model: 'gpt-3.5-turbo',
							apiKey: ''
						};
					}
					await this.plugin.saveSettings();
				}));

		new Setting(llmSection)
			.setName('Model')
			.setDesc('Select the model to use')
			.addDropdown(dropdown => dropdown
				.addOption('gpt-4o-mini', 'GPT-4O Mini')
				.addOption('gpt-4o', 'GPT-4O')
				.setValue(this.plugin.settings.llmProvider?.model || 'gpt-4o-mini')
				.onChange(async (value) => {
					if (!this.plugin.settings.llmProvider) {
						this.plugin.settings.llmProvider = {
							provider: 'openai',
							model: value,
							apiKey: ''
						};
					} else {
						this.plugin.settings.llmProvider.model = value;
					}
					await this.plugin.saveSettings();
				}));

		new Setting(llmSection)
			.setName('API Key')
			.setDesc('Enter your API key')
			.addText(text => {
				this.apiKeyInput = text;
				text.setPlaceholder('Enter API key')
					.setValue(this.plugin.settings.llmProvider?.apiKey || '')
					.onChange(async (value) => {
						if (!this.plugin.settings.llmProvider) {
							this.plugin.settings.llmProvider = {
								provider: 'openai',
								model: 'gpt-3.5-turbo',
								apiKey: value
							};
						} else {
							this.plugin.settings.llmProvider.apiKey = value;
						}
						await this.plugin.saveSettings();
					});
				text.inputEl.type = 'password';
			});
	}
}
