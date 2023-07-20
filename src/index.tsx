import React from 'react';

import AssistantView from './components/AssistantView';
import Server from './networking/Server';
import SessionController from './controllers/SessionController';

interface Props {
  apiKey: string
  style?: React.CSSProperties
  userProfilePictureStyle?: React.CSSProperties
  userMessageStyle?: React.CSSProperties
  assistantMessageStyle?: React.CSSProperties
  inputStyle?: React.CSSProperties
  sendButtonStyle?: React.CSSProperties
}

interface State { }

class Superluminal extends React.Component<Props, State> {
    assistantViewRef = React.createRef<AssistantView>();

    constructor(props: Props) {
        super(props);
        this.state = {};
        if (!props.apiKey) {
            console.log('You must provide a valid Superluminal API key.');
        }
        Server.apiKey = props.apiKey;
    }

    render() {
        const { style, userProfilePictureStyle, userMessageStyle, assistantMessageStyle, inputStyle, sendButtonStyle } = this.props;
        return <AssistantView
            ref={this.assistantViewRef}
            style={style}
            userProfilePictureStyle={userProfilePictureStyle}
            userMessageStyle={userMessageStyle}
            assistantMessageStyle={assistantMessageStyle}
            inputStyle={inputStyle}
            sendButtonStyle={sendButtonStyle}
        />
    }

    setUser(user: { id: string, name: string }) {
        if (!user.id) {
            return console.log('You must provide a valid user ID.');
        }
        if (!user.name) {
            return console.log('You must provide a valid user name.');
        }
        SessionController.getInstance().initialize(user);
        this.assistantViewRef.current?.setUser(user);
    }

    setData(file: File) {
        if (file.size == 0) {
            return console.log('You must provide a non-empty data file.');
        }
        SessionController.getInstance().uploadData(file);
    }
}

export default Superluminal;