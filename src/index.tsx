import React from 'react';

import AssistantView from './AssistantView';
import Server from './networking/Server';

interface Props {
  apiKey: string
  userName: string
  userID: string
  style?: React.CSSProperties
  userProfilePictureStyle?: React.CSSProperties
  userMessageStyle?: React.CSSProperties
  assistantMessageStyle?: React.CSSProperties
  inputStyle?: React.CSSProperties
  sendButtonStyle?: React.CSSProperties
}

interface State { }

class Superluminal extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {};
        Server.apiKey = props.apiKey;
    }

    render() {
        const { userName, style, userProfilePictureStyle, userMessageStyle, assistantMessageStyle, inputStyle, sendButtonStyle } = this.props;
        return <AssistantView
            userName={userName}
            style={style}
            userProfilePictureStyle={userProfilePictureStyle}
            userMessageStyle={userMessageStyle}
            assistantMessageStyle={assistantMessageStyle}
            inputStyle={inputStyle}
            sendButtonStyle={sendButtonStyle}
        />
    }
}

export default Superluminal;