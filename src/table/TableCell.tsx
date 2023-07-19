import React from "react"

interface Props {
    editor: Object
    width: number
    height: number
    value: string
    isIndex: boolean
    isLastColumn: boolean
    isLastRow: boolean
    isSelected: boolean
    scrollbarWidth: number
}

interface State { }

class TableCell extends React.Component<Props, State> {
    ref: React.RefObject<HTMLDivElement>;

    constructor(props: Props) {
        super(props);
        this.ref = React.createRef();
    }

    render() {
        const { value, width: _width, height: _height, isIndex, isLastColumn, isLastRow, isSelected, scrollbarWidth } = this.props
        const width = _width + (isLastColumn ? scrollbarWidth : 0)
        const height = _height + (isLastRow ? scrollbarWidth : 0)
        const borderRight = isLastColumn ? 'none' : '1px solid var(--black10)'
        const background = isSelected ? 'var(--black5)' : 'transparent'
        const font = isIndex ? 'var(--semiBoldFont)' : 'var(--regularFont)'
        const backgroundWidth = _width + (isLastColumn ? scrollbarWidth : -1)
        const backgroundHeight = _height + (isLastRow ? scrollbarWidth : -1)
        const paddingRight = 12 + (isLastColumn ? scrollbarWidth : 0)
        const paddingBottom = isLastRow ? scrollbarWidth : 0
        const color = 'var(--textColor)'
        return <div
            ref={this.ref}
            className="table-view-cell"
            style={{ ...styles.cell, fontFamily: font, width, height, cursor: 'auto', paddingRight, paddingBottom, borderRight, color }}>
            <div className="table-view-cell-background" style={{ ...styles.cellBackground, background, width: backgroundWidth, height: backgroundHeight }}></div>
            <div style={{ zIndex: 1 }}>{value}</div>
        </div>
    }

    getFrame(): DOMRect | null {
        const current = this.ref.current
        if (!current) { return null }
        return current.getBoundingClientRect()
    }

    contains(e: React.MouseEvent, yMargin: number): boolean {
        const frame = this.getFrame()
        if (!frame) { return false; }
        const { clientX, clientY } = e
        const { x, y, width, height } = frame
        return (clientX >= x && clientX <= x + width && clientY >= y - yMargin && clientY <= y + height + yMargin)
    }
}

const styles: Record<string, React.CSSProperties> = {
    cell: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        padding: '0px 12px 0px 12px',
        textAlign: 'center',
        overflow: 'hidden',
    },
    cellBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
}

export default TableCell;