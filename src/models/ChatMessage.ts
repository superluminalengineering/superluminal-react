
export type ChatMessage = {
    id: string;
    sender: 'user' | 'assistant';
    content: TextContent | PlotContent;
    isEphemeral: boolean;
}

export type TextContent = {
    text: string;
}

export type PlotContent = {
    plot: string;
}
