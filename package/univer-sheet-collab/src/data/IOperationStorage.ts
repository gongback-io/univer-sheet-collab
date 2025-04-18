import {DocId, IOperation, RevisionId} from "../types";

export interface IOperationStorage {
    selectMaxRevision(docId: string): Promise<RevisionId | null>;
    selectAfter(docId: string, revision: RevisionId): Promise<IOperation[]>;
    insert(docId: DocId, operation: IOperation<any>): Promise<void>;
}
