import { IWorkbookData } from "@univerjs/core";
import {WorkbookDelegateFactory} from "../../types";
import { IWorkbookManager } from "./IWorkbookManager";
import {DocId, IWorkbookStorage} from "@gongback/univer-sheet-collab";

export class WorkbookManager implements IWorkbookManager {
    constructor(
        private workbookStorage: IWorkbookStorage,
        private workbookDelegateFactory: WorkbookDelegateFactory
    ) {}

    async getWorkbook(docId: DocId, revision?: number): Promise<IWorkbookData | null> {
        const workbook = await this.workbookStorage.select(docId, revision);
        return workbook || null;
    }

    async saveWorkbook(docId: DocId, revision: number, workbookData: IWorkbookData): Promise<void> {
        await this.workbookStorage.insert(docId, revision, workbookData);
    }

    async createWorkbook(docId: DocId, initialData?: Partial<IWorkbookData>): Promise<IWorkbookData> {
        const createWorkbookData = {
            ...initialData,
            id: docId,
            rev: 1,
        } as IWorkbookData;

        const workbookDelegate = this.workbookDelegateFactory(docId, "SYSTEM");
        await workbookDelegate.createSheet(createWorkbookData);
        const workbookData = await workbookDelegate.getSnapshot();
        await workbookDelegate.dispose();
        await this.workbookStorage.insert(docId, workbookData.rev || 1, workbookData);
        return workbookData;
    }
}
