
import { ChatMessage } from "../models/ChatMessage";
import { SessionState } from "../models/SessionState";

type GetSessionResponse = {
    session_state: SessionState,
    error: string | null,
    chat_history: ChatMessage[]
}

class Server {

    static baseURL = "https://app.getluminal.com";

    static getSession(authToken: string): Promise<GetSessionResponse> {
        return fetch(`${Server.baseURL}/session`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
        })
        .then((response) => response.json())
        .catch((error) => console.error(`Couldn't get session due to error: ${error?.reason ?? error}`));
    }
}

export default Server;