import {DocId} from "@gongback/univer-sheet-collab";

export type GrpcRequest = {
    docId: DocId;
    collabId: string;
    operationJson: string;
}
export type GrpcResult = {
    docId: string,
    operationJson: string;
    isTransformed: boolean,
}
