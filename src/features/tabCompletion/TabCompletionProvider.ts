import { Editor, EditorPosition, EditorSuggest, EditorSuggestContext, EditorSuggestTriggerInfo, TFile } from 'obsidian';
import MyPlugin from '../../../main';

// Tab completion provider class
export default class TabCompletionProvider extends EditorSuggest<string> {
	plugin: MyPlugin;
	// Track if suggestions are currently being shown
	private suggestionsVisible: boolean = false;
	// Store current suggestions
	private currentSuggestions: string[] = [];

	constructor(plugin: MyPlugin) {
		super(plugin.app);
		this.plugin = plugin;
		
		// Add event listener for Tab key
		document.addEventListener('keydown', this.handleTabKey.bind(this), true);
	}

	// Determine when to trigger the suggestion
	onTrigger(cursor: EditorPosition, editor: Editor, file: TFile): EditorSuggestTriggerInfo | null {
		// Only trigger if tab completion is enabled in settings
		if (!this.plugin.settings.enableTabCompletion) {
			return null;
		}

		// Get the current line of text
		const line = editor.getLine(cursor.line);
		
		// For beta, we'll trigger on any character typed
		// In a real implementation, you might want to be more selective
		return {
			start: { line: cursor.line, ch: cursor.ch },
			end: { line: cursor.line, ch: cursor.ch },
			query: line.substring(0, cursor.ch)
		};
	}

	// Generate suggestions
	getSuggestions(context: EditorSuggestContext): string[] {
		// For beta, always return the same suggestion
		this.suggestionsVisible = true;
		this.currentSuggestions = ["completion recommendation"];
		return this.currentSuggestions;
	}

	// Render the suggestion in the UI
	renderSuggestion(suggestion: string, el: HTMLElement): void {
		el.setText(suggestion);
	}

	// Handle selection of a suggestion
	selectSuggestion(suggestion: string, evt: MouseEvent | KeyboardEvent): void {
		const { context } = this;
		if (context) {
			const editor = context.editor;
			// Insert the suggestion at the cursor
			editor.replaceRange(
				suggestion,
				context.start,
				context.end
			);
		}
		// Reset suggestion state
		this.suggestionsVisible = false;
	}
	
	// Override to track when suggestions are closed
	open(): void {
		super.open();
		this.suggestionsVisible = true;
	}
	
	// Override to track when suggestions are closed
	close(): void {
		super.close();
		this.suggestionsVisible = false;
	}
	
	// Custom handler for Tab key
	private handleTabKey(evt: KeyboardEvent): void {
		// Only handle Tab key when suggestions are visible
		if (evt.key === 'Tab' && this.suggestionsVisible && this.currentSuggestions.length > 0) {
			// Apply the first suggestion
			this.selectSuggestion(this.currentSuggestions[0], evt);
			// Prevent default tab behavior
			evt.preventDefault();
			evt.stopPropagation();
			// Close suggestions
			this.close();
		}
	}
}
