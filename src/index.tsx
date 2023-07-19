import React from 'react'

import AssistantView from './AssistantView'

class Superluminal extends React.Component {

    render() {
        return <AssistantView
            userName='Test User'
            editor={{
                version: 0,
                editor: {},
                messages: [
                    { id: '1', sender: 'user', content: { text: 'Filter to 2018 only' }, timestamp: 0 },
                    { id: '2', sender: 'assistant', content: { text: 'Sure!' }, timestamp: 0 }
                ]
            }} 
        />
    }
}

export default Superluminal;