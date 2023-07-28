import React from 'react';

import TableData from './TableData';
import TableView from './TableView';
import { TableInfo } from '../models/TableInfo';

interface Props {
    table: TableInfo
}

interface State {
    tableData: TableData
}

class TablePreview extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        const tableData = new TableData(props.table, TableView.measureInfo)
        this.state = { tableData }
    }

    static getDerivedStateFromProps(props: Props, state: State) {
        const { table } = props
        if (table.table_id !== state.tableData.tableID) {
            const tableData = new TableData(table, TableView.measureInfo)
            return { tableData }
        }
        return null
    }

    render() {
        const { tableData } = this.state
        return <div style={styles.tablePreview}>
            <TableView table={tableData} />
        </div>
    }
}

const styles: Record<string, React.CSSProperties> = {
    tablePreview: {
        display: 'flex',
        justifyContent: 'center',
        maxHeight: '240px'
    }
}

export default TablePreview;