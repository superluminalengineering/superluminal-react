import SessionController from "../controllers/SessionController";

import { ChatMessage } from "../models/ChatMessage";
import { SessionState } from "../models/SessionState";

class Server {

    static baseURL = "https://app.getluminal.com";

    static getSession(): Promise<{ session_state: SessionState, chat_history: ChatMessage[] }> {
        const authToken = SessionController.getInstance().authToken;
        if (!authToken) {
            return Promise.reject("Couldn't get session due to missing auth token.");
        }
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