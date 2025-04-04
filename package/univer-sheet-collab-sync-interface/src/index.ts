import { IWorkbookData } from '@univerjs/core';
import {IOperation} from "@gongback/univer-sheet-collab";

export interface ISheetSyncer {
    createDoc(docId: string, initialWorkbookData?: Partial<IWorkbookData>): Promise<IWorkbookData>
    execOperation(request: ExecRequest): Promise<ExecResult>
}
export type ExecRequest = {
    docId: string;
    operation: IOperation;
    collabId: string;
}
export type ExecResult = {
    docId: string,
    operation: IOperation,
    isTransformed: boolean,
}
