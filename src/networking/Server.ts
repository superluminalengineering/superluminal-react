import { ChatMessage } from "../models/ChatMessage";
import { SessionState } from "../models/SessionState";

class Server {

    static baseURL = "https://app.getluminal.com";
    static apiKey = "";

    // TODO: Refresh auth token as needed

    static createSession(userID: string, projectID: string, isTransient: boolean, isEditingAllowed: boolean, tablePageSize: number): Promise<{ session_state: SessionState, token: string, chat_history: ChatMessage[] }> {
        return fetch(`${Server.baseURL}/sessions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Server.apiKey}`
            },
            body: JSON.stringify({
                user_id: userID,
                project_id: projectID,
                transient: isTransient,
                allow_edits: isEditingAllowed,
                table_page_size: tablePageSize,
            })
        })
        .then((response) => response.json())
        .catch((error) => console.log(`Couldn't create session due to error: ${error?.reason ?? error}`));
    }
}

export default Server;