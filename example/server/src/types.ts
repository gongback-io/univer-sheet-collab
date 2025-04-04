import {DocId} from "@gongback/univer-sheet-collab";
import { IWorkbookData } from "@univerjs/core";

export type CreateDocGrpcRequest = {
    docId: DocId;
    initialWorkbookDataJson: string
}
export type CreateDocGrpcResult = {
    docId: DocId;
    workbookDataJson: string
}
export type SendOperationGrpcRequest = {
    docId: DocId;
    collabId: string;
    operationJson: string;
}
export type SendOperationGrpcResult = {
    docId: string,
    operationJson: string;
    isTransformed: boolean,
}
