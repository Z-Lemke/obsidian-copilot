import { App, PluginSettingTab, Setting } from 'obsidian';
import MyPlugin from '../../main';
import { CopilotSettings } from './SettingsModel';

export default class CopilotSettingsTab extends PluginSettingTab {
	plugin: MyPlugin;

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
	}
}
