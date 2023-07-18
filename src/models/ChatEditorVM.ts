export type ChatEditorVM = {
    version: number;
    editor: Object;
    messages: Message[];
}

export type Message = {
    id: string;
    sender: 'user' | 'assistant';
    content: TextContent | PlotContent;
    isEphemeral?: boolean
    timestamp: number;
}

export type TextContent = {
    text: string;
}

export type PlotContent = {
    plot: string;
}
