import {IExecutionOptions, IResourceLoaderService, IWorkbookData, LifecycleStages, Univer, UniverInstanceType, Workbook} from '@univerjs/core';

import '@univerjs/engine-formula/facade';
import '@univerjs/sheets/facade';
import '@univerjs/sheets-numfmt/facade';
import '@univerjs/sheets-filter/facade';
import '@univerjs/sheets-sort/facade';

import {DocId, IOperation, uuidv4} from "@gongback/univer-sheet-collab";
import { FUniver } from '@univerjs/core/facade';
import {IWorkbookDelegate, OnOperationExecutedCallback} from "./IWorkbookDelegate";
import {RichTextEditingMutation} from "@univerjs/docs";


export abstract class LocalWorkbookDelegate implements IWorkbookDelegate {
    readonly docId: DocId;
    private univer?: Univer;
    private univerAPI?: FUniver;
    private workbook?: Workbook;
    private onOperationExecutedCallback: OnOperationExecutedCallback | null = null;

    constructor(docId: string) {
        this.docId = docId;

        this.getSnapshot = this.getSnapshot.bind(this);
        this.dispose = this.dispose.bind(this);
        this.executeOperations = this.executeOperations.bind(this);
        this.createSheet = this.createSheet.bind(this);
    }

    protected abstract makeUniver(): Univer;

    public async createSheet(workbookData: Partial<IWorkbookData>): Promise<void> {
        console.log('[LocalWorkbookDelegate] createSheet', workbookData);
        const univer = this.makeUniver();

        this.univer = univer;
        this.univerAPI = FUniver.newAPI(univer);
        if (this.onOperationExecutedCallback) {
            this.registOnOperationExecuted();
        }

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

    private registOnOperationExecuted() {
        this.univerAPI?.onCommandExecuted((command, options) => {
            console.log('[LocalWorkbookDelegate] onCommandExecuted', command, options);
            if (options?.fromCollab || options?.onlyLocal) {
                return;
            }
            if (command.type === 2 && command.id !== RichTextEditingMutation.id) {
                const operation:IOperation = {
                    collabId: "WORKBOOK_DELEGATOR",
                    operationId: uuidv4(),
                    revision: this.workbook!.getRev(),
                    command: JSON.parse(JSON.stringify(command)),
                }
                this.onOperationExecutedCallback!(operation, options);
            }
        });
    }

    public async getSnapshot(): Promise<IWorkbookData> {
        if (!this.workbook) {
            throw new Error('Workbook is not initialized');
        }
        const workbook = this.univer!.__getInjector().get(IResourceLoaderService).saveUnit(this.workbook.getUnitId())
        return workbook as IWorkbookData;
    }

    public async dispose(): Promise<void> {
        this.univer?.dispose();
    }

    async onOperationExecuted(listener:OnOperationExecutedCallback): Promise<void>{
        if (this.univerAPI) {
            this.registOnOperationExecuted();
        } else {
            this.onOperationExecutedCallback = listener;
        }
    }

    async executeOperations(operations: IOperation[], options?:IExecutionOptions): Promise<{ workbookData: IWorkbookData, results: any[] }> {
        console.log('[LocalWorkbookDelegate] executeOperations', operations);
        if (!this.workbook) {
            throw new Error('Workbook is not initialized');
        }
        const results = [];
        for (const operation of operations) {
            const result = this.univerAPI?.syncExecuteCommand<any, any>(operation.command.id, operation.command.params, options);
            results.push(result);
            this.workbook.setRev(operation.revision);
        }
        const workbookData = await this.getSnapshot();
        return {
            workbookData,
            results
        };
    }
}
