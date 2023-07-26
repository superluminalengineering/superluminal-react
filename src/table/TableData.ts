import SessionController from "../controllers/SessionController"
import { TableInfo, TablePage, TableRow } from "../models/TableInfo"

const fetchDelay = 500 // ms

class TableData {
    tableID: string
    numberOfRows: number
    indexWidth: number
    columns: TableColumn[]
    totalHeight: number
    private loadedPages: LoadedPage[]
    private fetchState: FetchState = { state: 'idle' }
    onFetchRangeUpdated?: (range: RowRange | null) => void
    private measureInfo: MeasureInfo
    private readonly minRowHeight: number

    constructor(tableInfo: TableInfo, measureInfo: MeasureInfo) {
        this.minRowHeight = measureInfo.lineHeight + measureInfo.totalCellPadding.y
        this.tableID = tableInfo.table_id
        this.numberOfRows = tableInfo.row_count
        this.totalHeight = this.numberOfRows * this.minRowHeight
        this.measureInfo = measureInfo
        this.indexWidth = 0 // Updated later
        // Measure columns
        this.columns = tableInfo.columns.map((column) => {
            let width = measureTextWidth(column.label, measureInfo.fonts.header) + measureInfo.totalCellPadding.x
            if (width > measureInfo.maxColumnWidth) { width = measureInfo.maxColumnWidth }
            return { id: column.label, name: column.label, width: width }
        })
        // First page
        const { offset, row_count: rowCount, rows } = tableInfo.first_page
        const rowHeights = Array(rowCount).fill(this.minRowHeight)
        const pageHeight = rowCount * this.minRowHeight
        const firstPage: LoadedPage = { loaded: true, offset, rowCount, rows, rowHeights, pageHeight }
        this.loadedPages = [ firstPage ]
        this.updateMeasurements(firstPage)
    }

    // General

    rowSlice(range: { minY: number, maxY: number }, options?: { fetchIfNeeded?: boolean }): RowSlice | null {
        const fetchIfNeeded = options?.fetchIfNeeded ?? false
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
        // Start a fetch if needed
        if (fetchIfNeeded) {
            this.fetchRowsIfNeeded({ start: startIndex, end: startIndex + rows.length })
        }
        return { startIndex, startY, endY, rows, rowHeights }
    }

    // Fetching

    fetchRowsIfNeeded(visibleRange: RowRange) {
        // See if there is something to fetch
        const fetchRange = this.rowRangeToFetch(visibleRange)
        if (!fetchRange) { return }
        // See if we're already fetching the visible rows
        if (this.fetchState.state == 'fetching') {
            const currentFetchRange = this.fetchState.range
            if (visibleRange.start >= currentFetchRange.start && visibleRange.end <= currentFetchRange.end) { return null }
        }
        // See if we already have fetch scheduled for the visible rows
        let reusedTimeout: number | undefined = undefined
        if (this.fetchState.state == 'scheduled') {
            const pendingFetchRange = this.fetchState.range
            if (visibleRange.start >= pendingFetchRange.start && visibleRange.end <= pendingFetchRange.end) { return }
            // Different range, clear timeout
            clearTimeout(this.fetchState.timeout)
        }
        // Schedule a fetch
        const timeout = reusedTimeout ?? setTimeout(() => this.fetchRows(fetchRange), fetchDelay)
        this.fetchState = { state: 'scheduled', range: fetchRange, timeout }
    }

    private rowRangeToFetch(visibleRange: RowRange): RowRange | null {
        // Number of rows to fetch at once. Note actual number of rows fetched can change based on alignment / gap cover.
        const defaultFetchSize = 100
        // Align the starts/end of fetches to multiples of this number.
        const fetchAlignmentMultiple = 25
        // Maximum number of extra rows to fetch to cover a gap before/after the page.
        const extendFetchToCoverGapLimit = 25
        // Sanity checks
        if (this.numberOfRows === 0) { return null }
        // See what page start is in
        const startPage = this.loadedPages.find(x => x.offset <= visibleRange.start && visibleRange.start < x.offset + x.rowCount)
        if (startPage) {
            // See if that page contains the entire required range
            if (startPage.offset + startPage.rowCount >= visibleRange.end) { return null } // All loaded
            // Part of the range is not in this page
            const remainingRange = { start: startPage.offset + startPage.rowCount, end: visibleRange.end }
            return this.rowRangeToFetch(remainingRange)
        } else { // Start is not loaded
            // Get surrounding pages
            const nextPageIndex = this.loadedPages.findIndex(x => x.offset > visibleRange.start)
            let previousPage, nextPage
            if (nextPageIndex == -1) { // No next page, previous page is last page
                previousPage = (this.loadedPages.length > 0) ? this.loadedPages[this.loadedPages.length - 1] : null
                nextPage = null
            } else { // Next page exists
                previousPage = nextPageIndex > 0 ? this.loadedPages[nextPageIndex - 1] : null
                nextPage = this.loadedPages[nextPageIndex]
            }
            const endOfPreviousPage = previousPage ? (previousPage.offset + previousPage.rowCount) : 0
            const startOfNextPage = nextPage?.offset ?? this.numberOfRows
            // Determine start & end
            // Disregarding previous & next page (i.e. when jumping somewhere) we'd like to fetch 1/3 of the fetch size upwards (and 2/3 downwards)
            let start = Math.max(visibleRange.start - Math.floor(defaultFetchSize/3), endOfPreviousPage)
            let end = start + defaultFetchSize
            if (end > startOfNextPage) { // If next page is soon, count fetch size backwards from there
                end = startOfNextPage
                start = Math.max(end - defaultFetchSize, endOfPreviousPage)
            }
            // If there is only a small gap to the previous/next page, fetch some extra rows to cover the gap.
            // Otherwise, round start/end up/down to a clean multiple.
            if (start - endOfPreviousPage < extendFetchToCoverGapLimit) {
                start = endOfPreviousPage
            } else if (start % fetchAlignmentMultiple !== 0) {
                start -= (start % fetchAlignmentMultiple)
            }
            if ((startOfNextPage - end) < extendFetchToCoverGapLimit) {
                end = startOfNextPage
            } else if (end % fetchAlignmentMultiple !== 0) {
                end += fetchAlignmentMultiple - (end % fetchAlignmentMultiple)
            }
            // Fetch
            return { start, end }
        }
    }

    private fetchRows(range: RowRange) {
        const [offset, count] = [range.start, range.end - range.start]
        if (count <= 0) { return }
        SessionController.getInstance().getTablePage(this.tableID, offset, count)
        clearTimeout(this.fetchState.timeout)
        this.fetchState = { state: 'fetching', range }
        this.onFetchRangeUpdated?.(range)
    }

    handleFetchedPage(page: TablePage) {
        if (page.table_id != this.tableID) { return }
        // Check current fetch state still relates to same range
        // If outdated, we still want to insert the page, but we don't want to reset the fetch state
        const offset = this.fetchState.range?.start
        const isOutdated = (page.offset != offset) // Count can be less than requested for the last page
        // Create page
        const { offset: pageOffset, row_count: rowCount, rows } = page
        const rowHeights = Array(rowCount).fill(this.minRowHeight)
        const pageHeight = rowCount * this.minRowHeight
        const loadedPage: LoadedPage = { loaded: true, offset: pageOffset, rowCount, rows, rowHeights, pageHeight }
        this.insertPage(loadedPage)
        // Reset fetch state & notify
        if (!isOutdated) {
            clearTimeout(this.fetchState.timeout)
            this.fetchState = { state: 'idle' }
            this.onFetchRangeUpdated?.(null)
        }
    }

    getFetchRange(): RowRange | null {
        if (this.fetchState.state !== 'fetching') { return null }
        return this.fetchState.range
    }

    // Updating

    private insertPage(page: LoadedPage) {
        // Insert page at the correct position
        let index = this.loadedPages.findIndex(x => x.offset > page.offset)
        if (index == -1) { index = this.loadedPages.length }
        this.loadedPages.splice(index, 0, page)
        // Remove overlap with adjacent pages
        while (true) {
            if (index != 0) {
                const previousPage = this.loadedPages[index - 1]
                const overlap = (previousPage.offset + previousPage.rowCount) - page.offset
                if (overlap >= previousPage.rowCount) { // Page is completely overlapped
                    this.loadedPages.splice(index - 1, 1)
                    index -= 1
                    continue
                } else if (overlap > 0) {
                    previousPage.rowCount -= overlap
                    previousPage.rows.splice(-overlap)
                    const removedHeight = previousPage.rowHeights.splice(-overlap).reduce((a, b) => a + b, 0)
                    previousPage.pageHeight -= removedHeight
                }
            }
            if (index != this.loadedPages.length - 1) {
                const nextPage = this.loadedPages[index + 1]
                const overlap = (page.offset + page.rowCount) - nextPage.offset
                if (overlap >= nextPage.rowCount) { // Page is completely overlapped
                    this.loadedPages.splice(index + 1, 1)
                    continue
                } else if (overlap > 0) {
                    nextPage.offset += overlap
                    nextPage.rowCount -= overlap
                    nextPage.rows.splice(0, overlap)
                    const removedHeight = nextPage.rowHeights.splice(0, overlap).reduce((a, b) => a + b, 0)
                    nextPage.pageHeight -= removedHeight
                }
            }
            break
        }
        this.updateMeasurements(page)
    }

    private updateMeasurements(page: LoadedPage) {
        const { fonts, totalCellPadding, lineHeight, maxColumnWidth } = this.measureInfo
        const maxTextWidth = (maxColumnWidth - totalCellPadding.x)
        // Go through all rows and measure them
        let maxIndex = this.numberOfRows - 1 // We know index gets at least this high
        for (let i = 0; i < page.rows.length; i += 1) {
            const row = page.rows[i]
            if (row.index > maxIndex) { maxIndex = row.index }
            for (let j = 0; j < row.values.length; j += 1) {
                const value = row.values[j]
                const column = this.columns[j]
                let { width, height } = measureWrappedTextBounds(value, fonts.body, lineHeight, maxTextWidth)
                width += totalCellPadding.x
                height += totalCellPadding.y
                // Update column width
                if (width > column.width) {
                    column.width = width
                }
                // Update row height
                if (height > page.rowHeights[i]) {
                    const delta = (height - page.rowHeights[i])
                    page.rowHeights[i] = height
                    page.pageHeight += delta
                    this.totalHeight += delta
                }
            }
        }
        // Update index width
        const maxDisplayIndex = String(maxIndex + 1) // In UI we start counting at 1
        for (let i = 0; i <= 9; i += 1) { // Try all digits to see which is widest
            const indexWidth = measureTextWidth(maxDisplayIndex.replace(/./g, String(i)), fonts.index) + totalCellPadding.x
            if (indexWidth > this.indexWidth) { this.indexWidth = indexWidth }
        }
    }

    // Convenience methods

    private rowIndexAtY(y: number): number | null {
        const pageResult = this.findPage((page, pageY) => y >= pageY && y < pageY + page.pageHeight)
        if (pageResult === null) { return null }
        let { page, y: currentY } = pageResult
        for (let i = 0; i < page.rowCount; i++) {
            const height = page.loaded ? page.rowHeights[i] : this.minRowHeight
            if (y >= currentY && y < currentY + height) {
                return page.offset + i
            }
            currentY += height
        }
        return null
    }

    private findPage(condition: (page: Page, y: number) => boolean): { page: Page, y: number } | null {
        let result: { page: Page, y: number } | null = null
        this.iteratePages((page, y) => {
            if (condition(page, y)) {
                result = { page, y }
                return 'stop'
            }
        })
        return result
    }

    private iterateRows(start: number, callback: (row: (TableRow | null), index: number, y: number, height: number) => 'stop' | void) {
        this.iteratePages((page, pageY) => {
            if (start >= page.offset + page.rowCount) { return }
            let y = pageY
            for (let i = 0; i < page.rowCount; i++) {
                const rowIndex = page.offset + i
                const rowY = y
                let row: TableRow | null = null
                let rowHeight = this.minRowHeight
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

    private iteratePages(callback: (page: Page, y: number) => 'stop' | void) {
        let y = 0
        let row = 0
        for (const page of this.loadedPages) {
            // If there is a gap between the previous page and this page, return an unloaded page
            if (row < page.offset) {
                const rowCount = page.offset - row
                const pageHeight = rowCount * this.minRowHeight
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
            const pageHeight = rowCount * this.minRowHeight
            callback({ loaded: false, offset: row, rowCount: this.numberOfRows - row, pageHeight }, y)
        }
    }
}

// Measure

export type MeasureInfo = {
    fonts: { header: string, index: string, body: string },
    totalCellPadding: { x: number, y: number },
    lineHeight: number,
    maxColumnWidth: number
}

const canvas = document.createElement('canvas')
const context = canvas.getContext('2d')!
const textMeasurementDiv = document.createElement('div')

function measureTextWidth(text: string, font: string): number {
    if (context.font != font) {
        context.font = font
    }
    return context.measureText(text).width
}

function measureWrappedTextBounds(text: string, font: string, lineHeight: number, maxWidth: number): { width: number, height: number } {
    const totalWidth = measureTextWidth(text, font)
    // Single line
    if (totalWidth <= maxWidth) {
        return { width: totalWidth, height: lineHeight }
    }
    // Multiple lines
    textMeasurementDiv.style.width = `${maxWidth}px`
    textMeasurementDiv.style.font = font
    textMeasurementDiv.style.lineHeight = `${lineHeight}px`
    document.body.appendChild(textMeasurementDiv)
    textMeasurementDiv.textContent = text
    const height = textMeasurementDiv.offsetHeight
    document.body.removeChild(textMeasurementDiv)
    return { width: maxWidth, height: height }
}

// Public types

export type RowRange = { start: number, end: number }

export type RowSlice = {
    startIndex: number
    startY: number
    endY: number
    rows: (TableRow | null)[]
    rowHeights: number[]
}

export type TableColumn = {
    id: string
    name: string
    width: number
}

// Private types

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

type FetchState =
    { state: 'idle', range?: undefined, timeout?: undefined } |
    { state: 'scheduled', range: RowRange, timeout: number } |
    { state: 'fetching', range: RowRange, timeout?: undefined }

export default TableData