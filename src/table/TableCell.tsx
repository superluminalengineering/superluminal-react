import React from "react"

interface Props {
    width: number
    height: number
    value: string
    isIndex: boolean
    isLastColumn: boolean
    isLastRow: boolean
    scrollbarWidth: number
}

interface State { }

class TableCell extends React.Component<Props, State> {

    render() {
        const { value, width: _width, height: _height, isIndex, isLastColumn, isLastRow, scrollbarWidth } = this.props
        const width = _width + (isLastColumn ? scrollbarWidth : 0)
        const height = _height + (isLastRow ? scrollbarWidth : 0)
        const borderRight = isLastColumn ? 'none' : '1px solid #e6e6e6'
        const fontWeight = isIndex ? 600 : 'regular'
        const paddingRight = 12 + (isLastColumn ? scrollbarWidth : 0)
        const paddingBottom = 6 + (isLastRow ? scrollbarWidth : 0)
        return <div
            style={{ ...styles.cell, fontWeight, width, height, paddingRight, paddingBottom, borderRight }}>
            {value}
        </div>
    }
}

const styles: Record<string, React.CSSProperties> = {
    cell: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        padding: '6px 12px',
        textAlign: 'center',
        overflow: 'hidden',
        overflowWrap: 'anywhere',
        whiteSpace: 'pre-wrap',
        color: '#121212'
    }
}

export default TableCell;