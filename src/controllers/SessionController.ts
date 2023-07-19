import Server from "../networking/Server";

import { ChatMessage } from "../models/ChatMessage";
import { SessionState } from "../models/SessionState";
import { SLWebSocket } from "../networking/WebSocket";

export interface SessionControllerEventListener {
    onChatMessagesUpdated: (chatMessages: ChatMessage[]) => void;
}

class SessionController {
    listeners: SessionControllerEventListener[] = [];
    sessionState: SessionState = 'initializing';
    authToken: string | null = null;

    private static instance: SessionController;

    private constructor() { }

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
        Server.createSession("test_user_id", "test_project_id", false, false, 100)
            .then((response) => {
                this.sessionState = response.session_state;
                this.authToken = response.token;
                // this.listeners.forEach((listener) => listener.onChatMessagesUpdated(response.chat_history));
            })
            .then(() => {
                SLWebSocket.initialize('wss://app.getluminal.com', this.onReconnectWebSocket);
                SLWebSocket.instance.slSend('connect-socket', {});
            })
    }

    sendChatMessage(message: string) {
        // TODO: Implement
    }

    onReconnectWebSocket(): Promise<void> {
        return Promise.resolve(); // TODO: Implement
    }
}

export default SessionController;