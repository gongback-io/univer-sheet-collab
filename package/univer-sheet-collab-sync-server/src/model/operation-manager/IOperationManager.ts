import {DocId, IOperation, IOperationModel} from "@gongback/univer-sheet-collab";

export interface IOperationManager {
    addOperation(docId: DocId, operation: IOperationModel): Promise<void>;
    getOperationsAfter(docId: DocId, revision: number): Promise<IOperation[]>;
    getCurrentRevision(docId: DocId): Promise<number>;
}
