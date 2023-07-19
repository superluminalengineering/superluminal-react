
class Server {

    static baseURL = "https://app.getluminal.com";
    static apiKey = "";

    // TODO: Refresh auth token as needed

    static createSession(userID: string, projectID: string, isTransient: boolean, isEditingAllowed: boolean, tablePageSize: number) {
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
    }
}

export default Server;