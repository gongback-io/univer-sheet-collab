import {ICommandInfo, IWorkbookData} from "@univerjs/core";

export type CollabId = string;
export type DocId = string;
export type RevisionId = number;
export type OperationId = string;

export type OpRequest = {
    docId: DocId;
    operation: IOperation
}
export type OpResponse = {
    success: boolean,
    operationId: string,
    data?: {
        docId: DocId;
        operation: IOperation,
        isTransformed: boolean
    }
    message?: string;
}

export type FetchRequest = {
    docId: DocId;
    revision: RevisionId;
}
export type FetchResponse = {
    success: boolean,
    data?: {
        docId: DocId;
        operations: IOperation[]
    },
    message?: string;
}
export type OpBroadcastResponse = {
    docId: DocId;
    operation: IOperation
}
export type JoinRequest = {
    docId: DocId;
    collabId: string;
}
export type JoinResponseData = {
    docId: DocId;
    workbookData: IWorkbookData;
    operations: IOperation[];
};
export type JoinResponse = {
    success: boolean,
    data?: JoinResponseData
    message?: string;
}
export type LeaveRequest = {
    docId: DocId;
}
export interface IOperation<T extends object = object> {
    collabId: string;
    operationId: OperationId;
    revision: RevisionId;
    readonly command: ICommandInfo<T>;
}
export type IRevisionWorkbook = {
    docId: string;
    revision: number;
    name?: string;
    workbookData: IWorkbookData
    at: Date
}
