
type ViewModel = {
    version: number
    updateHandler?: () => void
}

export type TableEditorVM = ViewModel & {
    editor: Object
    columns: TableColumn[]
    rowHeights: number[]
    totalBodyHeight: number
    numberOfRows: number
    startRow: number
    startRowY: number
    rows: TableRow[]
    scrollX: number
    scrollY: number
    selection: TBSelection | null
}

export type TableColumn = {
    id: string
    name: string
    maxValueLength: number
}

export type TableRow = {
    label: number
    cells: TableCell[]
}

export type TableCell = {
    value: string
}

// Legacy
export type TBSelection = {
    start: TBPosition
    end: TBPosition
}

export type TBPosition = {
    row: number
    column: number
}

// New Selection Types
export type TableSelection = TableRowSelection | TableColumnSelection | TableCellSelection

export type TableRowSelection = {
    type: 'row'
    row: number
}

export type TableColumnSelection = {
    type: 'column'
    column: number
}

export type TableCellSelection = {
    type: 'cell'
    row: number
    column: number
}
