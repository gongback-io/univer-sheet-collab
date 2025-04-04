import {IWorkbookData, LifecycleStages, Univer, UniverInstanceType, Workbook} from '@univerjs/core';

import '@univerjs/engine-formula/facade';
import '@univerjs/sheets/facade';
import '@univerjs/sheets-numfmt/facade';
import '@univerjs/sheets-filter/facade';
import '@univerjs/sheets-sort/facade';

import {DocId, IOperation} from "@gongback/univer-sheet-collab";
import { FUniver } from '@univerjs/core/facade';
import {IWorkbookDelegate} from "./IWorkbookDelegate";

export abstract class LocalWorkbookDelegate implements IWorkbookDelegate {
    readonly docId: DocId;
    private univer?: Univer;
    private univerAPI?: FUniver;
    private workbook?: Workbook;

    constructor(docId: string) {
        this.docId = docId;

        this.getSnapshot = this.getSnapshot.bind(this);
        this.dispose = this.dispose.bind(this);
        this.executeOperation = this.executeOperation.bind(this);
        this.createSheet = this.createSheet.bind(this);
    }

    protected abstract makeUniver(): Univer;

    public async createSheet(workbookData: Partial<IWorkbookData>): Promise<void> {
        console.log('[LocalWorkbookDelegate] createSheet', workbookData);
        const univer = this.makeUniver();

        this.univer = univer;
        this.univerAPI = FUniver.newAPI(univer);

        return new Promise(async (resolve) => {
            this.univerAPI!.addEvent('LifeCycleChanged', async (e) => {
                const stage = (e as any).stage;
                if (stage === LifecycleStages.Ready) {
                    resolve();
                }
            });
            this.workbook = this.univer!.createUnit(UniverInstanceType.UNIVER_SHEET, workbookData) as Workbook;
        });
    }

    public async getSnapshot(): Promise<IWorkbookData> {
        console.log('[LocalWorkbookDelegate] getSnapshot');
        if (!this.workbook) {
            throw new Error('Workbook is not initialized');
        }
        return this.workbook.save();
    }

    public async dispose(): Promise<void> {
        console.log('[LocalWorkbookDelegate] dispose');
        this.univer?.dispose();
    }

    async executeOperation(operation: IOperation): Promise<IWorkbookData> {
        console.log('[LocalWorkbookDelegate] executeOperation', operation);
        if (!this.workbook) {
            throw new Error('Workbook is not initialized');
        }
        this.univerAPI?.syncExecuteCommand(operation.command.id, operation.command.params, {fromCollab: true});
        this.workbook!.setRev(operation.revision);
        return this.workbook!.save();
    }

    async executeOperations(operations: IOperation[]): Promise<IWorkbookData> {
        console.log('[LocalWorkbookDelegate] executeOperations', operations);
        if (!this.workbook) {
            throw new Error('Workbook is not initialized');
        }
        for (const operation of operations) {
            this.univerAPI?.syncExecuteCommand(operation.command.id, operation.command.params, {fromCollab: true});
            this.workbook.setRev(operation.revision);
        }
        return this.workbook.save();
    }
}
