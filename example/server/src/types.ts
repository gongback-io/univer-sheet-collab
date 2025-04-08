import {DocId, OperationId, RevisionId} from "@gongback/univer-sheet-collab";

export type CreateDocGrpcRequest = {
    docId: DocId;
    initialWorkbookDataJson: string
}
export type CreateDocGrpcResult = {
    docId: DocId;
    workbookDataJson: string
}
export type SendOperationGrpcRequest = {
    docId: string;
    collabId: string;
    operationId?: OperationId;
    revision?: RevisionId;
    commandJson: string;
}
export type SendOperationGrpcResult = {
    docId: string,
    operationJson: string;
    isTransformed: boolean,
}
