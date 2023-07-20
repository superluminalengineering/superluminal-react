import Server from "../networking/Server";

import UUIDUtilities from "../utilities/UUIDUtilities";

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
                    if (!this.authToken) {
                        console.log("Couldn't connect web socket due to missing auth token.")
                        return;
                    }
                    SLWebSocket.instance.slSend('connect-socket', this.authToken, {});
                }, 0);
            });
    }

    uploadData(file: File) {
        if (!this.user) { return; }
        const _ = Server.uploadData(file, this.user.id, this.projectID);
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

    onWebSocketEvent(json: JSON) {
        const path = json['path'];
        if (!path) { return; }
        switch (path) {
            case 'message': this.onMessageReceived(json); break;
            case 'update-table': break; // TODO: Implement
            case 'update-session-state': this.onSessionStateUpdated(json); break;
            case 'table-page': break; // TODO: Implement
            case 'update-assistant-reply-state': this.onAssistantStateUpdated(json); break;
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
        if (!sessionState) { return; }
        this.sessionState = sessionState;
        console.log(`Session state: ${sessionState}`);
        this.listeners.forEach((listener) => listener.onSessionStateUpdated(sessionState));
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

    addChatMessage(message: ChatMessage) {
        this.chatMessages = this.chatMessages.filter((chatMessage) => !chatMessage.isEphemeral);
        this.chatMessages.push(message);
        this.listeners.forEach((listener) => listener.onChatMessagesUpdated(this.chatMessages));
    }

    onReconnectWebSocket(): Promise<void> {
        return Promise.resolve(); // TODO: Implement
    }
}

export default SessionController;