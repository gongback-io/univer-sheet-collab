import {DocId, IOperation} from "@gongback/univer-sheet-collab";
import { IWorkbookData } from "@univerjs/core";

export interface IWorkbookDelegate {
    readonly docId: DocId;
    createSheet(workbookData: Partial<IWorkbookData>): Promise<void>;
    executeOperation(operation: IOperation): Promise<IWorkbookData>;
    executeOperations(operation: IOperation[]): Promise<IWorkbookData>;
    getSnapshot(): Promise<IWorkbookData>
    dispose(): Promise<void>;
}
