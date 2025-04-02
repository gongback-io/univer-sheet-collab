import {DocId} from "@gongback/univer-sheet-collab";
import {IWorkbookDelegate} from "./model/workbook-delegate/IWorkbookDelegate";

export type WorkbookDelegateFactory = (docId: DocId) => IWorkbookDelegate;
export interface Publisher {
    on (event: string, callback: (...args: any[]) => void): void;
    connect(): Promise<any>;
    publish(channel: string, message: string): Promise<any>;
}
