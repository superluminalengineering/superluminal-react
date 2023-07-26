import { TableInfo } from "./TableInfo";

export type ChatMessage = {
    id: string;
    sender: 'user' | 'assistant';
    content: TextContent | PlotContent | TableContent;
    isEphemeral: boolean;
}

export type TextContent = {
    text: string;
}

export type PlotContent = {
    plot: string;
}

export type TableContent = {
    table: TableInfo;
}
