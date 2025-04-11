import { Editor, EditorPosition, EditorSuggest, EditorSuggestContext, EditorSuggestTriggerInfo, TFile } from 'obsidian';
import MyPlugin from '../../../main';
import { TabSuggestionService } from './TabSuggestionService';

// Tab completion provider class
export default class TabCompletionProvider extends EditorSuggest<string> {
	plugin: MyPlugin;
	private suggestionsVisible: boolean = false;
	private currentSuggestions: string[] = [];
	private suggestionService: TabSuggestionService | null = null;

	constructor(plugin: MyPlugin) {
		super(plugin.app);
		console.log("[TabCompletionProvider] Initializing");
		this.plugin = plugin;
		
		// Initialize suggestion service if LLM is configured
		if (this.plugin.settings.llmProvider) {
			this.suggestionService = new TabSuggestionService();
			console.log("[TabCompletionProvider] Created TabSuggestionService");
		}

		document.addEventListener('keydown', this.handleTabKey.bind(this), true);
	}

	// Determine when to trigger the suggestion
	onTrigger(cursor: EditorPosition, editor: Editor, file: TFile): EditorSuggestTriggerInfo | null {
		console.log("[TabCompletionProvider] Trigger check at position:", cursor);
		
		// Only trigger if tab completion is enabled in settings
		if (!this.plugin.settings.enableTabCompletion) {
			console.log("[TabCompletionProvider] Tab completion disabled in settings");
			return null;
		}

		// Get the current line of text
		const line = editor.getLine(cursor.line);
		const textBeforeCursor = line.slice(0, cursor.ch);

		console.log("[TabCompletionProvider] Current line context:", {
			fullLine: line,
			beforeCursor: textBeforeCursor
		});

		// Only trigger if there's text on the line
		if (textBeforeCursor.trim().length === 0) {
			console.log("[TabCompletionProvider] No text before cursor, not triggering");
			return null;
		}

		return {
			start: { line: cursor.line, ch: 0 },
			end: cursor,
			query: textBeforeCursor
		};
	}

	// Generate suggestions
	async getSuggestions(context: EditorSuggestContext): Promise<string[]> {
		console.log("[TabCompletionProvider] Getting suggestions for context:", context.query);
		this.suggestionsVisible = true;
		
		if (!this.suggestionService) {
			this.currentSuggestions = ["Please configure LLM in settings"];
			console.log("[TabCompletionProvider] No suggestion service available");
			return this.currentSuggestions;
		}

		try {
			this.currentSuggestions = await this.suggestionService.getSuggestions(context.query);
			console.log("[TabCompletionProvider] Received suggestions:", this.currentSuggestions);
			return this.currentSuggestions;
		} catch (error) {
			console.error("[TabCompletionProvider] Error getting suggestions:", error);
			this.currentSuggestions = ["Error getting suggestions"];
			return this.currentSuggestions;
		}
	}

	// Render the suggestion in the UI
	renderSuggestion(suggestion: string, el: HTMLElement): void {
		console.log("[TabCompletionProvider] Rendering suggestion:", suggestion);
		el.setText(suggestion);
	}

	selectSuggestion(suggestion: string, evt: MouseEvent | KeyboardEvent): void {
		console.log("[TabCompletionProvider] Suggestion selected:", suggestion);
		if (evt instanceof KeyboardEvent) {
			if (evt.key === "Tab") {
				this.applySuggestion(suggestion);
				return;
			} if (evt.key === "Enter") {
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
			console.log("[TabCompletionProvider] Applying suggestion with range:", { start: context.start, end: context.end });
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

	private handleTabKey(evt: KeyboardEvent): void {
		console.log("[TabCompletionProvider] Handling Tab key");
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