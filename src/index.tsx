import React from 'react'
import AssistantView from './AssistantView'

class Superluminal extends React.Component {
  render() {
    return <div>
      <AssistantView editor={{
        version: 0,
        editor: {},
        messages: [
          { id: '1', sender: 'user', content: { text: 'Filter to 2018 only' }, timestamp: 0 }
        ]
      }} />
    </div>
  }
}

export default Superluminal;