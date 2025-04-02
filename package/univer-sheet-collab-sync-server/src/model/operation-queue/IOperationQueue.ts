import {DocId, IOperationModel, RevisionId} from "@gongback/univer-sheet-collab";

export interface IOperationQueue {
    getCurrentRevision(docId: DocId): Promise<RevisionId>
    getAfter(docId: DocId, fromRevisionId: RevisionId) : Promise<IOperationModel[]>
    add(docId: DocId, operation: IOperationModel): Promise<RevisionId>
}
