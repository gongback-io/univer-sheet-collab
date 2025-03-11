import {ICellData, IRange, Nullable, ObjectMatrix} from "@univerjs/core";

export type CellPayload = {
    docId: string
    sheetId: string,
    cells: ObjectMatrix<Nullable<ICellData>>
}
export type RangePayload = {
    docId: string
    sheetId: string,
    range: IRange
}



