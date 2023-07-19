import React from "react"

import { TableColumn } from "./TableEditorVM"

interface Props {
    editor: Object
    column: TableColumn
    isIndex: boolean
    isLastColumn: boolean
    scrollX: number
    width: number
    isSelected: boolean
    scrollbarWidth: number
}

interface State { }

class TableHeaderCell extends React.Component<Props, State> {
    private ref: React.RefObject<HTMLDivElement>;

    constructor(props: Props) {
        super(props)
        this.ref = React.createRef()
    }

    render() {
        const { column, isIndex, isLastColumn, scrollX, width: _width, isSelected, scrollbarWidth } = this.props;
        const width = _width + (isLastColumn ? scrollbarWidth : 0);
        const borderRight = isLastColumn ? 'none' : '1px solid var(--black10)';
        if (isIndex) {
            const background = isSelected ? '#ededed' : '#fafafa';
            return <div
                ref={this.ref}
                key={column.id}
                className="table-view-header-cell"
                style={{ ...styles.headerCell, left: scrollX, width: width, cursor: 'auto', background, borderRight, zIndex: 1 }}>
                { column.name }
            </div>
        } else {
            const background = isSelected ? 'var(--black5)' : 'transparent';
            return <div
                ref={this.ref}
                key={column.id}
                className="table-view-header-cell"
                style={{ ...styles.headerCell, width: width, cursor: 'auto', background, borderRight }}>
                <span>{ column.name }</span>
            </div>
        }
    }

    getFrame(): DOMRect | null {
        const current = this.ref.current;
        if (!current) { return null; }
        return current.getBoundingClientRect();
    }

    contains(e: React.MouseEvent, yMargin: number): boolean {
        const frame = this.getFrame();
        if (!frame) { return false; }
        const { clientX, clientY } = e;
        const { x, y, width, height } = frame;
        return (clientX >= x && clientX <= x + width && clientY >= y - yMargin && clientY <= y + height + yMargin);
    }
}

const styles: Record<string, React.CSSProperties> = {
    headerCell: {
        boxSizing: 'border-box',
        position: 'relative',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0px 12px 0px 12px',
        textAlign: 'center',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    }
}

export default TableHeaderCell