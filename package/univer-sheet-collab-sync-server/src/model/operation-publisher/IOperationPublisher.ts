import {DocId, IOperation} from "@gongback/univer-sheet-collab";

export interface IOperationPublisher {
    publishOperation(docId: DocId, operation: IOperation): Promise<void>;
}
