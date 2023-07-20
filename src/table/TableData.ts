import { TableInfo, TableRow } from "../models/TableInfo"

type LoadedPage = {
    loaded: true
    offset: number
    rowCount: number
    rows: TableRow[]
    rowHeights: number[]
    pageHeight: number
}

type UnloadedTablePage = {
    loaded: false
    offset: number
    rowCount: number
    pageHeight: number
}
type Page = LoadedPage | UnloadedTablePage

export type RowSlice = {
    startIndex: number
    startY: number
    endY: number
    rows: (TableRow | null)[]
    rowHeights: number[]
}

type RowRange = { start: number, end: number }
type YRange = { minY: number, maxY: number }

const minimumRowHeight = 32

class TableData {
    tableID: string
    numberOfRows: number
    columns: TableColumnVM[]
    loadedPages: LoadedPage[]
    totalTableHeight: number
    fetchState: { offset: number, count: number } | null = null

    constructor(tableInfo: TableInfo) {
        this.tableID = tableInfo.table_id
        this.numberOfRows = tableInfo.row_count
        this.columns = tableInfo.columns.map((column) => ({ id: column.label, name: column.label, maxValueLength: 16 }))
        // First page
        const { offset, row_count: rowCount, rows } = tableInfo.first_page
        const rowHeights = Array(rowCount).fill(minimumRowHeight)
        const pageHeight = rowCount * minimumRowHeight
        const firstPage: LoadedPage = { loaded: true, offset, rowCount, rows, rowHeights, pageHeight }
        this.loadedPages = [ firstPage ]
        // Total table height
        this.totalTableHeight = firstPage.pageHeight + (this.numberOfRows - firstPage.rowCount) * minimumRowHeight
        this.iteratePages = this.iteratePages.bind(this)
    }

    fetchRowsIfNeeded(visibleRange: YRange) { // Y-range or row range?
        // TODO
    }

    fetchRows(range: RowRange) {
        // TODO
    }

    rowSlice(range: { minY: number, maxY: number }): RowSlice | null {
        const startRow = (range.minY >= 0) ? this.rowIndexAtY(range.minY) : 0
        if (startRow === null) { return null }
        // Collect rows
        let [ startIndex, startY, endY ] = [ 0, 0, 0 ]
        let rows: (TableRow | null)[] = []
        let rowHeights: number[] = []
        this.iterateRows(startRow, (row, index, y, height) => {
            if (y > range.maxY) { return 'stop' }
            if (rows.length === 0) { [startIndex, startY] = [index, y] }
            endY = y + height
            rows.push(row)
            rowHeights.push(height)
        })
        if (rows.length === 0) { return null }
        return { startIndex, startY, endY, rows, rowHeights }
    }

    rowIndexAtY(y: number): number | null {
        const pageResult = this.findPage((page, pageY) => y >= pageY && y < pageY + page.pageHeight)
        if (pageResult === null) { return null }
        let { page, y: currentY } = pageResult
        for (let i = 0; i < page.rowCount; i++) {
            const height = page.loaded ? page.rowHeights[i] : minimumRowHeight
            if (y >= currentY && y < currentY + height) {
                return page.offset + i
            }
            currentY += height
        }
        return null
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

    rowHeight(page: Page, i: number): number {
        return page.loaded ? page.rowHeights[i] : (page.rowCount * minimumRowHeight)
    }

    iterateRows(start: number, callback: (row: (TableRow | null), index: number, y: number, height: number) => 'stop' | void) {
        this.iteratePages((page, pageY) => {
            if (start >= page.offset + page.rowCount) { return }
            let y = pageY
            for (let i = 0; i < page.rowCount; i++) {
                const rowIndex = page.offset + i
                const rowY = y
                let row: TableRow | null = null
                let rowHeight = minimumRowHeight
                if (page.loaded) {
                    row = page.rows[i]
                    rowHeight = page.rowHeights[i]
                }
                y += rowHeight
                if (start > rowIndex) { continue }
                // Perform callback
                const result = callback(row, rowIndex, rowY, rowHeight)
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
                const pageHeight = rowCount * minimumRowHeight
                const result = callback({ loaded: false, offset: row, rowCount, pageHeight }, y)
                if (result === 'stop') { return }
                row = page.offset
                y += pageHeight
            }
            // Return the loaded page
            const result = callback(page, y)
            if (result === 'stop') { return }
            row = page.offset + page.rowCount
            y += page.pageHeight
        }
        // If there is a gap between the last page and the end of the table, return an unloaded page
        if (row < this.numberOfRows) {
            const rowCount = (this.numberOfRows - row)
            const pageHeight = rowCount * minimumRowHeight
            callback({ loaded: false, offset: row, rowCount: this.numberOfRows - row, pageHeight }, y)
        }
    }
}

export type TableColumnVM = {
    id: string
    name: string
    maxValueLength: number
}

export default TableData