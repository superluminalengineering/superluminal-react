import React from 'react'

import InlineInput from './components/InlineInput';

import { ChatEditorVM } from './models/ChatEditorVM';

import LogoInverted from './images/logo_inverted.svg'

interface Props {
    editor: ChatEditorVM
    style?: React.CSSProperties
    inputStyle?: React.CSSProperties
    sendButtonStyle?: React.CSSProperties
}

interface State {
    isProcessing: boolean
    viewModelVersion: number
    editor: ChatEditorVM
}

class AssistantView extends React.Component<Props, State> { //implements ProjectControllerEventListener {
    inputBoxRef: React.RefObject<HTMLDivElement>;
    inputRef: React.RefObject<InlineInput>;
    scrollViewRef: React.RefObject<HTMLDivElement>;

    constructor(props: Props) {
        super(props);
        this.inputBoxRef = React.createRef();
        this.inputRef = React.createRef();
        this.scrollViewRef = React.createRef();
        this.state = { 
            isProcessing: false,
            editor: props.editor, 
            viewModelVersion: props.editor.version,
        };
        // props.editor.updateHandler = this.onViewModelUpdate.bind(this);
        this.onInputFocusChanged = this.onInputFocusChanged.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
    }

    componentDidMount() {
        // ProjectController.getInstance().then((instance) => instance.addListener(this));
        setTimeout(() => {
            const scrollView = this.scrollViewRef.current;
            if (scrollView) {
                scrollView.scrollTo({ top: scrollView.scrollHeight, behavior: 'smooth' });
            }
        }, 0);
    }

    componentWillUnmount() {
        // ProjectController.getInstance().then((instance) => instance.removeListener(this));
    }

    static getDerivedStateFromProps(props: Props, _: State) {
        // Needed to reset this.state.editor when this.props.editor is changed
        return { editor: props.editor };
    }

    onViewModelUpdate(_: Partial<ChatEditorVM>) {
        this.setState({ viewModelVersion: this.props.editor.version });
        setTimeout(() => {
            const scrollView = this.scrollViewRef.current;
            if (scrollView) {
                scrollView.scrollTo({ top: scrollView.scrollHeight, behavior: 'smooth' });
            }
        }, 0);
    }

    shouldComponentUpdate(_newProps: Readonly<Props>, _newState: Readonly<State>): boolean {
        return true
    }

    render() {
        const { style } = this.props;
        return <div style={{ ...styles.assistantView, ...style }}>
            { this.getChatContentView() }
            { this.getInputBoxView() }
        </div>
    }

    getChatContentView(): any {
        const { editor } = this.state;
        return <div ref={this.scrollViewRef} className="assistant-view-chat-view-container" style={styles.chatViewContainer}>
            <div className="assistant-view-chat-view" style={styles.chatView}>
                { editor.messages.map((message) => {
                    switch (message.sender) {
                    case 'user':
                        if ('text' in message.content) {
                            return <div className="assistant-view-message-container" style={{ ...styles.messageContainer, background: '#00000004' }}>
                                {/* <ProfilePictureView name={user.name ?? ''} style={{ width: '24px', height: '24px', fontSize: '10px' }} /> */}
                                <div className="assistant-view-user-message" style={styles.userMessage}>{message.content.text}</div>
                            </div>
                        } else {
                            return '';
                        }
                    case 'assistant':
                        if ('text' in message.content) {
                            return <div className="assistant-view-message-container" style={styles.messageContainer}>
                                <img src={LogoInverted} className="ai-profile-picture-view" style={styles.aiProfilePictureView} width="24px" height="24px" />
                                <div className="assistant-view-system-message" style={styles.systemMessage}>
                                    <div>{message.content.text}</div>
                                </div>
                            </div>
                        } else {
                            // const plot = JSON.parse(message.content.plot);
                            // const width = ProjectController.instance.rightPaneWidth - 2 * 20;
                            // const height = ((plot.layout.width * width) / plot.layout.height);
                            // const layout = { ...plot.layout, width, height, margin: {  t: 30, b: 10, l: 10, r: 10, pad: 0 } };
                            // return <div className="assistant-view-message-container">
                            //     <img src={LogoInverted} className="ai-profile-picture-view" width="24px" height="24px" />
                            //     <div style={{ display: 'flex', flexDirection: 'column', rowGap: '12px' }}>
                            //         <div className="assistant-view-system-message" style={{ maxWidth: '100%', background: '#FFFFFF' }}>
                            //             <Plot data={plot.data} layout={layout} config={{ toImageButtonOptions: { scale: 3 } }} />
                            //         </div>
                            //         <div className="neutral-button" style={{ height: '36px', width: '140px', padding: '0px 12px', boxSizing: 'border-box' }} onClick={() => { App.shared?.showPlot('plot', plot.data, layout) }}>Expand</div>
                            //     </div>
                            // </div>
                        }
                    }
                }) }
            </div>
        </div>
    }

    getInputBoxView(): any {
        const { inputStyle, sendButtonStyle } = this.props;
        const { isProcessing } = this.state;
        const inlineInputStyle = { border: 'solid', borderWidth: '1px', padding: '12px', borderColor: '#0000000D',
            width: '100%', borderRadius: '6px', background: '#00000005', height: '36px', opacity: isProcessing ? 0.5 : 1 };
        return <div ref={this.inputBoxRef} style={styles.inputBox}>
            <InlineInput ref={this.inputRef} placeholder="Type here..." style={{ ...inlineInputStyle, ...inputStyle }} onFocusChanged={this.onInputFocusChanged} onEnter={this.sendMessage} />
            <div style={{ ...styles.sendButton, ...{ width: '96px', opacity: isProcessing ? 0.5 : 1 }, ...sendButtonStyle }} onClick={this.sendMessage}>Send</div>
        </div>
    }

    onInputFocusChanged(focused: boolean) {
        if (focused) {
            // ProjectController.getInstance().then((instance) => {
            //     instance.handleComponentAcquiredSelectionFromJS('chat');
            // });
        }
    }

    sendMessage() {
        const message = this.inputRef.current?.getContent() ?? null;
        const { isProcessing } = this.state;
        if (!message || message.length == 0 || isProcessing) { return; }
        this.inputRef.current?.clear();
        // ProjectController.getInstance().then((instance) => {
        //     instance.sendMessage(message);
        // });
    }
}

const styles = {

    assistantView: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        transition: 'opacity 250ms',
        width: '100%',
        height: '100%'
    } as React.CSSProperties,

    messageContainer: {
        display: "flex",
        flexDirection: "column",
        rowGap: "10px",
        color: "#000000",
        borderBottom: "solid 1px var(--black5)",
        padding: "20px"
    } as React.CSSProperties,

    userMessage: {
        boxSizing: "border-box",
        userSelect: "text",
        whiteSpace: "pre-wrap",
        fontSize: "14px"
    } as React.CSSProperties,

    systemMessage: {
        display: "flex",
        flexDirection: "column",
        rowGap: "8px",
        boxSizing: "border-box",
        userSelect: "text",
        whiteSpace: "pre-wrap",
        fontSize: "14px"
    } as React.CSSProperties,

    inputBox: {
        position: "absolute",
        bottom: "0px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: "0px 20px 0px 20px",
        boxSizing: "border-box",
        columnGap: "12px",
        borderTop: "solid 1px var(--black10)",
        backdropFilter: "blur(12px)",
        background: "#FFFFFFE6",
        borderBottomLeftRadius: "6px",
        borderBottomRightRadius: "6px",
        height: "78px",
        width: "100%",
        transition: "150ms"
    } as React.CSSProperties,

    chatViewContainer: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflowY: 'auto',
    } as React.CSSProperties,

    chatView: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        padding: '0px 0px 77px 0px',
        boxSizing: 'border-box',
    } as React.CSSProperties,

    aiProfilePictureView: {
        borderRadius: '50%',
        border: 'solid',
        borderColor: 'var(--white20)',
        borderWidth: '1px',
        width: '24px',
        height: '24px',
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
