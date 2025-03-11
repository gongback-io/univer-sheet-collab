import {CellPayload, RangePayload} from "../types";
import {DocId} from "../../../types";
import {ICommandInfo} from "@univerjs/core";

export type ITransformableOption = {
    isTransformed?: boolean;
}
export interface ITransformable {
    readonly id: string;

    readonly cellPayload: CellPayload[] | undefined;
    readonly rangePayload: RangePayload[] | undefined;

    isTransformed: boolean;

    applyCells(cellPayload: CellPayload): void
    insertRows(docId:DocId, sheetId: string, rowIndex: number, numRows: number): void
    insertColumns(docId:DocId, sheetId: string, columnIndex: number, numColumns: number): void
    removeRows(docId:DocId, sheetId: string, rowPosition: number, howMany: number): void
    removeColumns(docId:DocId, sheetId: string, columnPosition: number, howMany: number): void
}
