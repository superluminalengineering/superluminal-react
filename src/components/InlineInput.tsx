import * as React from 'react';

import './InlineInput.css';

interface Props {
    placeholder?: string
    defaultValue?: string
    onContentChanged?: ((content: string) => void)
    type?: string
    style?: any
    onEnter?: () => void
    onFocusChanged?: (hasFocus: boolean) => void
    debounce?: number
}

interface State { }

class InlineInput extends React.Component<Props, State> {
    ref: React.RefObject<HTMLInputElement>;
    timeout: number | null = null;

    constructor(props: Props) {
        super(props);
        this.ref = React.createRef();
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    render() {
        const { placeholder, defaultValue, style, type } = this.props;
        return <input
            ref={this.ref}
            className="inline-input"
            name="text"
            type={ type ?? "text" }
            style={ style }
            placeholder={placeholder}
            defaultValue={defaultValue}
            onKeyDown={this.onKeyDown}
            onFocus={this.onFocus}
            onBlur={this.onBlur}
            onChange={this.onChange}
            autoComplete="off"
            required={true}
        />
    }

    focus() {
        this.ref.current?.focus();
    }

    onFocus() {
        this.props.onFocusChanged?.(true);
    }

    blur() {
        this.ref.current?.blur();
    }

    onBlur() {
        this.props.onFocusChanged?.(false);
    }

    onKeyDown(e: React.KeyboardEvent) {
        if (e.code == 'Enter' && this.props.onEnter) {
            this.props.onEnter();
            e.preventDefault();
            e.stopPropagation();
        }
    }

    onChange() {
        const delay = this.props.debounce ?? 500;
        const { timeout } = this;
        if (timeout) { clearTimeout(timeout); }
        if (delay > 0) {
            this.timeout = setTimeout(() => {
                this.onContentChanged();
            }, delay);
        } else {
            this.onContentChanged();
        }
    }

    onContentChanged() {
        const content = this.getContent();
        if (content == null) { return; }
        this.props.onContentChanged?.(content);
    }

    getContent(): string | null {
        const value = this.ref.current?.value;
        return (value !== undefined) ? value : null;
    }

    setCursor(position: number) {
        const input = this.ref.current;
        if (!input) { return; }
        input.setSelectionRange(position, position);
    }

    clear() {
        const input = this.ref.current;
        if (!input) { return; }
        input.setSelectionRange(0, 0);
        input.value = "";
        this.props.onContentChanged?.("");
    }

    setValue(value: string) {
        const input = this.ref.current;
        if (!input) { return; }
        input.value = value;
        this.props.onContentChanged?.(value);
    }
}

export default InlineInput;
