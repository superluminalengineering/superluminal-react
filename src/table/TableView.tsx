import React from 'react'
import ContentLoader from 'react-content-loader';

import TableHeaderCell from './TableHeaderCell'
import TableCell from './TableCell'
import ObjectUtilities from '../utilities/ObjectUtilities'
import TableData, { MeasureInfo, RowRange, RowSlice } from './TableData'
import SessionController, { SessionControllerEventListener } from '../controllers/SessionController'
import { TablePage } from '../models/TableInfo'

interface Props {
    table: TableData
}

interface State {
    tableID: string
    rowSlice: RowSlice
    scrollX: number
    scrollY: number
    scrollViewHeight: number
    fetchRange: RowRange | null
}

class TableView extends React.Component<Props, State> implements SessionControllerEventListener {
    scrollViewRef: React.RefObject<HTMLDivElement>

    static scrollbarWidth = 8
    static minRowHeight = 32
    static measureInfo: MeasureInfo = {
        fonts: {
            header: '600 16px system-ui, sans-serif',
            index: '600 16px system-ui, sans-serif',
            body: '400 16px system-ui, sans-serif',
        },
        totalCellPadding: {
            x: (2 * 12 + 1), // 2 * padding + border
            y: (2 * 6 + 1)
        },
        lineHeight: 19,
        maxColumnWidth: 320
    }

    constructor(props: Props) {
        super(props)
        this.state = {
            tableID: props.table.tableID,
            rowSlice: { startIndex: 0, startY: 0, endY: 0, rows: [], rowHeights: [] },
            scrollX: 0,
            scrollY: 0,
            scrollViewHeight: 0,
            fetchRange: props.table.getFetchRange()
        }
        this.scrollViewRef = React.createRef()
        this.handleScrollChanged = this.handleScrollChanged.bind(this)
    }

    componentDidMount() {
        SessionController.getInstance().addListener(this)
        this.handleScrollChanged()
    }

    componentWillUnmount(): void {
        SessionController.getInstance().removeListener(this)
    }

    onTablePageReceived(page: TablePage) {
        const { table } = this.props
        table.handleFetchedPage(page)
        this.handleScrollChanged()
    }

    shouldComponentUpdate(props: Readonly<Props>, state: Readonly<State>): boolean {
        const { table: oldTable, ...oldProps } = this.props
        const { table: newTable, ...newProps } = props
        return oldTable !== newTable || !ObjectUtilities.isEqual(oldProps, newProps) || !ObjectUtilities.isEqual(this, state)
    }

    static getDerivedStateFromProps(props: Readonly<Props>, state: Readonly<State>): Partial<State> | null {
        const tableID = props.table.tableID
        if (tableID !== state.tableID) { // Handle table change
            const [ minY, maxY ] = [ state.scrollY, state.scrollY + state.scrollViewHeight ]
            const rowSlice = props.table.rowSlice({ minY, maxY }, { fetchIfNeeded: true })
                ?? { startIndex: 0, startY: 0, endY: 0, rows: [], rowHeights: [] }
            return { tableID, rowSlice }
        }
        return null
    }

    render() {
        const { table } = this.props
        const { rowSlice, scrollX, scrollY, fetchRange } = this.state
        const { columns, indexWidth, numberOfRows } = table
        const columnWidths = columns.map(x => x.width)
        const totalBodyWidth = columnWidths.reduce((a, b) => a + b, 0)
        const totalBodyHeight = table.totalHeight
        const startColumnX = -scrollX
        const shadow = '0px 0px 4px 0px #e6e6e6'    

        table.onFetchRangeUpdated = (fetchRange) => this.setState({ fetchRange })

        return <div className='table-view' style={{ ...styles.tableView }}>
            <div className="table-view-table" style={styles.table}>
                <div className="table-view-header" style={{ ...styles.header, left: startColumnX, height: TableView.minRowHeight, boxShadow: (scrollY > 0 ? shadow : 'none') }}>
                    <div className="table-view-row" style={{ ...styles.row, height: '100%' }}>
                    <TableHeaderCell key={''} content={''} isIndex={true} isLastColumn={false} scrollX={scrollX} width={indexWidth} scrollbarWidth={TableView.scrollbarWidth} />
                    { columns.map((column, j) => {
                        const isLastColumn = (j == columns.length - 1)
                        const width = columnWidths[j]
                        return <TableHeaderCell key={column.id} content={column.name} isIndex={false} isLastColumn={isLastColumn} scrollX={scrollX} width={width} scrollbarWidth={TableView.scrollbarWidth} />
                    }) }</div>
                </div>
                <div style={{ display: 'flex' }}>
                    <div className="table-view-index" style={{ ...styles.index, top: rowSlice.startY - scrollY, boxShadow: (scrollX > 0 ? shadow : 'none') }}>
                        { rowSlice.rows.map((row, n) => {
                            const rowIndex = rowSlice.startIndex + n
                            const key = row?.index ?? `empty-${n}`
                            const isLastRow = (rowIndex == numberOfRows - 1) // numberOfRows counts the header as a row
                            const borderBottom = !isLastRow ? '1px solid #e6e6e6' : 'none'
                            const cellHeight = rowSlice.rowHeights[n]
                            const rowHeight = cellHeight + (isLastRow ? 8 : 0)
                            const value = row ? String(row.index + 1) : '' // For UI start counting at 1
                            return <div className="table-view-row" style={{ ...styles.row, height: rowHeight, borderBottom }} key={key}>
                                <TableCell width={indexWidth} height={cellHeight} value={value} isIndex={true} isLastColumn={false} isLastRow={isLastRow} scrollbarWidth={TableView.scrollbarWidth} />
                            </div>
                        })}
                    </div>
                    <div className="table-view-body" style={{ ...styles.body, left: startColumnX, top: rowSlice.startY - scrollY }}>
                        { rowSlice.rows.map((row, n) => {
                            const rowIndex = rowSlice.startIndex + n
                            const key = row?.index ?? `empty-${n}`
                            const isLastRow = (rowIndex == numberOfRows - 1) // numberOfRows counts the header as a row
                            const borderBottom = !isLastRow ? '1px solid #e6e6e6' : 'none'
                            const cellHeight = rowSlice.rowHeights[n] - 1 // -1 for border
                            const rowHeight = rowSlice.rowHeights[n] + (isLastRow ? 8 : 0)
                            const background = (rowIndex % 2 == 0) ? '#fcfcfc' : '#ffffff'
                            // Loader
                            if (fetchRange && rowIndex >= fetchRange.start && rowIndex < fetchRange.end) {
                                const rowWidth = totalBodyWidth
                                const innerRowHeight = rowHeight - 1 // -1 for border
                                const padding = 6
                                return <div className="table-view-row" style={{ ...styles.row, borderBottom, width: rowWidth, height: rowHeight, background }}>
                                    <ContentLoader viewBox={`0 0 ${rowWidth} ${innerRowHeight}`}>
                                        <rect x={padding} y={padding} width={rowWidth - (2 * padding)} height={innerRowHeight - (2 * padding)} />
                                    </ContentLoader>
                                </div>
                            }
                            // Regular render
                            return <div className="table-view-row" style={{ ...styles.row, borderBottom, height: rowHeight, background }} key={key}>{ columns.map((_column, j) => {
                                const value = row?.values[j] ?? ''
                                const width = columnWidths[j]
                                const isLastColumn = (j == columns.length - 1)
                                return <TableCell key={j} width={width} height={cellHeight} value={value} isIndex={false} isLastColumn={isLastColumn} isLastRow={isLastRow} scrollbarWidth={TableView.scrollbarWidth} />
                            }) }</div>
                        }) }
                    </div>
                </div>
            </div>
            <div className='table-view-scroll-view-container' style={{ ...styles.scrollViewContainer, pointerEvents: 'auto' }}>
                <div ref={this.scrollViewRef} className='table-view-scroll-view' style={{ ...styles.scrollView, marginLeft: indexWidth, marginTop: TableView.minRowHeight }} onScroll={this.handleScrollChanged}>
                    <div style={{ minWidth: '100%', width: totalBodyWidth, height: totalBodyHeight }}></div>
                </div>
            </div>
        </div>
    }

    handleScrollChanged() {
        const scrollX = this.scrollViewRef.current?.scrollLeft ?? 0
        const scrollY = this.scrollViewRef.current?.scrollTop ?? 0
        const scrollViewHeight = this.scrollViewRef.current?.clientHeight ?? 0
        const [ minY, maxY ] = [ scrollY, scrollY + scrollViewHeight ]
        this.setState((_state, props) => {
            const rowSlice = props.table.rowSlice({ minY, maxY }, { fetchIfNeeded: true })
                ?? { startIndex: 0, startY: 0, endY: 0, rows: [], rowHeights: [] }
            return { rowSlice, scrollX, scrollY, scrollViewHeight }
        })
    }
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        overflow: 'hidden',
    },
    tableView: {
        boxSizing: 'border-box',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #e6e6e6',
        userSelect: 'none',
        width: '100%',
        height: '100%',
    },
    scrollViewContainer: {
        display: 'flex',
        alignItems: 'stretch',
        position: 'absolute',
        top: 0,
        width: '100%',
        height: '100%',
    },
    scrollView: {
        overflow: 'auto',
    },
    table: {
        background: '#ffffff',
        transformStyle: 'preserve-3d',
        width: 'fit-content',
    },
    header: {
        position: 'relative',
        boxSizing: 'border-box',
        border: 'none',
        borderBottom: '1px solid #e6e6e6',
        backgroundColor: '#fafafa',
        textAlign: 'center',
        transform: 'translate3d(0, 0, 1px)',
        font: TableView.measureInfo.fonts.header,
    },
    index: {
        position: 'relative',
        zIndex: 1,
        background: '#fafafa',
        font: TableView.measureInfo.fonts.index,
    },
    body: {
        position: 'relative',
        zIndex: 0,
        font: TableView.measureInfo.fonts.body,
    },
    row: {
        boxSizing: 'border-box',
        display: 'flex',
    }
}

export default TableView