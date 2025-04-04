import {DocQueueManager} from './model/doc-queue-manager/DocQueueManager';
import {
    DocId,
    IOperationStorage,
    IWorkbookStorage,
} from '@gongback/univer-sheet-collab';

import {OTHandler} from './model/OTHandler';
import {Publisher, WorkbookDelegateFactory} from './types';
import {PostProcessor} from "./model/PostProcessor";
import {InMemoryOperationQueue} from "./model/operation-queue/InMemoryOperationQueue";
import {ExecRequest, ExecResult} from "@gongback/univer-sheet-collab-sync-interface";
import {IWorkbookData} from '@univerjs/core';
import {ISheetSyncer} from "@gongback/univer-sheet-collab-sync-interface";

export class SyncServer implements ISheetSyncer {
    private operationStorage: IOperationStorage
    private workbookStorage: IWorkbookStorage
    private workbookDelegateFactory: WorkbookDelegateFactory
    private otHandler: OTHandler;
    private postProcessor: PostProcessor;
    private docQueueManager = new DocQueueManager();
    private syncPublisher: Publisher;

    constructor(options: {
        operationStorage: IOperationStorage,
        workbookDelegateFactory: WorkbookDelegateFactory,
        workbookStorage: IWorkbookStorage,
        syncPublisher: Publisher,
    }) {
        const {
            operationStorage,
            workbookDelegateFactory,
            workbookStorage,
            syncPublisher,
        } = options;
        this.operationStorage = operationStorage;
        this.workbookStorage = workbookStorage;
        this.workbookDelegateFactory = workbookDelegateFactory;

        this.syncPublisher = syncPublisher;
        syncPublisher.on('error', (err) => {
            console.error('[LeaderServer] Publisher Error:', err);
        });

        const operationQueue = new InMemoryOperationQueue(operationStorage, this.onFreeCache.bind(this));
        this.otHandler = new OTHandler({
            operationQueue: operationQueue,
        });
        this.postProcessor = new PostProcessor(
            workbookDelegateFactory,
            workbookStorage,
            operationStorage
        );
    }

    async start() {
        await this.syncPublisher.connect();
        console.log('[LeaderServer] Publisher connected');
    }

    async createDoc(docId: string, initialWorkbookData?: Partial<IWorkbookData>) {
        try {
            const createWorkbookData = {
                ...initialWorkbookData,
                id: docId,
                rev: 1,
            } as IWorkbookData;

            const workbookDelegate = this.workbookDelegateFactory(docId)
            await workbookDelegate.createSheet(createWorkbookData)
            const workbookData = await workbookDelegate.getSnapshot();
            await workbookDelegate.dispose();
            await this.workbookStorage.insert(docId, workbookData.rev || 1, workbookData)
            return workbookData;
        } catch (error) {
            console.error('[LeaderServer] createDoc Error:', error);
            throw error;
        }
    }

    async execOperation(options: ExecRequest): Promise<ExecResult> {
        try {
            const docId = options.docId;
            return await this.docQueueManager.enqueue(docId, async () => {
                const workbook = await this.workbookStorage.select(docId);
                if (!workbook) {
                    await this.createDoc(docId)
                }
                const {
                    operation,
                    isSheetChangeOp,
                    isTransformed
                } = await this.otHandler.handleTransform(
                    options.collabId,
                    docId,
                    options.operation
                );
                await this.postProcessor.postProcess(docId, operation, isSheetChangeOp);

                const result: ExecResult = {
                    docId,
                    operation,
                    isTransformed,
                }

                await this.syncPublisher.publish(`doc:${docId}:op`, JSON.stringify(operation));
                return result;
            });
        } catch (error) {
            console.error('[LeaderServer] sendOperation Error:', error);
            throw error;
        }
    }

    private async onFreeCache(docId: DocId) {
        const workbook = await this.workbookStorage.select(docId);
        if (!workbook || !workbook.rev) {
            return;
        }
        const operations = await this.operationStorage.selectAfter(docId, workbook.rev)
        if (operations.length > 0) {
            const workbookDelegate = this.workbookDelegateFactory(docId)
            await workbookDelegate.createSheet(workbook)
            const workbookData = await workbookDelegate.executeOperations(operations)
            await workbookDelegate.dispose();
            await this.workbookStorage.insert(docId, workbookData.rev!, workbookData)
        }

    }
}
