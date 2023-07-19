import React from 'react'

import TableHeaderCell from './TableHeaderCell'
import TableCell from './TableCell'
import { TBPosition, TableColumn, TableEditorVM } from './TableEditorVM'
import MeasureUtilities from '../utilities/MeasureUtilities'
import ObjectUtilities from '../utilities/ObjectUtilities'

interface Props {
    viewModel: TableEditorVM
}

interface State {
    viewModelVersion: number,
    fetchingRows: number[] | null
}

class TableView extends React.Component<Props, State> {
    containerRef: React.RefObject<HTMLDivElement>
    scrollViewRef: React.RefObject<HTMLDivElement>
    tableViewBodyRef: React.RefObject<HTMLTableSectionElement>

    static scrollbarWidth = 8
    static minRowHeight = 32

    constructor(props: Props) {
        super(props)
        this.state = {
            viewModelVersion: props.viewModel.version,
            fetchingRows: null,
        }
        this.containerRef = React.createRef()
        this.scrollViewRef = React.createRef()
        this.tableViewBodyRef = React.createRef()
        this.onResize = this.onResize.bind(this)
        this.onScroll = this.onScroll.bind(this)
        this.onMouseDown = this.onMouseDown.bind(this)
        this.onMouseMove = this.onMouseMove.bind(this)
        this.onMouseUp = this.onMouseUp.bind(this)
        this.onDoubleClick = this.onDoubleClick.bind(this)
        this.onKeyDown = this.onKeyDown.bind(this)
        this.onClickAnywhere = this.onClickAnywhere.bind(this)
        this.handleMouseEvent = this.handleMouseEvent.bind(this)
        this.handleKeyboardEvent = this.handleKeyboardEvent.bind(this)
        this.showFullData = this.showFullData.bind(this)
        this.updateQuery = this.updateQuery.bind(this)
        props.viewModel.updateHandler = this.onViewModelUpdate.bind(this)
    }

    componentDidMount() {
        addEventListener('keydown', this.onKeyDown, false)
        document.addEventListener('mousedown', this.onClickAnywhere)
        window.addEventListener('resize', this.onResize)
        // ProjectController.getInstance().then((instance) => instance.addListener(this))
    }

    componentWillUnmount(): void {
        removeEventListener('keydown', this.onKeyDown, false)
        document.removeEventListener('mousedown', this.onClickAnywhere)
        window.removeEventListener('resize', this.onResize)
        // ProjectController.getInstance().then((instance) => instance.removeListener(this))
    }

    onViewModelUpdate(diff: Partial<TableEditorVM>) {
        this.setState({ viewModelVersion: this.props.viewModel.version })
    }

    shouldComponentUpdate(props: Readonly<Props>, state: Readonly<State>): boolean {
        const { viewModel: {}, ...oldProps } = this.props
        const { viewModel: {}, ...newProps } = props
        return !ObjectUtilities.isEqual(oldProps, newProps) || !ObjectUtilities.isEqual(this.state, state)
    }

    render() {
        const { viewModel } = this.props
        const { fetchingRows } = this.state
        const { editor, columns, rowHeights, totalBodyHeight, numberOfRows, startRow, rows, startRowY, scrollX, scrollY, selection } = viewModel
        const indexWidth = computeIndexWidth(numberOfRows) // TODO: For filtered views, numberOfRows != maxLabel
        const columnWidths = columns.map(computeColumnWidth)
        console.log(indexWidth, columnWidths)
        const totalTableWidth = indexWidth + columnWidths.reduce((a, b) => a + b, 0)
        const totalBodyWidth = columnWidths.reduce((a, b) => a + b, 0)
        const startColumnX = -scrollX
        const shadow = '0px 0px 4px 0px var(--black10)'
        function isPositionSelected(position: TBPosition): boolean {
            if (!selection) { return false }
            const minRow = Math.min(selection.start.row, selection.end.row)
            const maxRow = Math.max(selection.start.row, selection.end.row)
            const minColumn = Math.min(selection.start.column, selection.end.column)
            const maxColumn = Math.max(selection.start.column, selection.end.column)
            return position.row >= minRow && position.row <= maxRow && position.column >= minColumn && position.column <= maxColumn
        }
        const availableWidth = window.innerWidth
        const availableHeight = window.innerHeight

        return <div className="table-view-wrapper" style={styles.wrapper}>
            <div ref={this.containerRef} className='table-view-container' style={{ ...styles.container, width: availableWidth }}>
                <div className='table-view' style={{ ...styles.tableView, height: availableHeight }} onMouseDown={this.onMouseDown} onMouseMove={this.onMouseMove} onMouseUp={this.onMouseUp} onDoubleClick={this.onDoubleClick} >
                    <div className="table-view-table" style={styles.table}>
                        <div className="table-view-header" style={{ ...styles.header, left: startColumnX, height: TableView.minRowHeight, boxShadow: (scrollY > 0 ? shadow : 'none') }}>
                            <div className="table-view-row" style={{ ...styles.row, height: '100%' }}>
                            <TableHeaderCell key={''} editor={editor} column={{ id: '', name: '', maxValueLength: String(numberOfRows).length }} isIndex={true} isLastColumn={false} scrollX={scrollX} width={indexWidth} isSelected={isPositionSelected({ row: 0, column: 0 })} scrollbarWidth={TableView.scrollbarWidth} />
                            { columns.map((column, j) => {
                                const isLastColumn = (j == columns.length - 1)
                                const isSelected = isPositionSelected({ row: 0, column: j-1 })
                                let width
                                if (isLastColumn) {
                                    width = (totalTableWidth < availableWidth) ? (columnWidths[j] + (availableWidth - totalTableWidth) - 8) : columnWidths[j]
                                } else {
                                    width = columnWidths[j]
                                }
                                return <TableHeaderCell key={column.id} editor={editor} column={column} isIndex={false} isLastColumn={isLastColumn} scrollX={scrollX} width={width} isSelected={isSelected} scrollbarWidth={TableView.scrollbarWidth} />
                            }) }</div>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <div className="table-view-index" style={{ ...styles.index, top: startRowY - scrollY, boxShadow: (scrollX > 0 ? shadow : 'none') }}>
                                { rows.map((row, n) => {
                                    const rowIndex = startRow + n
                                    const isLastRow = (rowIndex == numberOfRows - 1) // numberOfRows counts the header as a row
                                    const isSelected = isPositionSelected({ row: rowIndex, column: 0 })
                                    const borderBottom = !isLastRow ? '1px solid var(--black10)' : 'none'
                                    const height = rowHeights[n] + (isLastRow ? 8 : 0)
                                    const value = String(row.label)
                                    return <div className="table-view-row" style={{ ...styles.row, height, borderBottom }} key={row.label}>
                                        <TableCell width={indexWidth} height={rowHeights[n]} value={value} isIndex={true} isLastColumn={false} isLastRow={isLastRow} isSelected={isSelected} editor={editor} scrollbarWidth={TableView.scrollbarWidth} />
                                    </div>
                                })}
                            </div>
                            <div ref={this.tableViewBodyRef} className="table-view-body" style={{ ...styles.body, left: startColumnX, top: startRowY - scrollY }}>
                                { rows.map((row, n) => {
                                    const rowIndex = startRow + n
                                    const isLastRow = (rowIndex == numberOfRows - 1) // numberOfRows counts the header as a row
                                    const borderBottom = !isLastRow ? '1px solid var(--black10)' : 'none'
                                    const height = rowHeights[n] + (isLastRow ? 8 : 0)
                                    const background = (rowIndex % 2 == 0) ? 'var(--black2)' : '#FFFFFF'
                                    var isLoading = false
                                    if (fetchingRows) {
                                        isLoading = fetchingRows[0] <= rowIndex && rowIndex < fetchingRows[1]
                                    }

                                    if (isLoading) {
                                        const width = Math.max(totalTableWidth, availableWidth - indexWidth) + 32 // TODO: Why do we need to add 32?
                                        return <div className="table-view-row" style={{ ...styles.row, borderBottom, width, height, background }}>
                                            {/* <ContentLoader viewBox={`0 0 ${width} ${height}`}>
                                                <rect x="6" y="6" width={width - 12} height={height - 12} />
                                            </ContentLoader> */}
                                        </div>
                                    }

                                    return <div className="table-view-row" style={{ ...styles.row, borderBottom, height, background }} key={row.label}>{ columns.map((_column, j) => {
                                        const cell = row.cells[j]
                                        const isLastColumn = (j == columns.length - 1)
                                        const isSelected = isPositionSelected({ row: rowIndex, column: j+1 })
                                        let width
                                        if (isLastColumn) {
                                            width = (totalTableWidth < availableWidth) ? (columnWidths[j] + (availableWidth - totalTableWidth) - 8) : columnWidths[j]
                                        } else {
                                            width = columnWidths[j]
                                        }
                                        return <TableCell key={j} width={width} height={rowHeights[n]} value={cell.value} isIndex={false} isLastColumn={isLastColumn} isLastRow={isLastRow} isSelected={isSelected} editor={editor} scrollbarWidth={TableView.scrollbarWidth} />
                                    }) }</div>
                                }) }
                            </div>
                        </div>
                    </div>
                    <div className='table-view-scroll-view-container' style={{ ...styles.scrollViewContainer, pointerEvents: 'auto' }}>
                        <div ref={this.scrollViewRef} className='table-view-scroll-view' style={{ ...styles.scrollView, marginLeft: indexWidth, marginTop: TableView.minRowHeight }} onScroll={this.onScroll}>
                            <div style={{ width: Math.max(totalBodyWidth, availableWidth - indexWidth), height: totalBodyHeight }}></div>
                        </div>
                    </div>
                    { availableHeight > (totalBodyHeight + 40) ? <div style={{ width: '100%', height: '1px', background: 'var(--black10)', position: 'absolute', left: 0, top: (totalBodyHeight + 40) }} /> : '' }
                </div>
            </div>
        </div>
    }

    // #region Updating
    onResize(_: UIEvent) { this.forceUpdate() }
    onTableStartedFetchingRows(startRow: number, endRow: number): void { this.setState({ fetchingRows: [ startRow, endRow ] }) }
    onTableFinishedFetchingRows(_startRow: number, _endRow: number): void { this.setState({ fetchingRows: null }) }
    // #endregion

    // #region Interaction
    onScroll(_event: React.UIEvent<HTMLDivElement, UIEvent>) {
        const scrollX = this.scrollViewRef.current?.scrollLeft ?? 0
        const scrollY = this.scrollViewRef.current?.scrollTop ?? 0
        const availableHeight = window.innerHeight - 48 - 40 // 48 is the height of the nav bar and 40 is the height of the tab bar
        const visibleRowCount = Math.ceil(availableHeight / TableView.minRowHeight) // This is an overestimate
        // IPC.callFunctionReturnless(this.props.viewModel.editor, 'handleScroll', scrollX, scrollY, visibleRowCount)
        console.log(scrollY)
        // Update visible rows from table data
    }

    onMouseDown(e: React.MouseEvent) {
        this.handleMouseEvent(e)
    }

    onMouseMove(e: React.MouseEvent) {
        this.handleMouseEvent(e)
    }

    onMouseUp(e: React.MouseEvent) {
        this.handleMouseEvent(e)
    }

    onDoubleClick(e: React.MouseEvent) {
        this.handleMouseEvent(e)
    }

    onKeyDown(e: KeyboardEvent) {
        this.handleKeyboardEvent(e)
    }

    handleMouseEvent(e: React.MouseEvent) {
        const { viewModel } = this.props
        const { startRow, startRowY, columns, numberOfRows, rowHeights, scrollX, scrollY } = viewModel
        // Determine local coordinates
        const table = this.containerRef.current
        if (!table || columns.length == 0) { return }
        const tableRect = table.getBoundingClientRect()
        const [ex, ey] = [e.clientX - tableRect.x, e.clientY - tableRect.y]
        // Determine row
        var rowIndex = 0
        const headerHeight = TableView.minRowHeight
        var offsetY = startRowY
        if (ey >= headerHeight) {
            var rowN = 0
            const yInBody = ey - headerHeight + scrollY
            while (yInBody > offsetY + rowHeights[rowN]) {
                offsetY += rowHeights[rowN]
                rowN += 1
            }
            rowIndex = startRow + rowN
        }
        // Determine column
        let columnIndex = 0
        const indexWidth = computeIndexWidth(numberOfRows)
        if (ex >= indexWidth) {
            const columnWidths = columns.map(computeColumnWidth)
            const totalTableWidth = (columnWidths.length > 0 ? columnWidths.reduce((a, b) => a + b, 0) : 0)
            const availableWidth = window.innerWidth //- ProjectController.instance.navigationPaneWidth - ProjectController.instance.rightPaneWidth
            const bodyX = ex - indexWidth + scrollX
            columnIndex = 1
            let xRemaining = bodyX
            while (columnIndex < columns.length) {
                let columnWidth
                if (columnIndex == columns.length - 1) {
                    columnWidth = (totalTableWidth < availableWidth) ? (columnWidths[columnIndex] + (availableWidth - totalTableWidth) - 8) : columnWidths[columnIndex]
                } else {
                    columnWidth = columnWidths[columnIndex]
                }
                if (xRemaining < columnWidth) { break }
                xRemaining -= columnWidth
                columnIndex += 1
            }
        }
        // Send
        const position: TBPosition = { row: rowIndex, column: columnIndex }
        if (position.row < 0 || position.row >= viewModel.numberOfRows || position.column < 0 || position.column >= columns.length) { return }
        const data = {
            type: e.type,
            x: ex,
            y: ey,
            button: e.button,
            buttons: e.buttons,
            detail: e.detail,
            ctrlKey: e.ctrlKey,
            altKey: e.altKey,
            metaKey: e.metaKey,
            shiftKey: e.shiftKey,
        }
        // IPC.callFunctionReturnless(viewModel.editor, 'handleMouseEvent', data, position)
        // Mark handled
        e.preventDefault()
        // e.stopPropagation()
    }

    handleKeyboardEvent(e: KeyboardEvent) {
        const { editor, selection } = this.props.viewModel
        // Send
        const data = {
            type: e.type,
            key: e.key,
            ctrlKey: e.ctrlKey,
            altKey: e.altKey,
            metaKey: e.metaKey,
            shiftKey: e.shiftKey,
            repeat: e.repeat,
            location: e.location,
        }
        // IPC.callFunctionReturnless(editor, 'handleKeyboardEvent', data)
        // Mark handled
        if (selection != null) {
            e.preventDefault()
            e.stopPropagation()
        }
    }

    onClickAnywhere(e: MouseEvent) {
        this.clearSelectionIfNeeded(e)
    }

    clearSelectionIfNeeded(e: MouseEvent) {
        if (this.props.viewModel.selection == null) { return }
        const rect = this.containerRef.current?.getBoundingClientRect()
        if (!rect) { return }
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
            // IPC.callFunctionReturnless(null, 'clearSelection')
        }
    }

    showFullData() {
        const { viewModel } = this.props
        // IPC.callFunctionReturnless(viewModel.editor, 'showFullData')
    }

    updateQuery() {
        const { viewModel } = this.props
        // IPC.callFunctionReturnless(viewModel.editor, 'updateQuery')
    }
    // #endregion
}

const enWidthRegular = MeasureUtilities.measureRegularText('\u2013', 10).width
const enWidthSemiBold = MeasureUtilities.measureSemiBoldText('0', 10).width

function computeIndexWidth(rowCount: number): number {
    const maxIndexLength = String(rowCount).length
    const enWidth = (enWidthSemiBold * 1.1) // Emperical adjustment
    return Math.min(enWidth * maxIndexLength + 32, 512)
}

function computeColumnWidth(column: TableColumn): number {
    return Math.min(enWidthRegular * column.maxValueLength + 32, 512)
}

const styles: Record<string, React.CSSProperties> = {
    wrapper: {
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    container: {
        position: 'relative',
        display: 'flex',
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
        fontFamily: 'var(--regularFont)',
        background: '#FFFFFF',
        transformStyle: 'preserve-3d',
        width: 'fit-content',
    },
    header: {
        position: 'relative',
        boxSizing: 'border-box',
        border: 'none',
        borderBottom: '1px solid var(--black10)',
        backgroundColor: '#FAFAFA',
        textAlign: 'center',
        transform: 'translate3d(0, 0, 1px)',
        fontFamily: 'var(--semiBoldFont)',
    },
    index: {
        position: 'relative',
        zIndex: 1,
        background: '#FAFAFA',
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