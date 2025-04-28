import { DocId } from "@gongback/univer-sheet-collab";
import { IWorkbookData } from "@univerjs/core";

export interface IWorkbookManager {
    getWorkbook(docId: DocId, revision?: number): Promise<IWorkbookData | null>;
    saveWorkbook(docId: DocId, revision: number, workbookData: IWorkbookData): Promise<void>;
    createWorkbook(docId: DocId, initialData?: Partial<IWorkbookData>): Promise<IWorkbookData>;
}
