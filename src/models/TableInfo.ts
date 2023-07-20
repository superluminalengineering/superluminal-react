
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

// Type Guards

export function isTableColumn(value: any): value is TableColumn {
    if (typeof value !== 'object' || value == null) { return false }
    const { label } = value
    if (typeof label !== 'string') { return false }
    return true
}

export function isTableRow(value: any): value is TableRow {
    if (typeof value !== 'object' || value == null) { return false }
    const { index, values } = value
    if (typeof index !== 'number') { return false }
    if (!Array.isArray(values) || !values.every(val => typeof val === 'string')) { return false }
    return true
}

export function isTablePage(value: any): value is TablePage {
    if (typeof value !== 'object' || value == null) { return false }
    const { table_id, offset, row_count, rows } = value
    if (typeof table_id !== 'string') { return false }
    if (typeof offset !== 'number') { return false }
    if (typeof row_count !== 'number') { return false }
    if (!Array.isArray(rows) || !rows.every(isTableRow)) { return false }
    return true
}

export function isTableInfo(value: any): value is TableInfo {
    if (typeof value !== 'object' || value == null) { return false }
    const { table_id, columns, row_count, first_page } = value
    if (typeof table_id !== 'string') { return false }
    if (!Array.isArray(columns) || !columns.every(isTableColumn))  { return false }
    if (typeof row_count !== 'number') { return false }
    if (!isTablePage(first_page)) { return false }
    return true
}