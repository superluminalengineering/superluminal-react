import React from 'react';

import AssistantView from './components/AssistantView';
import SessionController, { SessionControllerEventListener } from './controllers/SessionController';
import TableData from './table/TableData';
import TableView from './table/TableView';
import { TableInfo } from './models/TableInfo';

interface Props {
  authToken: string
  style?: React.CSSProperties
  userProfilePictureStyle?: React.CSSProperties
  userMessageStyle?: React.CSSProperties
  assistantMessageStyle?: React.CSSProperties
  inputStyle?: React.CSSProperties
  sendButtonStyle?: React.CSSProperties
}

interface State {
    table: TableData | null
}

class Superluminal extends React.Component<Props, State> implements SessionControllerEventListener {
    assistantViewRef = React.createRef<AssistantView>();

    constructor(props: Props) {
        super(props);
        this.state = { table: null };
        if (!props.authToken) {
            console.log('You must provide a valid Superluminal API key.');
        }
        SessionController.getInstance().authToken = props.authToken;
    }

    componentDidMount() {
        SessionController.getInstance().addListener(this)
    }

    componentWillUnmount() {
        SessionController.getInstance().removeListener(this)
    }

    onTableUpdated(table: TableInfo) {
        const tableData = new TableData(table);
        this.setState({ table: tableData })
    }

    render() {
        const { style, userProfilePictureStyle, userMessageStyle, assistantMessageStyle, inputStyle, sendButtonStyle } = this.props;
        const { table } = this.state;
        return <div style={{ display: 'flex', alignItems: 'stretch', gap: '32px' }}>
            <div style={{ width: '420px', minHeight: '640px' }}>
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
            <div style={{ flexGrow: 1 }}>
                { table && <TableView table={table} /> }
            </div>
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