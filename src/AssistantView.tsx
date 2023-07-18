import React from 'react'

// import Plot from 'react-plotly.js';
import InlineInput from './components/InlineInput';
// import ProfilePictureView from '../components/ProfilePictureView';

import { ChatEditorVM } from './models/ChatEditorVM';

import './AssistantView.css';

import LogoInverted from './images/logo_inverted.svg'

interface Props {
    editor: ChatEditorVM
    style?: any
}

interface State {
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
            editor: props.editor, 
            viewModelVersion: props.editor.version,
        };
        // props.editor.updateHandler = this.onViewModelUpdate.bind(this);
        this.onInputFocusChanged = this.onInputFocusChanged.bind(this);
        this.execute = this.execute.bind(this);
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
        const inlineInputStyle = { border: 'solid', borderWidth: '1px', padding: '12px', borderColor: 'var(--black5)', boxSizing: 'border-box',
            width: '100%', borderRadius: '6px', background: 'var(--black2)', height: '38px', opacity: this.isProcessing() ? 0.5 : 1 };
        return <div className="assistant-view" style={{ ...style }}>
            { this.getChatView() }
            <div ref={this.inputBoxRef} className="assistant-view-input-box">
                <InlineInput ref={this.inputRef} placeholder="Type here..." style={inlineInputStyle} onFocusChanged={this.onInputFocusChanged} onEnter={this.execute} />
                <div className="prominent-button" style={{ width: '96px', height: '35px', opacity: this.isProcessing() ? 0.5 : 1 }} onClick={this.execute}>Send</div>
            </div>
        </div>
    }

    getChatView(): any {
        const { editor } = this.state;
        return <div ref={this.scrollViewRef} className="assistant-view-chat-view-container">
            <div className="assistant-view-chat-view">
                { editor.messages.map((message) => {
                    switch (message.sender) {
                    case 'user':
                        if ('text' in message.content) {
                            return <div className="assistant-view-message-container" style={{ background: '#00000004' }}>
                                {/* <ProfilePictureView name={user.name ?? ''} style={{ width: '24px', height: '24px', fontSize: '10px' }} /> */}
                                <div className="assistant-view-user-message">{message.content.text}</div>
                            </div>
                        } else {
                            return '';
                        }
                    case 'assistant':
                        if ('text' in message.content) {
                            return <div className="assistant-view-message-container">
                                <img src={LogoInverted} className="ai-profile-picture-view" width="24px" height="24px" />
                                <div className="assistant-view-system-message">
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

    onInputFocusChanged(focused: boolean) {
        if (focused) {
            // ProjectController.getInstance().then((instance) => {
            //     instance.handleComponentAcquiredSelectionFromJS('chat');
            // });
        }
    }

    execute() {
        const message = this.inputRef.current?.getContent() ?? null;
        if (!message || message.length == 0 || this.isProcessing()) { return; }
        this.inputRef.current?.clear();
        // ProjectController.getInstance().then((instance) => {
        //     instance.sendMessage(message);
        // });
    }

    isProcessing(): boolean {
        const messages = this.state.editor.messages;
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            return (lastMessage.sender == 'assistant' && 'text' in lastMessage.content && lastMessage.isEphemeral == true);
        } else {
            return false;
        }
    }
}

export default AssistantView;
