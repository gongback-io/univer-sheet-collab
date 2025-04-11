import {DocQueueManager} from './model/doc-queue-manager/DocQueueManager';
import {
    DocId, IOperation,
    IOperationStorage,
    IWorkbookStorage,
    uuidv4,
    ExecRequest,
    ExecResult,
    ISheetSyncer
} from '@gongback/univer-sheet-collab';

import {OTHandler} from './model/OTHandler';
import {Publisher, WorkbookDelegateFactory} from './types';
import {PostProcessor} from "./model/PostProcessor";
import {InMemoryOperationQueue} from "./model/operation-queue/InMemoryOperationQueue";
import {IWorkbookData} from '@univerjs/core';

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
            const {
                docId,
                collabId,
                operationId,
                revision,
                command
            } = options;

            return await this.docQueueManager.enqueue(docId, async () => {
                let workbook = await this.workbookStorage.select(docId);
                if (!workbook) {
                    workbook = await this.createDoc(docId)
                }

                const requestOperation: IOperation = {
                    collabId,
                    operationId: operationId || uuidv4(),
                    revision: revision || (await this.operationStorage.selectMaxRevision(docId)) || workbook.rev!,
                    command
                }
                const {
                    operation: transformedOperation,
                    isSheetChangeOp,
                    isTransformed
                } = await this.otHandler.handleTransform(
                    options.collabId,
                    docId,
                    requestOperation
                );
                const workbookDelegate = this.workbookDelegateFactory(docId)
                await workbookDelegate.onOperationExecuted(async (operation, options) => {
                    console.log(`[LeaderServer] onOperationExecuted`, operation, options);
                    if (options?.fromCollab || options?.onlyLocal) {
                        return;
                    }
                    this.execOperation({
                        docId,
                        collabId: operation.collabId,
                        operationId: operation.operationId,
                        revision:operation.revision,
                        command:operation.command
                    });
                })
                const {needPublish, execResult} = await this.postProcessor.postProcess(docId, workbookDelegate, transformedOperation, isSheetChangeOp);
                await workbookDelegate.dispose();
                const result: ExecResult = {
                    docId,
                    operation: transformedOperation,
                    isTransformed,
                    execResult
                }

                if (needPublish) {
                    await this.syncPublisher.publish(`doc:${docId}:op`, JSON.stringify(transformedOperation));
                }
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
            console.log('[LeaderServer] onFreeCache.saveSheet ', operations);
            const workbookDelegate = this.workbookDelegateFactory(docId)
            await workbookDelegate.createSheet(workbook)
            const {workbookData} = await workbookDelegate.executeOperations(operations, {onlyLocal: true, fromCollab: true})
            await workbookDelegate.dispose();
            await this.workbookStorage.insert(docId, workbookData.rev!, workbookData)
        }

    }
}
