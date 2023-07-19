import Server from "../networking/Server";

import { ChatMessage } from "../models/ChatMessage";
import { SessionState } from "../models/SessionState";
import { SLWebSocket, SLWebSocketEventListener } from "../networking/WebSocket";

export interface SessionControllerEventListener {
    onSessionStateUpdated: (sessionState: SessionState) => void;
    onChatMessagesUpdated: (chatMessages: ChatMessage[]) => void;
}

class SessionController implements SLWebSocketEventListener {
    listeners: SessionControllerEventListener[] = [];
    user: { id: string, name: string } | null = null;
    projectID: string = "main";
    sessionState: SessionState = 'initializing';
    authToken: string | null = null;
    chatMessages: ChatMessage[] = [];

    private static instance: SessionController;

    private constructor() {
        this.onWebSocketEvent = this.onWebSocketEvent.bind(this);
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

    initialize(user: { id: string, name: string }) {
        this.user = user;
        Server.createSession(user.id, this.projectID, false, false, 100)
            .then((response) => {
                this.authToken = response.token;
                this.sessionState = response.session_state;
                this.listeners.forEach((listener) => listener.onSessionStateUpdated(response.session_state));
                this.chatMessages = response.chat_history;
                this.listeners.forEach((listener) => listener.onChatMessagesUpdated(response.chat_history));
            })
            .then(() => {
                SLWebSocket.initialize('wss://app.getluminal.com', this.onReconnectWebSocket);
                SLWebSocket.instance.addSLListener(this);
                setTimeout(() => {
                    SLWebSocket.instance.slSend('connect-socket', this.authToken, {});
                }, 0);
            })
    }

    uploadData(file: File) {
        if (this.user == null) { return; }
        const _ = Server.uploadData(file, this.user.id, this.projectID);
    }

    sendChatMessage(message: string) {
        // TODO: Implement
    }

    onWebSocketEvent(json: JSON) {
        const path = json['path'];
        if (!path) { return; }
        switch (path) {
            case 'message': break;
            case 'update-table': break;
            case 'update-session-state':
                const sessionState = json['session_state'];
                if (!sessionState) { return; }
                this.sessionState = sessionState;
                this.listeners.forEach((listener) => listener.onSessionStateUpdated(sessionState));
            case 'table-page': break;
            case 'update-assistant-reply-state': break;
            default: break;
        }
    }

    onReconnectWebSocket(): Promise<void> {
        return Promise.resolve(); // TODO: Implement
    }
}

export default SessionController;