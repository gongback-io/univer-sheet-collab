import {ITransformable, ITransformableOption} from "./ITransformable";
import {CellPayload, RangePayload} from "../types";
import {ObjectMatrix} from "@univerjs/core";
import {DocId} from "../../../types";

export class BaseTransformable implements ITransformable {
    static id: string;
    isTransformed = false;

    constructor(options?: ITransformableOption) {
        this.isTransformed = options?.isTransformed || false;
    }

    // override if needed
    getCellPayload(): CellPayload[] | undefined { return undefined; }
    onCellPayloadChanged(cellPayload:CellPayload[]): void {}
    getRangePayload(): RangePayload[] | undefined { return undefined; }
    onRangePayloadChanged(rangePayload:RangePayload[]): void {}

    applyCells(apply: CellPayload): void {
        const {docId, sheetId, cells:newValue} = apply;
        const cellPayload = this.cellPayload;
        if (cellPayload) {
            const updateSheetCellMatrix:CellPayload[] = [];
            cellPayload.forEach(_this => {
                let updateCellMatrix = _this.cells.clone()
                if (_this.docId === docId && _this.sheetId === sheetId) {
                    this.isTransformed = true;
                    updateCellMatrix = newValue.clone();
                }
                updateSheetCellMatrix.push({docId: _this.docId, sheetId: _this.sheetId, cells: new ObjectMatrix(updateCellMatrix)});
            });
            this.cellPayload = updateSheetCellMatrix;
        }
    }

    insertRows(docId: DocId, sheetId: string, rowIndex: number, numRows: number) {
        const cellPayload = this.cellPayload;
        if (cellPayload) {
            cellPayload.forEach(_this => {
                if (_this.docId === docId && _this.sheetId === sheetId) {
                    const {startRow, endRow} = _this.cells.getRange()
                    if (rowIndex <= startRow && rowIndex + numRows >= endRow) {
                        this.isTransformed = true;
                    }
                    _this.cells.insertRows(rowIndex, numRows);
                }
            });
            this.cellPayload = cellPayload;
        }
        const rangePayload = this.rangePayload;
        if (rangePayload) {
            rangePayload.forEach(_this => {
                if (_this.docId === docId && _this.sheetId === sheetId) {
                    if ( rowIndex <= _this.range.startRow ) {
                        this.isTransformed = true;
                        _this.range.startRow += numRows;
                    }
                    if ( rowIndex <= _this.range.endRow ) {
                        this.isTransformed = true;
                        _this.range.endRow += numRows;
                    }
                }
            })
            this.rangePayload = rangePayload;
        }
    }

    insertColumns(docId: DocId, sheetId: string, columnIndex: number, numColumns: number) {
        const cellPayload = this.cellPayload;
        if (cellPayload) {
            cellPayload.forEach(_this => {
                if (_this.docId === docId && _this.sheetId === sheetId) {
                    const {startColumn, endColumn} = _this.cells.getRange()
                    if (columnIndex <= startColumn && columnIndex + numColumns >= endColumn) {
                        this.isTransformed = true;
                    }
                    _this.cells.insertColumns(columnIndex, numColumns);
                }
            });
            this.cellPayload = cellPayload;
        }
        const rangePayload = this.getRangePayload()
        if (rangePayload) {
            rangePayload.forEach(_this => {
                if (_this.docId === docId && _this.sheetId === sheetId) {
                    if ( columnIndex <= _this.range.startColumn ) {
                        this.isTransformed = true;
                        _this.range.startColumn += numColumns;
                    }
                    if ( columnIndex <= _this.range.endColumn ) {
                        this.isTransformed = true;
                        _this.range.endColumn += numColumns;
                    }
                }
            })
            this.rangePayload = rangePayload;
        }
    }

    removeRows(docId: DocId, sheetId: string, rowPosition: number, howMany: number) {
        const cellPayload = this.cellPayload;
        if (cellPayload) {
            cellPayload.forEach(_this => {
                if (_this.docId === docId && _this.sheetId === sheetId) {
                    const {startRow, endRow} = _this.cells.getRange()
                    if (rowPosition <= startRow && rowPosition + howMany >= endRow) {
                        this.isTransformed = true;
                    }
                    _this.cells.removeRows(rowPosition, howMany);
                }
            });
            this.cellPayload = cellPayload;
        }
        const rangePayload = this.getRangePayload()
        if (rangePayload) {
            rangePayload.forEach(_this => {
                if (_this.docId === docId && _this.sheetId === sheetId) {
                    if ( rowPosition <= _this.range.startRow ) {
                        this.isTransformed = true;
                        _this.range.startRow -= howMany;
                    }
                    if ( rowPosition <= _this.range.endRow ) {
                        this.isTransformed = true;
                        _this.range.endRow -= howMany;
                    }
                }
            })
            this.rangePayload = rangePayload;
        }
    }

    removeColumns(docId: DocId, sheetId: string, columnPosition: number, howMany: number) {
        const cellPayload = this.cellPayload;
        if (cellPayload) {
            cellPayload.forEach(_this => {
                if (_this.docId === docId && _this.sheetId === sheetId) {
                    const {startColumn, endColumn} = _this.cells.getRange()
                    if (columnPosition <= startColumn && columnPosition + howMany >= endColumn) {
                        this.isTransformed = true;
                    }
                    _this.cells.removeColumns(columnPosition, howMany);
                }
            });
            this.cellPayload = cellPayload;
        }
        const rangePayload = this.getRangePayload()
        if (rangePayload) {
            rangePayload.forEach(_this => {
                if (_this.docId === docId && _this.sheetId === sheetId) {
                    if ( columnPosition <= _this.range.startColumn ) {
                        this.isTransformed = true;
                        _this.range.startColumn -= howMany;
                    }
                    if ( columnPosition <= _this.range.endColumn ) {
                        this.isTransformed = true;
                        _this.range.endColumn -= howMany;
                    }
                }
            })
            this.rangePayload = rangePayload;
        }
    }

    public get id(): string {
        return (this.constructor as typeof BaseTransformable).id;
    }
    get cellPayload(): CellPayload[] | undefined {
        return this.getCellPayload();
    }
    private set cellPayload(cellPayloads: CellPayload[]) {
        this.onCellPayloadChanged(cellPayloads);
    }
    get rangePayload(): RangePayload[] | undefined {
        return this.getRangePayload();
    }
    private set rangePayload(rangePayloads: RangePayload[]) {
        this.onRangePayloadChanged(rangePayloads);
    }
}
