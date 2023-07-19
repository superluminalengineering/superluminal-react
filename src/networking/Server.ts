import axios from "axios";

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
        // Stream the request
        const promise = axios.put(url, file, { // `file` is a JavaScript File object
            headers: {
                "Authorization" : `Bearer ${Server.apiKey}`,
            },
            onUploadProgress: (event) => {
                const fraction = event.total ? (event.loaded / event.total) : 0
                console.log(`Upload progress: ${fraction}`)
            },
            signal: controller.signal
        }).then(() => { });
        return [ controller, promise ];
    }
}

export default Server;