import {IWorkbookData, LifecycleStages, Univer, UniverInstanceType, Workbook} from '@univerjs/core';
import {UniverDocsPlugin} from '@univerjs/docs';
import {UniverFormulaEnginePlugin} from '@univerjs/engine-formula';
import {UniverSheetsPlugin} from '@univerjs/sheets';

import '@univerjs/engine-formula/facade';
import '@univerjs/sheets/facade';
import '@univerjs/sheets-numfmt/facade';
import '@univerjs/sheets-filter/facade';
import '@univerjs/sheets-sort/facade';

import {DocId, IOperation, UniverSheetCollabPlugin} from "@gongback/univer-sheet-collab";
import { FUniver } from '@univerjs/core/facade';
import {IWorkbookDelegate} from "../types";
import {UniverSheetCollabServerPlugin} from "../plugin/plugin";


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
        if (!this.workbook) {
            throw new Error('Workbook is not initialized');
        }
        return this.workbook.save();
    }

    public async dispose(): Promise<void> {
        if (this.workbook) {
            this.univerAPI?.disposeUnit(this.workbook.getUnitId())
        }
        this.univerAPI?.dispose();
        this.univer?.dispose();
    }

    async executeOperation(operation: IOperation): Promise<IWorkbookData> {
        if (!await this.univerAPI?.executeCommand(operation.command.id, operation.command.params, {fromCollab: true})) {
            throw new Error('Cannot execute operation');
        }
        this.workbook!.setRev(operation.revision);
        return this.workbook!.save();
    }
}
