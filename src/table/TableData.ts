import { TableColumn, TableInfo, TableRow } from "../models/TableInfo"

type LoadedPage = {
    rows: TableRow[]
    offset: number
    rowCount: number
}

type UnloadedTablePage = {
    rows?: undefined
    offset: number
    rowCount: number
}

type RowRange = { start: number, end: number }
type RangeY = { minY: number, maxY: number }
type Page = LoadedPage | UnloadedTablePage

const fixedRowHeight = 32

class TableData {
    tableID: string
    numberOfRows: number
    columns: TableColumn[]
    loadedPages: LoadedPage[]
    fetchState: { offset: number, count: number } | null = null

    constructor(tableInfo: TableInfo) {
        this.tableID = tableInfo.table_id
        this.numberOfRows = tableInfo.row_count
        this.columns = tableInfo.columns
        const firstPage = tableInfo.first_page
        this.loadedPages = [
            { rows: firstPage.rows, offset: firstPage.offset, rowCount: firstPage.row_count }
         ]
        this.iteratePages = this.iteratePages.bind(this)
    }

    fetchRowsIfNeeded(visibleRange: RangeY) { // Y-range or row range?
        // TODO
    }

    fetchRows(range: RowRange) {
        // TODO
    }

    rows(range: { minY: number, maxY: number }): (TableRow | null)[] {
        return []
    }

    rowAtY(y: number): number | null {
        const pageResult = this.findPage((page, pageY) => y >= pageY && y < pageY + (page.rowCount * fixedRowHeight))
        if (pageResult === null) { return null }
        const { page, y: pageY } = pageResult
        const row = page.offset + Math.floor((y - pageY) / fixedRowHeight)
        return row
    }

    findPage(condition: (page: Page, y: number) => boolean): { page: Page, y: number } | null {
        let result: { page: Page, y: number } | null = null
        this.iteratePages((page, y) => {
            if (condition(page, y)) {
                result = { page, y }
                return 'stop'
            }
        })
        return result
    }

    iterateRows(callback: (row: TableRow, y: number) => 'stop' | void) {
        this.iteratePages((page, pageY) => {
            if (!page.rows) { return }
            for (let i = 0; i < page.rowCount; i++) {
                const row = page.rows[i]
                const y = pageY + i * fixedRowHeight
                const result = callback(row, y)
                if (result === 'stop') { return 'stop' }
            }
        })
    }

    iteratePages(callback: (page: Page, y: number) => 'stop' | void) {
        let y = 0
        let row = 0
        for (const page of this.loadedPages) {
            // If there is a gap between the previous page and this page, return an unloaded page
            if (row < page.offset) {
                const rowCount = page.offset - row
                const result = callback({ offset: row, rowCount }, y)
                if (result === 'stop') { return }
                row = page.offset
                y += rowCount * fixedRowHeight
            }
            // Return the loaded page
            const result = callback(page, y)
            if (result === 'stop') { return }
            row = page.offset + page.rowCount
            y += page.rowCount * fixedRowHeight
        }
        // If there is a gap between the last page and the end of the table, return an unloaded page
        if (row < this.numberOfRows) {
            callback({ offset: row, rowCount: this.numberOfRows - row }, y)
        }
    }
}

export default TableData