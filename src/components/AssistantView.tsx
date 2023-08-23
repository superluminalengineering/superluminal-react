import Plot from 'react-plotly.js';
import React from 'react'
import ReactDOM from 'react-dom';

import InlineInput from './InlineInput';
import ProfilePictureView from './ProfilePictureView';
import SessionController, { SessionControllerEventListener } from '../controllers/SessionController';
import { TableInfo } from '../models/TableInfo';
import TablePreview from '../table/TablePreview';

import { ChatMessage } from '../models/ChatMessage';
import { SessionState } from '../models/SessionState';

import IconExpand from '../images/icon_expand.svg'
import LogoInverted from '../images/logo_inverted.svg'
import LogoText from '../images/logo_text.svg'
import TableView from '../table/TableView';
import TableData from '../table/TableData';

interface Props {
    style?: React.CSSProperties
    userProfilePictureStyle?: React.CSSProperties
    userMessageStyle?: React.CSSProperties
    assistantMessageStyle?: React.CSSProperties
    inputStyle?: React.CSSProperties
    sendButtonStyle?: React.CSSProperties
}

interface State {
    user: { id: string, name: string } | null
    sessionState: SessionState
    chatMessages: ChatMessage[]
    isProcessing: boolean
    modalContent: TableData | null
}

class AssistantView extends React.Component<Props, State> implements SessionControllerEventListener {
    inputContainerRef: React.RefObject<HTMLDivElement> = React.createRef();
    inputRef: React.RefObject<InlineInput> = React.createRef();
    scrollViewRef: React.RefObject<HTMLDivElement> = React.createRef();
    chatMessagesContainerRef: React.RefObject<HTMLDivElement> = React.createRef();

    constructor(props: Props) {
        super(props);
        this.state = { 
            user: SessionController.getInstance().user,
            sessionState: SessionController.getInstance().sessionState,
            chatMessages: SessionController.getInstance().chatMessages,
            isProcessing: false,
            modalContent: null
        };
        this.sendChatMessage = this.sendChatMessage.bind(this);
        this.onSessionStateUpdated = this.onSessionStateUpdated.bind(this);
        this.onChatMessagesUpdated = this.onChatMessagesUpdated.bind(this);
    }

    componentDidMount() {
        SessionController.getInstance().addListener(this);
        setTimeout(() => {
            const scrollView = this.scrollViewRef.current;
            if (scrollView) {
                scrollView.scrollTo({ top: scrollView.scrollHeight, behavior: 'smooth' });
            }
        }, 0);
    }

    componentWillUnmount() {
        SessionController.getInstance().removeListener(this);
    }

    shouldComponentUpdate(_newProps: Readonly<Props>, _newState: Readonly<State>): boolean {
        return true
    }

    render() {
        const { style } = this.props;
        return <div style={{ ...styles.assistantView, ...style }}>
            { this.getWatermarkView() }
            { this.getChatMessagesView() }
            { this.getInputView() }
        </div>
    }

    getWatermarkView(): any {
        return <a style={styles.watermark} href='https://www.superluminal.dev' target='_blank'>
            <span style={{ opacity: 0.4, fontSize: '11px' }}>Powered by</span>
            <img src={LogoText} height="14px" style={{ opacity: 0.4, marginTop: '1px' }} draggable={false} />
        </a>
    }

    getChatMessagesView(): any {
        const { userProfilePictureStyle, userMessageStyle, assistantMessageStyle } = this.props;
        const { user, sessionState, chatMessages, modalContent } = this.state;
        const combinedUserProfilePictureStyle = { ...{ width: '24px', height: '24px', fontSize: '10px' }, ...userProfilePictureStyle };
        if (user && sessionState == 'ready') {
            return <div ref={this.scrollViewRef} style={styles.chatScrollView}>
                <div ref={this.chatMessagesContainerRef} style={styles.chatMessagesContainer}>
                    { chatMessages.map((message) => {
                        switch (message.sender) {
                        case 'user':
                            if ('text' in message.content) {
                                return <div key={message.id} style={{ ...styles.messageContainer, background: '#00000004' }}>
                                    <ProfilePictureView userName={user.name} style={combinedUserProfilePictureStyle} />
                                    <div style={{ ...styles.userMessage, ...userMessageStyle }}>{message.content.text}</div>
                                </div>
                            } else {
                                return '';
                            }
                        case 'assistant':
                            if ('text' in message.content) {
                                return <div key={message.id} style={styles.messageContainer}>
                                    <img src={LogoInverted} style={styles.profilePictureView} width="24px" height="24px" draggable={false} />
                                    <div style={{ ...styles.assistantMessage, ...assistantMessageStyle }}>{message.content.text}</div>
                                </div>
                            } else if ('plot' in message.content) {
                                const plot = JSON.parse(message.content.plot);
                                // `offsetWidth` should always be set at this point. `320` is an arbitrary reasonable fallback.
                                // The padding is currently fixed at 20 px on each side.
                                const width = (this.chatMessagesContainerRef.current?.offsetWidth ?? 320) - 2 * 20;
                                const height = ((plot.layout.width * width) / plot.layout.height);
                                const layout = { ...plot.layout, width, height, margin: {  t: 30, b: 10, l: 10, r: 10, pad: 0 } };
                                return <div key={message.id} style={styles.messageContainer}>
                                    <img src={LogoInverted} style={styles.profilePictureView} width="24px" height="24px" draggable={false} />
                                    <div style={{ display: 'flex', flexDirection: 'column', rowGap: '12px' }}>
                                        <div style={{ ...styles.assistantMessage, ...{ maxWidth: '100%', background: '#FFFFFF' }, ...assistantMessageStyle }}>
                                            <Plot data={plot.data} layout={layout} config={{ toImageButtonOptions: { scale: 3 } }} />
                                        </div>
                                    </div>
                                </div>
                            } else if ('table' in message.content) {
                                const table = message.content.table;
                                return <div key={message.id} style={styles.messageContainer}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <img src={LogoInverted} style={styles.profilePictureView} width="24px" height="24px" draggable={false} />
                                        <img src={IconExpand} width="20px" height="20px" onClick={() => this.expandTable(table)} draggable={false} />
                                    </div>
                                    <div style={{ ...styles.assistantMessage, ...{ maxWidth: '100%', background: '#FFFFFF' }, ...assistantMessageStyle }}>
                                        <TablePreview table={table} />
                                    </div>
                                </div>
                            } else {
                                return ''
                            }
                        }
                    }) }
                </div>
                {modalContent && ReactDOM.createPortal(
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 10000, boxSizing: 'border-box', padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => this.setState({ modalContent: null })}>
                        <div style={{ maxWidth: '100%', maxHeight: '100%' }}>
                            <TableView table={modalContent} style={{ maxHeight: 'calc(100vh - 64px)' }} />
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        } else if (sessionState == 'initializing' || sessionState == 'waiting_for_data' || sessionState == 'validating_data') {
            return <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <img src='https://superluminal.dev/images/ai_new.gif' width="56px" height="56px" draggable={false} />
                <div style={{ fontSize: '20px', fontWeight: 600, color: '#000000', marginTop: '8px' }}>Loading</div>
            </div>
        } else { // 'error' | 'unavailable'
            return <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#000000', marginTop: '8px', textAlign: 'center' }}>An unexpected error occurred.<br />Please try again later.</div>
            </div>
        } 
    }

    getInputView(): any {
        const { inputStyle, sendButtonStyle } = this.props;
        const { isProcessing } = this.state;
        const inlineInputStyle = { border: 'solid', borderWidth: '1px', padding: '12px', borderColor: '#0000000D',
            width: '100%', borderRadius: '6px', background: '#00000005', height: '36px', opacity: isProcessing ? 0.5 : 1 };
        return <div ref={this.inputContainerRef} style={styles.inputContainer}>
            <InlineInput ref={this.inputRef} placeholder="Type here..." style={{ ...inlineInputStyle, ...inputStyle }} onEnter={this.sendChatMessage} />
            <div style={{ ...styles.sendButton, ...{ width: '96px', opacity: isProcessing ? 0.5 : 1 }, ...sendButtonStyle }} onClick={this.sendChatMessage}>Send</div>
        </div>
    }

    sendChatMessage() {
        const message = this.inputRef.current?.getContent() ?? null;
        const { isProcessing } = this.state;
        if (!message || message.length == 0 || isProcessing) { return; }
        this.inputRef.current?.clear();
        SessionController.getInstance().sendChatMessage(message);
    }

    expandTable(table: TableInfo) {
        this.setState({ modalContent: new TableData(table, TableView.measureInfo) });
    }

    setUser(user: { id: string, name: string }) {
        this.setState({ user });
    }

    onSessionStateUpdated(sessionState: SessionState, error: string | null) {
        this.setState({ sessionState });
    }

    onChatMessagesUpdated(chatMessages: ChatMessage[]) {
        this.setState({ chatMessages });
        setTimeout(() => {
            const scrollView = this.scrollViewRef.current;
            if (scrollView) {
                scrollView.scrollTo({ top: scrollView.scrollHeight, behavior: 'smooth' });
            }
        }, 0);
    }
}

const styles = {

    assistantView: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        transition: 'opacity 150ms',
        width: '100%',
        height: '100%',
        border: "solid 1px #0000001A",
    } as React.CSSProperties,

    watermark: {
        position: 'absolute',
        width: '100%',
        height: '32px',
        top: '0px',
        left: '0px',
        borderBottom: 'solid 1px #0000001A',
        backdropFilter: "blur(12px)",
        background: "#FFFFFFE6",
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: '8px',
        userSelect: 'none',
        color: 'black',
        textDecoration: 'none',
        zIndex: 1,
    } as React.CSSProperties,

    chatScrollView: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflowY: 'auto',
    } as React.CSSProperties,

    chatMessagesContainer: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        padding: '32px 0px 77px 0px',
        boxSizing: 'border-box',
    } as React.CSSProperties,

    messageContainer: {
        display: "flex",
        flexDirection: "column",
        rowGap: "10px",
        color: "#000000",
        borderBottom: "solid 1px #0000000D",
        padding: "20px"
    } as React.CSSProperties,

    userMessage: {
        boxSizing: "border-box",
        userSelect: "text",
        whiteSpace: "pre-wrap",
        fontSize: "14px"
    } as React.CSSProperties,

    assistantMessage: {
        display: "flex",
        flexDirection: "column",
        rowGap: "8px",
        boxSizing: "border-box",
        userSelect: "text",
        whiteSpace: "pre-wrap",
        fontSize: "14px"
    } as React.CSSProperties,

    profilePictureView: {
        borderRadius: '50%',
        border: 'solid',
        borderColor: '#FFFFFF33',
        borderWidth: '1px',
        width: '24px',
        height: '24px',
    } as React.CSSProperties,

    inputContainer: {
        position: "absolute",
        bottom: "0px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: "0px 20px 0px 20px",
        boxSizing: "border-box",
        columnGap: "12px",
        borderTop: "solid 1px #0000001A",
        backdropFilter: "blur(12px)",
        background: "#FFFFFFE6",
        height: "78px",
        width: "100%",
        transition: "150ms"
    } as React.CSSProperties,

    sendButton: {
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#2C67FF',
        color: '#FFFFFF',
        padding: '0px 10px 0px 10px',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '14px',
        boxSizing: 'border-box',
        border: 'solid',
        borderRadius: '6px',
    } as React.CSSProperties,
}

export default AssistantView;
