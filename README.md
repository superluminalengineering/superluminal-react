# superluminal-react

The official front-end React component for the Superluminal API.

For more information visit the [full documentation](https://superluminal.dev/docs).

## Tutorial

The Superluminal React component is the easiest way to add conversational data interaction similar to ChatGPT + CodeInterpreter to your dashboard. The layout of the component is customizable and should be sufficient to let you style it according to your branding. That said, if you need even deeper customization we recommend you take a look at the [Direct API Usage Tutorial](https://superluminal.dev/docs/#tutorial).

Integrating the Superluminal React component consists of four steps. Three that you'll need to take from your back-end, and one that you'll need to take from your front-end:

### From your back-end:

#### Step 1: Creating the session

To get started, hit the [`POST /sessions`](https://superluminal.dev/docs/#creating-a-session) endpoint from your server when your user enters their dashboard. This starts a new session for the given `user_id` / `project_id` combination. Usually, the `user_id` will be the ID you maintain internally for your user, and `project_id` will just be "main". If you set `transient` to `true`, all data associated with the session will be deleted after you're done.

Hold on to the token returned by `POST /sessions` as you'll need it later.

#### Step 2: Specifying the schema

Before you upload your data in the final step, you'll need to specify the schema (i.e. format/structure) of your data. You do this by supplying a [JSON schema](https://json-schema.org/) to [`PUT /users/:user_id/projects/:project_id/schema`](https://superluminal.dev/docs/#specifying-the-schema), where `user_id` and `project_id` are the values you previously used while establishing the session.

> Supplying a good schema is key to getting great results from the AI assistant. You can read about available schema options in more detail [here](https://superluminal.dev/docs/#specifying-the-schema), but an example request might look like the snippet shown. If a column is marked as required, it cannot contain empty values.

```
{
    "columns": [ "ID", "Product", "Date", … ],
    "schema": {
        "type": "object",
        "description": "A single order",
        "properties": {
            "ID": { "type": "integer" },
            "Product": { "type": "string" },
            "Date": {
                "type": "string",
                "format": "date-time",
                "description": "The date the order was placed"
            },
            …
        },
        "required": [ "ID", "Product", … ]
    }
}
```

Need help with your schema? [Contact us](mailto:contact@getluminal.com).

#### Step 3: Supplying the data

The final step is to supply the data. You do this by sending the user's dashboard data in CSV format from your server to [`PUT /users/:user_id/projects/:project_id/data`](https://superluminal.dev/docs/#uploading-data), where `user_id` and `project_id` are the values you previously used while establishing the session, as in the previous step.

### From your front-end:

To add the React component to your dashboard, all you need to do is install the package using `npm install superluminal-react` (or `yarn add superluminal-react`) and add the following code. The `superluminalAuthToken` is the auth token you received when you created the session from your back-end.

```js
import Superluminal from 'superluminal-react'

// Use the various `style` props to customize the look and feel
<Superluminal ref={superluminalRef} authToken={superluminalAuthToken} style={ ... } />

// Optionally use the `setUser` method to set user info when available. The user's 
// name will default to 'User' in the chat if left blank.
superluminalRef.current?.setUser({ id: $USER_ID, name: $USER_NAME })
```

And that's it! You should now have a working AI copilot in your data dashboard, including full support for plotting, filtering and pivoting!
