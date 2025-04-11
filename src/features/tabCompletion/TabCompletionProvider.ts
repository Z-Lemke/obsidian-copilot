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
		this.currentSuggestions = ["suggestion 1", "suggestion 2", "suggestion 3"];
		return this.currentSuggestions;
	}

	// Render the suggestion in the UI
	renderSuggestion(suggestion: string, el: HTMLElement): void {
		el.setText(suggestion);
	}

	selectSuggestion(suggestion: string, evt: MouseEvent | KeyboardEvent): void {
		if (evt instanceof KeyboardEvent) {
			if (evt.key === "Tab") {
				this.applySuggestion(suggestion);
				return;
			} else if (evt.key === "Enter") {
				this.close();
				
				const enterEvent = new KeyboardEvent('keydown', {
					key: 'Enter',
					code: 'Enter',
					keyCode: 13,
					which: 13,
					bubbles: true,
					cancelable: true
				});
				evt.target?.dispatchEvent(enterEvent);
			} else {
				this.close();
			}
			return;
		}

		// Handle mouse clicks normally
		this.applySuggestion(suggestion);
	}

	// Helper to apply the suggestion
	private applySuggestion(suggestion: string): void {
		const { context } = this;
		if (context) {
			const editor = context.editor;
			// Insert the suggestion at the cursor
			editor.replaceRange(
				suggestion,
				context.start,
				context.end
			);
			// Move cursor to the end of the inserted suggestion
			const newPosition = {
				line: context.start.line,
				ch: context.start.ch + suggestion.length
			};
			editor.setCursor(newPosition);
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
	
}
