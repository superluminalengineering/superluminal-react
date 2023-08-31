import Server from "../networking/Server";

import UUIDUtilities from "../utilities/UUIDUtilities";

import { ChatMessage } from "../models/ChatMessage";
import { SessionState } from "../models/SessionState";
import { SLWebSocket, SLWebSocketEventListener } from "../networking/WebSocket";
import { TablePage, isTablePage } from "../models/TableInfo";

export interface SessionControllerEventListener {
    onSessionStateUpdated?: (sessionState: SessionState, error: string | null) => void;
    onChatMessagesUpdated?: (chatMessages: ChatMessage[]) => void;
    onTablePageReceived?: (page: TablePage) => void;
}

class SessionController implements SLWebSocketEventListener {
    listeners: SessionControllerEventListener[] = [];
    projectID: string = "main";
    sessionState: SessionState = 'initializing';
    error: string | null = null;
    authToken: string | null = null;
    chatMessages: ChatMessage[] = [];

    private static instance: SessionController;

    private constructor() {
        this.onWebSocketEvent = this.onWebSocketEvent.bind(this);
        this.onReconnectWebSocket = this.onReconnectWebSocket.bind(this);
    }

    static getInstance(): SessionController {
        if (SessionController.instance == null) {
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
            console.log("Couldn't get session due to missing auth token.")
            return
        }
        SLWebSocket.initialize('wss://app.getluminal.com', this.onReconnectWebSocket);
        SLWebSocket.instance.addSLListener(this);
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
                        console.log("Couldn't connect web socket due to missing auth token.")
                        return;
                    }
                    SLWebSocket.instance.slSend('connect-socket', this.authToken, {});
                }, 0);
            });
    }

    sendChatMessage(message: string) {
        if (!this.authToken) { return; }
        SLWebSocket.instance.slSend('send-message', this.authToken, { message: message });
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
        if (!this.authToken) { return; }
        SLWebSocket.instance.slSend('get-table-page', this.authToken, { table_id: tableID, offset: offset, count: count });
    }

    onWebSocketEvent(json: JSON) {
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

    onMessageReceived(json: JSON) {
        const id = json['id'];
        const content = json['content'];
        const sender = json['sender'];
        if (!id || !content || !sender) { return; }
        this.addChatMessage({ id: id, sender: sender, content: content, isEphemeral: false });
    }

    onSessionStateUpdated(json: JSON) {
        const sessionState = json['session_state'];
        const error = json['error'];
        if (!sessionState) { return; }
        this.sessionState = sessionState;
        this.error = error;
        console.log(`Session state: ${sessionState}` + (error ? ` (${error})` : ''));
        this.listeners.forEach((listener) => listener.onSessionStateUpdated?.(sessionState, error));
    }

    onAssistantStateUpdated(json: JSON) {
        const state = json['assistant_reply_state'];
        if (!state) { return; }
        let message: string | null = null;
        switch (state) {
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

    onTablePageReceived(json: any) {
        const page = json.page
        if (!isTablePage(page)) { return }
        this.listeners.forEach((listener) => listener.onTablePageReceived?.(page));
    }

    addChatMessage(message: ChatMessage) {
        this.chatMessages = this.chatMessages.filter((chatMessage) => !chatMessage.isEphemeral);
        this.chatMessages.push(message);
        this.listeners.forEach((listener) => listener.onChatMessagesUpdated?.(this.chatMessages));
    }

    onReconnectWebSocket(): Promise<void> {
        return Promise.resolve(); // TODO: Implement
    }
}

export default SessionController;