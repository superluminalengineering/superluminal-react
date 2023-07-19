import WebSocket from 'isomorphic-ws';

import { decode } from 'base64-arraybuffer';

import ArrayBufferUtilities from '../utilities/ArrayBufferUtilities';
import SessionController from '../controllers/SessionController';

import { WebSocketMessagePath } from '../models/WebSocketMessagePath';

const maxFrameSize = (1 << 30);

export enum SLWebSocketState {
    Open, Closed
}

export interface SLWebSocketEventListener {
    onWebSocketStateChanged: (state: SLWebSocketState) => void;
}

export class SLWebSocket extends WebSocket {
    /** Holds messages while the connection is closed. */
    private buffer: ArrayBuffer[];
    private pingTimeout: NodeJS.Timeout | null = null;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private isReconnecting = false;
    private isCurrent = true;
    private slURL: string;
    private slListeners: SLWebSocketEventListener[] = [];
    private onReconnect: () => Promise<void>;
    slState: SLWebSocketState = SLWebSocketState.Closed;

    static instance: SLWebSocket;

    private constructor(url: string, buffer: ArrayBuffer[], listeners: SLWebSocketEventListener[], onReconnect: () => Promise<void>) {
        super(url);
        this.slURL = url;
        this.buffer = buffer;
        this.slListeners = listeners;
        this.onReconnect = onReconnect;
        this.onopen = this.onOpen;
        this.onclose = this.onClose;
        this.onerror = this.onError;
        this.onmessage = this.onMessage;
    }

    static initialize(url: string, onReconnect: () => Promise<void>) {
        if (SLWebSocket.instance !== undefined) { return; }
        SLWebSocket.initializeWithBufferAndListeners(url, [], [], onReconnect);
    }

    private static initializeWithBufferAndListeners(url: string, buffer: ArrayBuffer[], listeners: SLWebSocketEventListener[], onReconnect: () => Promise<void>) {
        const instance = new SLWebSocket(url, buffer, listeners, onReconnect);
        SLWebSocket.instance = instance;
    }

    addSLListener(listener: SLWebSocketEventListener) {
        const index = this.slListeners.indexOf(listener);
        if (index != -1) { return; }
        this.slListeners.push(listener);
    }

    removeSLListener(listener: SLWebSocketEventListener) {
        const index = this.slListeners.indexOf(listener);
        if (index == -1) { return; }
        this.slListeners.splice(index, 1);
    }

    private reconnect() {
        if (!this.reconnectTimeout) { return; }
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
        // Close the connection
        this.close(4000, "Reconnecting"); // 4000-4999 are reserved for application use
        // Stop pinging to avoid retaining the current web socket instance
        if (this.pingTimeout) { clearTimeout(this.pingTimeout); }
        this.pingTimeout = null;
        this.isCurrent = false;
        // Carry over the buffered events as well as the listeners to the new web socket
        // instance. The new web socket instance will automatically try to reconnect.
        SLWebSocket.initializeWithBufferAndListeners(this.slURL, this.buffer, this.slListeners, this.onReconnect);
        SLWebSocket.instance!.isReconnecting = true;
    }

    private onOpen(_: WebSocket.Event) {
        if (this.isReconnecting) {
            if (this.onReconnect) {
                this.onReconnect().then(() => {
                    if (!this.isCurrent) { return; }
                    this.slState = SLWebSocketState.Open;
                    this.slListeners.forEach((listener) => {
                        listener.onWebSocketStateChanged(SLWebSocketState.Open);
                    });
                    this.sendBufferedMessages();
                }).catch((error) => {
                    if (!this.isCurrent) { return; }
                    console.log(`[Web Socket] Reconnection failed due to error: ${error}`);
                    this.close(4000, `Reconnection failed due to error: ${error}`); // 4000-4999 are reserved for application use
                });
            } else {
                this.slState = SLWebSocketState.Open;
                this.slListeners.forEach((listener) => {
                    listener.onWebSocketStateChanged(SLWebSocketState.Open);
                });
                this.sendBufferedMessages();
            }
            this.isReconnecting = false;
        } else {
            this.slState = SLWebSocketState.Open;
            this.slListeners.forEach((listener) => {
                listener.onWebSocketStateChanged(SLWebSocketState.Open);
            });
            this.sendBufferedMessages();
        }
        this.sendPing(); // Start the ping loop
    }

    slSend(path: WebSocketMessagePath, payload: any) {
        const token = SessionController.getInstance().authToken;
        if (!token) { return; }
        const event = { ...payload, ...{ path: path, token: token } };
        const base64EncodedEvent = btoa(JSON.stringify(event));
        const bytes = decode(base64EncodedEvent)
        this.sendOrBuffer(bytes);
    }

    private sendOrBuffer(message: ArrayBuffer) {
        if (this.readyState === WebSocket.OPEN) {
            const chunkCount = Math.ceil(message.byteLength / maxFrameSize);
            for (let i = 0; i < chunkCount; i++) {
                const chunk = message.slice(i * maxFrameSize, Math.min((i+1) * maxFrameSize, message.byteLength));
                const isLastChunk = (i == chunkCount-1);
                this.send(chunk, { fin: isLastChunk });
            }
        } else {
            // The connection is closed; buffer the message
            console.log('[Web Socket] Connection closed. Buffering message and attempting to re-open...');
            this.buffer.push(message);
            // Try to reconnect after a short delay
            if (this.readyState !== WebSocket.CONNECTING) {
                if (this.reconnectTimeout) { return; }
                this.reconnectTimeout = setTimeout(() => {
                    this.reconnect();
                }, 2500);
            }
        }
    }

    private sendBufferedMessages() {
        if (this.buffer.length == 0) { return; }
        while (this.buffer.length > 0) {
            console.log(`[Web Socket] Sending buffered message (${this.buffer.length} left)`)
            // Send the messages in the order that they were put in the buffer
            const message = this.buffer.shift();
            if (!message) { continue; }
            this.sendOrBuffer(message);
        }
    }

    private onMessage(message: WebSocket.MessageEvent) {
        const data = message.data;
        if (data instanceof Blob) {
            data.arrayBuffer().then((arrayBuffer) => {
                this.receive(ArrayBufferUtilities.toBase64(arrayBuffer));
            });
        } else if (typeof data === 'string') {
            if (data == 'pong') { return }
            console.log('Received unexpected string message from WebSocket:', data)
        } else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
            this.receive(ArrayBufferUtilities.toBase64(data));
        } else {
            console.log('Received unexpected content from WebSocket:', data)
        }
    }

    private receive(base64EncodedData: string) {
        const json = JSON.parse(atob(base64EncodedData));
        console.log(`[Web Socket] Received web socket message: ${json}`);
    }

    private onError(error: WebSocket.ErrorEvent) {
        console.log(`[Web Socket] Error: ${error.message}.`);
    }

    private onClose(e: WebSocket.CloseEvent) {
        this.slState = SLWebSocketState.Closed;
        this.slListeners.forEach((listener) => {
            listener.onWebSocketStateChanged(SLWebSocketState.Closed);
        });
        if (this.pingTimeout) { clearTimeout(this.pingTimeout); }
        if (e.wasClean) {
            console.log(`[Web Socket] Connection closed cleanly, code=${e.code} reason=${e.reason}.`);
        } else {
            console.log('[Web Socket] Connection died.');
        }
    }

    disconnect() {
        // Status codes: https://www.rfc-editor.org/rfc/rfc6455.html#section-7.4.1
        // > 1000 indicates a normal closure, meaning that the purpose for which the connection was established has been fulfilled.
        // The browser socket does not accept anything other than 1000, or 3000-4999.
        this.close(1000, 'WebSocket was disconnected by the client.');
    }

    private sendPing() {
        if (this.pingTimeout) { clearTimeout(this.pingTimeout); }
        if (this.readyState === WebSocket.OPEN) {
            this.send('ping', { fin: true }) // Custom ping as browser WebSocket does not support native ping
        } else {
            // Try to reconnect after a short delay
            if (this.readyState !== WebSocket.CONNECTING) {
                if (this.reconnectTimeout) { return; }
                this.reconnectTimeout = setTimeout(() => {
                    this.reconnect();
                }, 2500);
            }
        }
        this.pingTimeout = setTimeout(() => {
            this.sendPing();
        }, 2500);
    }
}