import {ICommandInfo, IWorkbookData} from "@univerjs/core";
import {DocId, IOperation, ITransformableOperation, IRevisionWorkbook, RevisionId} from "@gongback/univer-sheet-collab";

export interface IBroadcastOperator {
    emit(op: any, data: any): any;
}
export interface IServer {
    on(ev: any, listener: any): any;
    to(room: any): IBroadcastOperator;
}
export interface ISocket {
    id: string;
    on(ev: any, listener: any): any;
    off(ev: any, listener: any): any;
    to(room: any): IBroadcastOperator;
    join(room: any): any;
    leave(room: any): any;
}
export interface IWorkbookDelegate {
    readonly docId: DocId;
    createSheet(workbookData: Partial<IWorkbookData>): Promise<void>;
    executeOperation(operation: IOperation): Promise<IWorkbookData>;
    getSnapshot(): Promise<IWorkbookData>
    dispose(): Promise<void>;
}
export type IWorkbookStorage = {
    select(docId: string, revision?:RevisionId): Promise<IWorkbookData | undefined>;
    insert(docId: string, revision:RevisionId, workbookData: IWorkbookData): Promise<void>;
}
export interface IOpStorage {
    selectMaxRevision(docId: string): Promise<RevisionId>;
    selectAfter(docId: string, revision: RevisionId): Promise<IOperation[]>;
    insert(docId: DocId, operation: IOperation<any>): Promise<void>;
}
