
export type TableInfo = {
    table_id: string
    columns: TableColumn[]
    row_count: number
    first_page: TablePage
}

export type TableColumn = {
    label: string
}

export type TablePage = {
    table_id: string
    offset: number
    row_count: number
    rows: TableRow[]
}

export type TableRow = {
    index: number
    values: string[]
}
