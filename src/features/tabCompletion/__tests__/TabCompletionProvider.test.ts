import { App, Editor, EditorPosition, TFile, EditorSuggestContext, EditorSuggestTriggerInfo } from 'obsidian';
import TabCompletionProvider from '../TabCompletionProvider';
import { TabSuggestionService } from '../TabSuggestionService';
import { LLMProvider } from '../../../services/LLMProvider';
import { RunnableSequence } from "@langchain/core/runnables";

// Tell Jest to use the mock implementation for 'obsidian'
jest.mock('obsidian');

// Create a mock RunnableSequence
const mockRunnableSequence = {
    first: jest.fn(),
    middle: jest.fn(),
    last: jest.fn(),
    omitSequenceTags: jest.fn(),
    invoke: jest.fn(),
    batch: jest.fn(),
    stream: jest.fn(),
    _lc_kwargs: {},
    _lc_namespace: ['test'],
    pipe: jest.fn(),
    bind: jest.fn(),
} as unknown as RunnableSequence;

// Create a mock TabSuggestionService class
class MockTabSuggestionService extends TabSuggestionService {
    constructor() {
        super();
        this.chain = mockRunnableSequence;
    }

    async getSuggestions(text: string): Promise<string[]> {
        return ['suggestion 1', 'suggestion 2', 'suggestion 3'];
    }
}

// Create an error throwing mock service
class ErrorMockTabSuggestionService extends TabSuggestionService {
    constructor() {
        super();
        this.chain = mockRunnableSequence;
    }

    async getSuggestions(text: string): Promise<string[]> {
        throw new Error('Service Error');
    }
}

// Mock the TabSuggestionService module
jest.mock('../TabSuggestionService', () => {
    return {
        TabSuggestionService: jest.fn().mockImplementation(() => new MockTabSuggestionService())
    };
});

// Mock LLMProvider
jest.mock('../../../services/LLMProvider', () => {
    return {
        LLMProvider: {
            getInstance: jest.fn().mockReturnValue({
                isConfigured: jest.fn().mockReturnValue(true),
                getModel: jest.fn()
            })
        }
    };
});

// Mock the plugin using the mocked App
const mockPlugin = {
    app: new App(),
    settings: {
        enableTabCompletion: true,
        llmProvider: {
            provider: 'openai' as const,
            model: 'gpt-3.5-turbo',
            apiKey: 'test-key'
        }
    },
    saveSettings: jest.fn()
};

// Factory function for mock Editor instances
const mockEditorInstance = (): Editor => ({
    getLine: jest.fn().mockReturnValue(''),
    replaceRange: jest.fn(),
    setCursor: jest.fn(),
    getCursor: jest.fn().mockReturnValue({ line: 0, ch: 0 }),
    // Add other methods if needed by type, cast via unknown
    listSelections: jest.fn(),
    getSelection: jest.fn(),
    getRange: jest.fn(),
    replaceSelection: jest.fn(),
    focus: jest.fn(),
    blur: jest.fn(),
    getScrollInfo: jest.fn(),
    scrollTo: jest.fn(),
    scrollIntoView: jest.fn(),
    undo: jest.fn(),
    redo: jest.fn(),
    exec: jest.fn(),
    transaction: jest.fn(),
    wordAt: jest.fn(),
    posToOffset: jest.fn(),
    offsetToPos: jest.fn(),
    getDoc: jest.fn(), // Added potentially required methods
    refresh: jest.fn(),
    getValue: jest.fn(),
    setValue: jest.fn(),
    getMode: jest.fn(),
    getCursorBuffer: jest.fn(),
    getCursorCoords: jest.fn(),
    getCharacterCoords: jest.fn(),
    coordsChar: jest.fn(),
    cursorCoords: jest.fn(),
    getIndent: jest.fn(),
    lineCount: jest.fn().mockReturnValue(1),
    setLine: jest.fn(),
    getLineHandle: jest.fn(),
    getLineNumber: jest.fn(),
    cm: {} as any // Add dummy cm if required by type
} as unknown as Editor);

// Factory function for mock TFile instances
const mockTFileInstance = (path: string = 'test.md'): TFile => ({
    path: path,
    name: path.split('/').pop() || '',
    basename: path.split('/').pop()?.split('.')[0] || '',
    extension: path.split('.').pop() || '',
    stat: { mtime: Date.now(), ctime: Date.now(), size: 0 },
    vault: {} as any,
    parent: null,
} as unknown as TFile);

describe('TabCompletionProvider', () => {
    let provider: TabCompletionProvider;
    let editor: Editor;
    let file: TFile;
    let mockContext: EditorSuggestContext;

    beforeEach(() => {
        // Clean up any existing event listeners
        document.removeEventListener('keydown', provider?.['handleTabKey'].bind(provider));
        
        // Instantiate provider with the mocked plugin
        provider = new TabCompletionProvider(mockPlugin as any);
        // Use factory functions to create mock instances
        editor = mockEditorInstance();
        file = mockTFileInstance();
        mockContext = {
            start: { line: 0, ch: 0 },
            end: { line: 0, ch: 5 },
            query: 'test',
            editor: mockEditorInstance(),
            file: mockTFileInstance()
        };
        // Reset Jest mocks
        jest.clearAllMocks();
    });

    afterEach(() => {
        // Clean up event listener
        document.removeEventListener('keydown', provider?.['handleTabKey'].bind(provider));
    });

    describe('onTrigger', () => {
        const cursor: EditorPosition = { line: 0, ch: 5 };

        it('should return null when tab completion is disabled', () => {
            const disabledPlugin = {
                ...mockPlugin,
                settings: { ...mockPlugin.settings, enableTabCompletion: false }
            };
            provider = new TabCompletionProvider(disabledPlugin as any);

            const result = provider.onTrigger(cursor, editor, file);
            expect(result).toBeNull();
        });

        it('should return trigger info even when LLM is not configured (using mocks)', () => {
            const noLLMPlugin = {
                ...mockPlugin,
                settings: { ...mockPlugin.settings, enableTabCompletion: true, llmProvider: undefined }
            };
            provider = new TabCompletionProvider(noLLMPlugin as any);
            (editor.getLine as jest.Mock).mockReturnValue('test line'); // Mock editor line

            const result = provider.onTrigger(cursor, editor, file);
            expect(result).toEqual({
                start: cursor,
                end: cursor,
                query: 'test '
            });
            expect(editor.getLine).toHaveBeenCalledWith(cursor.line);
        });

        it('should return trigger info when enabled and configured', () => {
            // Ensure the mocked getLine method is used
            (editor.getLine as jest.Mock).mockReturnValue('test line');

            const result = provider.onTrigger(cursor, editor, file);
            expect(result).toEqual({
                start: cursor,
                end: cursor,
                query: 'test '
            });
            expect(editor.getLine).toHaveBeenCalledWith(cursor.line);
        });
    });

    describe('getSuggestions', () => {
        const context: EditorSuggestContext = {
            start: { line: 0, ch: 0 },
            end: { line: 0, ch: 5 },
            query: 'test',
            editor: mockEditorInstance(),
            file: mockTFileInstance()
        };

        it('should return error message when LLM is not configured', async () => {
            const noLLMPlugin = {
                ...mockPlugin,
                settings: { ...mockPlugin.settings, llmProvider: undefined }
            };
            provider = new TabCompletionProvider(noLLMPlugin as any);

            const suggestions = await provider.getSuggestions(context);
            expect(suggestions).toEqual(['Please configure LLM in settings']);
        });

        it('should return suggestions from service when configured', async () => {
            const suggestions = await provider.getSuggestions(context);
            expect(suggestions).toEqual(['suggestion 1', 'suggestion 2', 'suggestion 3']);
            expect(provider['suggestionsVisible']).toBe(true);
        });

        it('should handle service errors gracefully', async () => {
            // Mock the service to throw an error
            jest.mocked(TabSuggestionService).mockImplementationOnce(() => new ErrorMockTabSuggestionService());

            provider = new TabCompletionProvider(mockPlugin as any);
            const suggestions = await provider.getSuggestions(context);
            expect(suggestions).toEqual(['Error getting suggestions']);
        });
    });

    describe('renderSuggestion', () => {
        it('should render suggestion text', () => {
            // Create a mock element with a setText method
            const el = {
                setText: jest.fn()
            };
            provider.renderSuggestion('test suggestion', el as any);
            expect(el.setText).toHaveBeenCalledWith('test suggestion');
        });
    });

    describe('selectSuggestion', () => {
        const suggestion = 'Test Suggestion';
        const cursor = { line: 0, ch: 5 };

        beforeEach(() => {
            (provider as any).context = mockContext;
            // Ensure applySuggestion is mockable (it's protected)
            (provider as any).applySuggestion = jest.fn();
            // Set up suggestions state
            provider['currentSuggestions'] = ['Test Suggestion', 'Another Suggestion'];
            provider['suggestionsVisible'] = true;
        });

        it('should apply suggestion on Tab key', () => {
            const evt = new KeyboardEvent('keydown', { key: 'Tab' });

            provider.selectSuggestion(suggestion, evt);
            expect(provider['applySuggestion']).toHaveBeenCalledWith(suggestion);
        });

        it('should close and dispatch Enter event on Enter key', () => {
            const mockTarget = { dispatchEvent: jest.fn() };
            const evt = new KeyboardEvent('keydown', { key: 'Enter' });
            Object.defineProperty(evt, 'target', { value: mockTarget });

            provider.selectSuggestion(suggestion, evt);

            expect(mockTarget.dispatchEvent).toHaveBeenCalledTimes(1);
            const dispatchedEvent = mockTarget.dispatchEvent.mock.calls[0][0] as KeyboardEvent;
            expect(dispatchedEvent.key).toBe('Enter');
            expect(dispatchedEvent.code).toBe('Enter');
            expect(dispatchedEvent.bubbles).toBe(true);
            expect(dispatchedEvent.cancelable).toBe(true);
        });
    });

    describe('handleTabKey', () => {
        beforeEach(() => {
            // Set up the provider state
            provider['currentSuggestions'] = ['First Suggestion', 'Second Suggestion'];
            provider['suggestionsVisible'] = true;
            (provider as any).applySuggestion = jest.fn();
            jest.spyOn(provider, 'close');
        });

        it('should handle Tab key when suggestions are visible', () => {
            const evt = new KeyboardEvent('keydown', { 
                key: 'Tab',
                bubbles: true,
                cancelable: true 
            });
            const preventDefaultSpy = jest.spyOn(evt, 'preventDefault');
            const stopPropagationSpy = jest.spyOn(evt, 'stopPropagation');

            // Simulate the tab key event
            document.dispatchEvent(evt);

            // Verify the event was handled correctly
            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(stopPropagationSpy).toHaveBeenCalled();
            expect(provider['applySuggestion']).toHaveBeenCalledWith('First Suggestion');
            expect(provider.close).toHaveBeenCalled();
        });

        it('should not handle Tab key when suggestions are not visible', () => {
            provider['suggestionsVisible'] = false;
            const evt = new KeyboardEvent('keydown', { key: 'Tab' });
            const preventDefaultSpy = jest.spyOn(evt, 'preventDefault');

            document.dispatchEvent(evt);

            expect(preventDefaultSpy).not.toHaveBeenCalled();
            expect(provider['applySuggestion']).not.toHaveBeenCalled();
            expect(provider.close).not.toHaveBeenCalled();
        });

        it('should not handle Tab key when no suggestions are available', () => {
            provider['currentSuggestions'] = [];
            const evt = new KeyboardEvent('keydown', { key: 'Tab' });
            const preventDefaultSpy = jest.spyOn(evt, 'preventDefault');

            document.dispatchEvent(evt);

            expect(preventDefaultSpy).not.toHaveBeenCalled();
            expect(provider['applySuggestion']).not.toHaveBeenCalled();
            expect(provider.close).not.toHaveBeenCalled();
        });
    });
});
