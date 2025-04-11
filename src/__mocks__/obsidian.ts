export class Editor {
    private cm: any;
    private container: any;

    constructor() {
        this.cm = null;
        this.container = null;
    }

    getLine(line: number): string {
        return '';
    }

    replaceRange(replacement: string, from: EditorPosition, to: EditorPosition): void {}

    setCursor(pos: EditorPosition): void {}
}

export class App {
    workspace: any;
    constructor() {
        this.workspace = {};
    }
}

export class EditorSuggest<T> {
    protected app: App;
    context: EditorSuggestContext | null = null;

    constructor(app: App) {
        this.app = app;
    }
    
    open(): void {}
    close(): void {}
}

export interface EditorPosition {
    line: number;
    ch: number;
}

export class TFile {
    path: string;
    basename: string;
    extension: string;
    stat: { mtime: number; ctime: number; size: number };
    vault: any;
    parent: any;

    constructor(path: string = '') {
        this.path = path;
        this.basename = path.split('/').pop()?.split('.')[0] || '';
        this.extension = path.split('.').pop() || '';
        this.stat = {
            mtime: Date.now(),
            ctime: Date.now(),
            size: 0
        };
        this.vault = {};
        this.parent = null;
    }

    static create(path: string): TFile {
        const file = new TFile();
        file.path = path;
        file.basename = path.split('/').pop()?.split('.')[0] || '';
        file.extension = path.split('.').pop() || '';
        return file;
    }
}

export interface EditorSuggestContext {
    start: EditorPosition;
    end: EditorPosition;
    query: string;
    editor: Editor;
    file: TFile;
}

export interface EditorSuggestTriggerInfo {
    start: EditorPosition;
    end: EditorPosition;
    query: string;
}
