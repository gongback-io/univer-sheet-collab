import {DocQueueManager} from './model/doc-queue-manager/DocQueueManager';
import {
    IOperationStorage,
    IWorkbookStorage,
} from '@gongback/univer-sheet-collab';

import {OTHandler} from './model/OTHandler';
import {Publisher, WorkbookDelegateFactory} from './types';
import {PostProcessor} from "./model/PostProcessor";
import {InMemoryOperationQueue} from "./model/operation-queue/InMemoryOperationQueue";
import { SyncRequest, SyncResult} from "@gongback/univer-sheet-collab-sync-interface";

export class SyncServer {
    private otHandler: OTHandler;
    private postProcessor: PostProcessor;
    private docQueueManager = new DocQueueManager();
    private syncPublisher: Publisher;

    constructor(options: {
        opStorage: IOperationStorage,
        workbookDelegateFactory: WorkbookDelegateFactory,
        workbookStorage: IWorkbookStorage,
        syncPublisher: Publisher,
    }) {
        const {
            opStorage,
            workbookDelegateFactory,
            workbookStorage,
            syncPublisher,
        } = options;

        this.syncPublisher = syncPublisher;
        syncPublisher.on('error', (err) => {
            console.error('[LeaderServer] Publisher Error:', err);
        });

        const operationQueue = new InMemoryOperationQueue(opStorage);
        this.otHandler = new OTHandler({
            operationQueue: operationQueue,
        });
        this.postProcessor = new PostProcessor(
            workbookDelegateFactory,
            workbookStorage
        );
    }

    async start() {
        await this.syncPublisher.connect();
        console.log('[LeaderServer] Publisher connected');
    }

    async sendOperation(options: SyncRequest) {
        try {
            const docId = options.docId;
            return await this.docQueueManager.enqueue(docId, async () => {
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

                const result: SyncResult = {
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
}
