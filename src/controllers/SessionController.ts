import Server from "../networking/Server";

import UUIDUtilities from "../utilities/UUIDUtilities";

import { AssistantState } from "../models/AssistantState";
import { ChatMessage } from "../models/ChatMessage";
import { SessionState } from "../models/SessionState";
import { SLWebSocket, SLWebSocketEventListener } from "../networking/WebSocket";
import { TablePage, isTablePage } from "../models/TableInfo";

export interface SessionControllerEventListener {
    onSessionStateUpdated?: (sessionState: SessionState, error: string | null) => void;
    onAssistantStateUpdated?: (assistantState: AssistantState) => void;
    onChatMessagesUpdated?: (chatMessages: ChatMessage[]) => void;
    onTablePageReceived?: (page: TablePage) => void;
}

class SessionController implements SLWebSocketEventListener {
    listeners: SessionControllerEventListener[] = [];
    projectID: string = "main";
    sessionState: SessionState = 'initializing';
    assistantState: AssistantState = 'idle';
    error: string | null = null;
    authToken: string | null = null;
    chatMessages: ChatMessage[] = [];

    private static instance: SessionController;

    private constructor() {
        this.onWebSocketEvent = this.onWebSocketEvent.bind(this);
        this.onReconnectWebSocket = this.onReconnectWebSocket.bind(this);
    }

    static getInstance(): SessionController {
        if (!SessionController.instance) {
            const instance = new SessionController();
            SessionController.instance = instance;
        }
        return SessionController.instance;
    }

    addListener(listener: SessionControllerEventListener) {
        const index = this.listeners.indexOf(listener);
        if (index != -1) { return; }
        this.listeners.push(listener);
    }

    removeListener(listener: SessionControllerEventListener) {
        const index = this.listeners.indexOf(listener);
        if (index == -1) { return; }
        this.listeners.splice(index, 1);
    }

    initialize() {
        if (!this.authToken) {
            console.error("Couldn't get session due to missing auth token.")
            return
        }
        Server.getSession(this.authToken)
            .then((response) => {
                this.sessionState = response.session_state;
                this.error = response.error;
                this.listeners.forEach((listener) => listener.onSessionStateUpdated?.(response.session_state, response.error));
                this.chatMessages = response.chat_history;
                this.listeners.forEach((listener) => listener.onChatMessagesUpdated?.(response.chat_history));
            })
            .then(() => {
                setTimeout(() => {
                    if (!this.authToken) {
                        console.error("Couldn't connect web socket due to missing auth token.")
                        return;
                    }
                    this.getWebSocket().slSend('connect-socket', this.authToken, {});
                }, 0);
            });
    }

    sendChatMessage(message: string) {
        if (!this.authToken) { return console.error("Couldn't send chat message due to missing auth token."); }
        if (this.sessionState != 'ready') { return console.error("Couldn't send chat message due to session state not being ready."); }
        if (this.assistantState != 'idle') { return console.error("Couldn't send chat message due to assistant state not being idle."); }
        this.getWebSocket().slSend('send-message', this.authToken, { message: message });
        this.addChatMessage({
            id: UUIDUtilities.unsecureUUID(),
            sender: 'user',
            content: {
                text: message
            },
            isEphemeral: false
        });
    }

    getTablePage(tableID: string, offset: number, count: number) {
        if (!this.authToken) { return console.error("Couldn't get table page due to missing auth token."); }
        this.getWebSocket().slSend('get-table-page', this.authToken, { table_id: tableID, offset: offset, count: count });
    }

    private getWebSocket(): SLWebSocket {
        if (SLWebSocket.instance) {
            return SLWebSocket.instance;
        } else {
            const webSocket = SLWebSocket.initialize('wss://app.getluminal.com', this.onReconnectWebSocket);
            webSocket.addSLListener(this);
            return webSocket;
        }
    }

    onWebSocketEvent(json: any) {
        const path = json['path'];
        if (!path) { return; }
        switch (path) {
            case 'message': this.onMessageReceived(json); break;
            case 'update-session-state': this.onSessionStateUpdated(json); break;
            case 'update-assistant-reply-state': this.onAssistantStateUpdated(json); break;
            case 'table-page': this.onTablePageReceived(json); break;
            default: break;
        }
    }

    private onMessageReceived(json: any) {
        const id = json['id'];
        const content = json['content'];
        const sender = json['sender'];
        if (!id || !content || !sender) { return; }
        if (sender == 'assistant') {
            this.onAssistantStateUpdated({ assistant_reply_state: 'idle' })
        }
        this.addChatMessage({ id: id, sender: sender, content: content, isEphemeral: false });
    }

    private onSessionStateUpdated(json: any) {
        const sessionState: SessionState = json['session_state'];
        const error: string | null = json['error'];
        if (!sessionState) { return; }
        this.sessionState = sessionState;
        this.error = error;
        console.log(`Session state: ${sessionState}` + (error ? ` (${error})` : ''));
        this.listeners.forEach((listener) => listener.onSessionStateUpdated?.(sessionState, error));
    }

    private onAssistantStateUpdated(json: any) {
        const assistantState: AssistantState = json['assistant_reply_state'];
        if (!assistantState) { return; }
        this.assistantState = assistantState;
        this.listeners.forEach((listener) => listener.onAssistantStateUpdated?.(assistantState));
        // Add a matching ephemeral chat message
        let message: string | null = null;
        switch (assistantState) {
            case 'idle': break;
            case 'analyzing-data': message = 'Analyzing data...'; break;
            case 'analyzing-task': message = 'Analyzing task...'; break;
            case 'generating-code': message = 'Generating code...'; break;
            case 'executing-code': message = 'Executing code...'; break;
            case 'generating-explanation': message = 'Generating explanation...'; break;
            case 'debugging-code': message = 'Debugging code...'; break;
            case 'generating-subtasks': message = 'Generating subtasks...'; break;
        }
        if (!message) { return; }
        this.addChatMessage({
            id: UUIDUtilities.unsecureUUID(),
            sender: 'assistant',
            content: {
                text: message
            },
            isEphemeral: true
        });
    }

    private onTablePageReceived(json: any) {
        const page = json.page
        if (!isTablePage(page)) { return }
        this.listeners.forEach((listener) => listener.onTablePageReceived?.(page));
    }

    private addChatMessage(message: ChatMessage) {
        this.chatMessages = this.chatMessages.filter((chatMessage) => !chatMessage.isEphemeral);
        this.chatMessages.push(message);
        this.listeners.forEach((listener) => listener.onChatMessagesUpdated?.(this.chatMessages));
    }

    private onReconnectWebSocket(): Promise<void> {
        return Promise.resolve(); // TODO: Implement
    }
}

export default SessionController;