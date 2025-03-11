import {ICellData, Nullable, ObjectMatrix, Workbook} from "@univerjs/core";
import {CellPayload} from "../types";


export function getOldCells(workbook: Workbook, cellPayloads: CellPayload[]) {
    const oldCells:CellPayload[] = []
    cellPayloads.forEach(({sheetId, cells}) => {
        const worksheet = workbook.getSheetBySheetId(sheetId);
        if (worksheet) {
            const originalCellMatrix = new ObjectMatrix<Nullable<ICellData>>();
            cells.forValue((row, col) => {
                const cell = worksheet.getCellMatrix().getValue(row, col);
                originalCellMatrix!.setValue(
                    row,
                    col,
                    cell ? JSON.parse(JSON.stringify(cell)) : cell
                )
            })
            oldCells!.push({
                docId: workbook.getUnitId(),
                sheetId,
                cells: originalCellMatrix
            })
        }
    })
    return oldCells;
}
