import React from 'react'

import TableHeaderCell from './TableHeaderCell'
import TableCell from './TableCell'
import MeasureUtilities from '../utilities/MeasureUtilities'
import ObjectUtilities from '../utilities/ObjectUtilities'
import TableData, { RowSlice, TableColumnVM } from './TableData'
import { TableRow } from '../models/TableInfo'

interface Props {
    table: TableData
}

interface State {
    rowSlice: RowSlice
    scrollX: number
    scrollY: number
    fetchingRows: { startRow: number, endRow: number } | null
}

class TableView extends React.Component<Props, State> {
    scrollViewRef: React.RefObject<HTMLDivElement>

    static scrollbarWidth = 8
    static minRowHeight = 32

    constructor(props: Props) {
        super(props)
        this.state = {
            rowSlice: { startIndex: 0, startY: 0, endY: 0, rows: [], rowHeights: [] },
            scrollX: 0,
            scrollY: 0,
            fetchingRows: null,
        }
        this.scrollViewRef = React.createRef()
        this.onResize = this.onResize.bind(this)
        this.handleScrollChanged = this.handleScrollChanged.bind(this)
    }

    componentDidMount() {
        window.addEventListener('resize', this.onResize)
        this.handleScrollChanged()
    }

    componentWillUnmount(): void {
        window.removeEventListener('resize', this.onResize)
    }

    shouldComponentUpdate(props: Readonly<Props>, state: Readonly<State>): boolean {
        const { table: oldTable, ...oldProps } = this.props
        const { table: newTable, ...newProps } = props
        return oldTable !== newTable || !ObjectUtilities.isEqual(oldProps, newProps) || !ObjectUtilities.isEqual(this, state)
    }

    render() {
        const { table } = this.props
        const { rowSlice, scrollX, scrollY, fetchingRows } = this.state
        const { columns, numberOfRows } = table
        const indexWidth = computeIndexWidth(numberOfRows) // TODO: For filtered views, numberOfRows != maxLabel
        const columnWidths = columns.map(computeColumnWidth)
        const totalTableWidth = indexWidth + columnWidths.reduce((a, b) => a + b, 0)
        const totalBodyWidth = columnWidths.reduce((a, b) => a + b, 0)
        const totalBodyHeight = numberOfRows * TableView.minRowHeight
        const startColumnX = -scrollX
        const shadow = '0px 0px 4px 0px #e6e6e6'
        const availableWidth = 320//720 // TODO
        const availableHeight = 496

        return <div className="table-view-wrapper" style={styles.wrapper}>
            <div className='table-view-container' style={{ ...styles.container, width: availableWidth }}>
                <div className='table-view' style={{ ...styles.tableView, height: availableHeight }}>
                    <div className="table-view-table" style={styles.table}>
                        <div className="table-view-header" style={{ ...styles.header, left: startColumnX, height: TableView.minRowHeight, boxShadow: (scrollY > 0 ? shadow : 'none') }}>
                            <div className="table-view-row" style={{ ...styles.row, height: '100%' }}>
                            <TableHeaderCell key={''} content={''} isIndex={true} isLastColumn={false} scrollX={scrollX} width={indexWidth} scrollbarWidth={TableView.scrollbarWidth} />
                            { columns.map((column, j) => {
                                const isLastColumn = (j == columns.length - 1)
                                let width
                                if (isLastColumn) {
                                    width = (totalTableWidth < availableWidth) ? (columnWidths[j] + (availableWidth - totalTableWidth) - 8) : columnWidths[j]
                                } else {
                                    width = columnWidths[j]
                                }
                                return <TableHeaderCell key={column.id} content={column.name} isIndex={false} isLastColumn={isLastColumn} scrollX={scrollX} width={width} scrollbarWidth={TableView.scrollbarWidth} />
                            }) }</div>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <div className="table-view-index" style={{ ...styles.index, top: rowSlice.startY - scrollY, boxShadow: (scrollX > 0 ? shadow : 'none') }}>
                                { rowSlice.rows.map((row, n) => {
                                    if (!row) { return <div style={{ height: 32, backgroundColor: 'red' }}></div> } // TODO
                                    const rowIndex = rowSlice.startIndex + n
                                    const isLastRow = (rowIndex == numberOfRows - 1) // numberOfRows counts the header as a row
                                    const borderBottom = !isLastRow ? '1px solid #e6e6e6' : 'none'
                                    const cellHeight = rowSlice.rowHeights[n]
                                    const rowHeight = cellHeight + (isLastRow ? 8 : 0)
                                    const value = String(row.index)
                                    return <div className="table-view-row" style={{ ...styles.row, height: rowHeight, borderBottom }} key={row.index}>
                                        <TableCell width={indexWidth} height={cellHeight} value={value} isIndex={true} isLastColumn={false} isLastRow={isLastRow} scrollbarWidth={TableView.scrollbarWidth} />
                                    </div>
                                })}
                            </div>
                            <div className="table-view-body" style={{ ...styles.body, left: startColumnX, top: rowSlice.startY - scrollY }}>
                                { rowSlice.rows.map((row, n) => {
                                    if (!row) { return <div style={{ height: 32, backgroundColor: 'orange' }}></div> } // TODO
                                    const rowIndex = rowSlice.startIndex + n
                                    const isLastRow = (rowIndex == numberOfRows - 1) // numberOfRows counts the header as a row
                                    const borderBottom = !isLastRow ? '1px solid #e6e6e6' : 'none'
                                    const cellHeight = rowSlice.rowHeights[n]
                                    const rowHeight = rowSlice.rowHeights[n] + (isLastRow ? 8 : 0)
                                    const background = (rowIndex % 2 == 0) ? '#fcfcfc' : '#ffffff'
                                    const isLoading = fetchingRows && (rowIndex >= fetchingRows.startRow && rowIndex < fetchingRows.endRow)

                                    if (isLoading) {
                                        const width = Math.max(totalTableWidth, availableWidth - indexWidth) + 32 // TODO: Why do we need to add 32?
                                        return <div className="table-view-row" style={{ ...styles.row, borderBottom, width, height: rowHeight, background }}>
                                            {/* <ContentLoader viewBox={`0 0 ${width} ${height}`}>
                                                <rect x="6" y="6" width={width - 12} height={height - 12} />
                                            </ContentLoader> */}
                                        </div>
                                    }

                                    return <div className="table-view-row" style={{ ...styles.row, borderBottom, height: rowHeight, background }} key={row.index}>{ columns.map((_column, j) => {
                                        const value = row.values[j]
                                        const isLastColumn = (j == columns.length - 1)
                                        let width
                                        if (isLastColumn) {
                                            width = (totalTableWidth < availableWidth) ? (columnWidths[j] + (availableWidth - totalTableWidth) - 8) : columnWidths[j]
                                        } else {
                                            width = columnWidths[j]
                                        }
                                        return <TableCell key={j} width={width} height={cellHeight} value={value} isIndex={false} isLastColumn={isLastColumn} isLastRow={isLastRow} scrollbarWidth={TableView.scrollbarWidth} />
                                    }) }</div>
                                }) }
                            </div>
                        </div>
                    </div>
                    <div className='table-view-scroll-view-container' style={{ ...styles.scrollViewContainer, pointerEvents: 'auto' }}>
                        <div ref={this.scrollViewRef} className='table-view-scroll-view' style={{ ...styles.scrollView, marginLeft: indexWidth, marginTop: TableView.minRowHeight }} onScroll={this.handleScrollChanged}>
                            <div style={{ width: Math.max(totalBodyWidth, availableWidth - indexWidth), height: totalBodyHeight }}></div>
                        </div>
                    </div>
                    { availableHeight > (totalBodyHeight + 40) ? <div style={{ width: '100%', height: '1px', background: '#e6e6e6', position: 'absolute', left: 0, top: (totalBodyHeight + 40) }} /> : '' }
                </div>
            </div>
        </div>
    }

    // #region Updating
    onResize(_: UIEvent) { this.forceUpdate() }
    // #endregion

    // #region Interaction
    handleScrollChanged() {
        const scrollX = this.scrollViewRef.current?.scrollLeft ?? 0
        const scrollY = this.scrollViewRef.current?.scrollTop ?? 0
        const viewHeight = this.scrollViewRef.current?.clientHeight ?? 0
        const [ minY, maxY ] = [ scrollY, scrollY + viewHeight ]
        this.setState((state, props) => {
            const rowSliceNeedsUpdate = (minY < state.rowSlice.startY || maxY > state.rowSlice.endY)
            let rowSlice = state.rowSlice
            if (rowSliceNeedsUpdate) {
                rowSlice = props.table.rowSlice({ minY: scrollY, maxY: maxY })
                    ?? { startIndex: 0, startY: 0, endY: 0, rows: [], rowHeights: [] }
            }
            return { rowSlice, scrollX, scrollY }
        })
    }
    // #endregion
}

const enWidthRegular = MeasureUtilities.measureRegularText('\u2013', 10).width
const enWidthSemiBold = MeasureUtilities.measureSemiBoldText('\u2013', 10).width

function computeIndexWidth(rowCount: number): number {
    const maxIndexLength = String(rowCount).length
    const enWidth = (enWidthSemiBold * 1.1) // Emperical adjustment
    return Math.min(enWidth * maxIndexLength + 32, 512)
}

function computeColumnWidth(column: TableColumnVM): number {
    return Math.min(enWidthRegular * column.maxValueLength + 32, 512)
}

const styles: Record<string, React.CSSProperties> = {
    wrapper: {
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #e6e6e6',
        userSelect: 'none',
    },
    container: {
        position: 'relative',
        display: 'flex'
    },
    view: {
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
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
        fontWeight: 600
    },
    index: {
        position: 'relative',
        zIndex: 1,
        background: '#fafafa',
    },
    body: {
        position: 'relative',
        zIndex: 0,
    },
    row: {
        boxSizing: 'border-box',
        display: 'flex',
    }
}

export default TableView