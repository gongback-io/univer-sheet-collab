import {DocId, IOperation, OperationId, RevisionId} from "../../../types";
import {ITransformableOperation} from "./ITransformableOperation";
import {CellPayload, RangePayload} from "../types";
import {ITransformable, ITransformableOption} from "../basic/ITransformable";
import {ITransformer, ITransformerOptions, TransformerOptions} from "../basic/ITransformer";
import {ICommandInfo} from "@univerjs/core";

export type TransformableOperationOptions = ITransformableOption & ITransformerOptions & {

}
export class TransformableOperation<T extends Object = object> implements ITransformableOperation<T> {
    readonly id: string;
    readonly collabId: string;
    readonly command: ICommandInfo<T>;
    readonly operationId: OperationId;

    isTransformed: boolean;
    revision: RevisionId;

    private readonly transformable: ITransformable
    private readonly transformer: ITransformer;

    constructor(source: IOperation<T>, transformable: ITransformable, transformer: ITransformer, options?: TransformableOperationOptions) {
        if (transformer.id !== transformable.id) {
            throw new Error('transformable id must be the same as the transformer id');
        }
        this.id = transformer.id;
        this.transformable = transformable;
        this.transformer = transformer;
        this.isTransformed = options?.isTransformed || false;

        this.collabId = source.collabId;
        this.command = source.command;
        this.operationId = source.operationId;
        this.revision = source.revision;
    }

    applyCells(cellPayload: CellPayload): void {
        return this.transformable.applyCells(cellPayload);
    }

    insertColumns(docId: DocId, sheetId: string, columnIndex: number, numColumns: number): void {
        return this.transformable.insertColumns(docId, sheetId, columnIndex, numColumns);
    }

    insertRows(docId: DocId, sheetId: string, rowIndex: number, numRows: number): void {
        return this.transformable.insertRows(docId, sheetId, rowIndex, numRows);
    }

    removeColumns(docId: DocId, sheetId: string, columnPosition: number, howMany: number): void {
        return this.transformable.removeColumns(docId, sheetId, columnPosition, howMany);
    }

    removeRows(docId: DocId, sheetId: string, rowPosition: number, howMany: number): void {
        return this.transformable.removeRows(docId, sheetId, rowPosition, howMany);
    }


    transform<T extends ITransformable>(target: T, options: TransformerOptions | undefined): T {
        return this.transformer.transform(target, options);
    }
    get cellPayload(): CellPayload[] | undefined {
        return this.transformable.cellPayload;
    }
    get rangePayload(): RangePayload[] | undefined {
        return this.transformable.rangePayload;
    }
    toJSON() {
        const operation:IOperation = {
            collabId: this.collabId,
            command: this.command,
            operationId: this.operationId,
            revision: this.revision
        }
        return operation;
    }

}
