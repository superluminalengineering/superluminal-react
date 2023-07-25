import React from "react"

interface Props {
    content: string
    isIndex: boolean
    isLastColumn: boolean
    scrollX: number
    width: number
    scrollbarWidth: number
}

interface State { }

class TableHeaderCell extends React.Component<Props, State> {

    render() {
        const { content, isIndex, isLastColumn, scrollX, width: _width, scrollbarWidth } = this.props;
        const width = _width + (isLastColumn ? scrollbarWidth : 0);
        const borderRight = isLastColumn ? 'none' : '1px solid #e6e6e6';
        if (isIndex) {
            return <div
                className="table-view-header-cell"
                style={{ ...styles.headerCell, left: scrollX, width: width, borderRight, zIndex: 1 }}>
                { content }
            </div>
        } else {
            return <div
                className="table-view-header-cell"
                style={{ ...styles.headerCell, width: width, borderRight }}>
                <span style={styles.inner}>{ content }</span>
            </div>
        }
    }
}

const styles: Record<string, React.CSSProperties> = {
    headerCell: {
        boxSizing: 'border-box',
        position: 'relative',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '0px 12px 0px 12px',
        backgroundColor: '#fafafa',
    },
    inner: {
        width: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    }
}

export default TableHeaderCell