import SessionController from "../controllers/SessionController";

import { ChatMessage } from "../models/ChatMessage";
import { SessionState } from "../models/SessionState";

class Server {

    static baseURL = "https://app.getluminal.com";

    static getSession(authToken: string): Promise<{ session_state: SessionState, chat_history: ChatMessage[] }> {
        return fetch(`${Server.baseURL}/session`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
        })
        .then((response) => response.json())
        .catch((error) => console.log(`Couldn't get session due to error: ${error?.reason ?? error}`));
    }
}

export default Server;