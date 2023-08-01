import React from 'react';

import AssistantView from './components/AssistantView';
import SessionController from './controllers/SessionController';

interface Props {
  authToken: string
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
        this.state = { };
        if (!props.authToken) {
            console.log('You must provide a valid Superluminal auth token.');
        }
        SessionController.getInstance().authToken = props.authToken;
    }

    render() {
        const { style, userProfilePictureStyle, userMessageStyle, assistantMessageStyle, inputStyle, sendButtonStyle } = this.props;
        return <div style={{ minWidth: '420px', minHeight: '640px', width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', flexShrink: 0 }}>
            <AssistantView
                ref={this.assistantViewRef}
                style={style}
                userProfilePictureStyle={userProfilePictureStyle}
                userMessageStyle={userMessageStyle}
                assistantMessageStyle={assistantMessageStyle}
                inputStyle={inputStyle}
                sendButtonStyle={sendButtonStyle}
            />
        </div>
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
}

export default Superluminal;