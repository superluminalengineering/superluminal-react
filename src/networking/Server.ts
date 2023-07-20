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

    static uploadData(file: File, userID: string, projectID: string): [AbortController, Promise<void>] {
        const controller = new AbortController()
        const url = `https://app.getluminal.com/users/${userID}/projects/${projectID}/data`
        const promise = fetch(url, {
            method: 'PUT',
            body: file,
            headers: {
                "Authorization" : `Bearer ${Server.apiKey}`,
            },
            signal: controller.signal
        }).then(response => {
            if (!response.ok) {
                console.log(`Couldn't upload data due to error: ${response}`);
            }
        }).catch(error => {
            console.log(`Couldn't upload data due to error: ${error?.reason ?? error}`);
        });
        return [ controller, promise ];
    }
}

export default Server;