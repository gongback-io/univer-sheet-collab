import {DocQueueManager} from './model/doc-queue-manager/DocQueueManager';
import {
    CollabId,
    DocId,
    ExecRequest,
    ExecResult,
    IApplayRevisionMutationParams,
    IOperation,
    IOperationStorage,
    ISheetSyncer,
    IWorkbookStorage,
    uuidv4
} from '@gongback/univer-sheet-collab';

import {OTHandler} from './model/OTHandler';
import {Publisher, WorkbookDelegateFactory} from './types';
import {InMemoryOperationQueue} from "./model/operation-queue/InMemoryOperationQueue";
import {IWorkbookData} from '@univerjs/core';
import {RichTextEditingMutation} from '@univerjs/docs';
import {isSheetChangeOp} from "./util/OperationModelUtil";
import {IOperationManager } from './model/operation-manager/IOperationManager';
import {IWorkbookManager} from "./model/workbook-manager/IWorkbookManager";
import { OperationManager } from './model/operation-manager/Operationmanager';
import {WorkbookManager} from "./model/workbook-manager/WorkbookManager";
import {IOperationPublisher} from "./model/operation-publisher/IOperationPublisher";
import {OperationPublisher} from "./model/operation-publisher/OperationPublisher";

export class SyncServer implements ISheetSyncer {
    private operationStorage: IOperationStorage;
    private workbookDelegateFactory: WorkbookDelegateFactory;
    private otHandler: OTHandler;
    private operationQueue: InMemoryOperationQueue;
    private docQueueManager = new DocQueueManager();
    private syncPublisher: Publisher;

    private operationPublisher: IOperationPublisher;
    private operationManager: IOperationManager;
    private workbookManager: IWorkbookManager;

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
        this.workbookDelegateFactory = workbookDelegateFactory;

        this.syncPublisher = syncPublisher;
        syncPublisher.on('error', (err) => {
            console.error('[SyncServer] Publisher Error:', err);
        });

        this.operationQueue = new InMemoryOperationQueue(operationStorage, this.onFreeCache.bind(this));
        this.otHandler = new OTHandler({
            operationQueue: this.operationQueue,
        });

        this.operationPublisher = new OperationPublisher(syncPublisher);
        this.operationManager = new OperationManager(this.operationQueue, operationStorage);
        this.workbookManager = new WorkbookManager(workbookStorage, workbookDelegateFactory);
    }

    async start() {
        await this.syncPublisher.connect();
        console.log('[SyncServer] Publisher connected');
    }

    async createDoc(docId: string, initialWorkbookData?: Partial<IWorkbookData>) {
        try {
            return await this.workbookManager.createWorkbook(docId, initialWorkbookData);
        } catch (error) {
            console.error('[SyncServer] createDoc Error:', error);
            throw error;
        }
    }

    async execOperation(options: ExecRequest): Promise<ExecResult> {
        try {
            console.log(`[SyncServer] enqueue`, options.command, options.operationId, options);
            return await this.docQueueManager.enqueue(options.docId, async () => {
                return await this.execOperationInner(options);
            });
        } catch (error) {
            console.error('[SyncServer] sendOperation Error:', error);
            throw error;
        }
    }

    private async execOperationInner(options: ExecRequest) {
        const {
            docId,
            collabId,
            operationId,
            revision,
            command
        } = options;
        console.log(`[SyncServer] execOperation`, options.command, options.operationId, options);

        // 워크북 데이터 가져오기
        let workbook = await this.workbookManager.getWorkbook(docId);
        if (!workbook) {
            workbook = await this.createDoc(docId);
        }

        // operation transform
        const {
            operationModel: transformedOperationModel,
            operation: transformedOperation,
            isTransformed
        } = await this.otHandler.handleTransform(
            options.collabId,
            docId,
            {
                collabId,
                operationId: operationId || uuidv4(),
                revision: revision || (await this.operationStorage.selectMaxRevision(docId)) || workbook.rev!,
                command
            }
        );

        // process operation (exec transformed operation)
        let newRevision: number = transformedOperation.revision
        const {
            execResult,
            subOperations,
            workbookData: updatedWorkbookData,
        } = await this.processOperation(docId, collabId, transformedOperation, workbook);
        if (transformedOperation.command.type === 2 && command.id !== RichTextEditingMutation.id) {
            await this.operationManager.addOperation(docId, transformedOperationModel);
            await this.operationPublisher.publishOperation(docId, transformedOperation);
        }

        for (const subOperation of subOperations) {
            const {
                operationModel,
                operation
            } = await this.otHandler.handleTransform(
                options.collabId,
                docId,
                subOperation
            );
            if (transformedOperation.command.type === 2 && command.id !== RichTextEditingMutation.id) {
                newRevision = operation.revision
                await this.operationManager.addOperation(docId, operationModel);
                await this.operationPublisher.publishOperation(docId, operation);
            }
        }
        updatedWorkbookData.rev = newRevision;

        const sheetChanged = [transformedOperation, ...subOperations].some(execOperation => isSheetChangeOp(execOperation));
        if (sheetChanged) {
            await this.workbookManager.saveWorkbook(docId, newRevision, updatedWorkbookData);
        }

        console.log(`[SyncServer] post execOperation`, options.command, options.operationId, options);

        const result: ExecResult = {
            docId,
            operation: transformedOperation,
            isTransformed,
            execResult
        };

        return result;
    }

    async processOperation(docId: DocId, collabId: CollabId, transformedOperation: IOperation, workbook: IWorkbookData): Promise<{
        workbookData: IWorkbookData
        execResult: any,
        subOperations: IOperation[],
    }> {
        const workbookDelegate = this.workbookDelegateFactory(docId, collabId);
        const transformed = transformedOperation;

        // 특수 명령 처리 (리비전 적용)
        if (transformed.command.id === "collab.mutation.apply-revision") {
            const params = transformed.command.params as IApplayRevisionMutationParams;
            const revisionWorkbookData = await this.workbookManager.getWorkbook(docId, params.revision);

            if (!revisionWorkbookData) {
                throw new Error(`Cannot revert revision: ${params.revision}`);
            }

            revisionWorkbookData.rev = transformed.revision;

            await workbookDelegate.dispose();
            return {
                execResult: true,
                workbookData: revisionWorkbookData,
                subOperations: [],
            };
        }

        // 이전 작업 불러오기
        let operations: IOperation[] = [];
        if (workbook.rev) {
            operations = await this.operationManager.getOperationsAfter(docId, workbook.rev);
        }

        const execOperations: IOperation[] = [];
        // 작업 실행 시 이벤트 설정
        workbookDelegate.setOnOperationExecuted((operation, options) => {
            const command = operation.command;
            if (options?.fromCollab || options?.onlyLocal) {
                return;
            }
            if (command.type === 2 && command.id !== RichTextEditingMutation.id) {
                console.log(`[SyncServer] onOperationExecuted`, operation, options);

                execOperations.push(operation);
            }
        });

        await workbookDelegate.createSheet(workbook);

        // 워크북에 작업 적용
        const {workbookData, results} = await workbookDelegate.executeOperations([
            ...operations.filter(operation => operation.operationId !== transformedOperation.operationId),
            transformed,
        ], {onlyLocal: true, fromCollab: true});

        const result = results[results.length - 1];
        await workbookDelegate.dispose();

        return {
            workbookData,
            execResult: result,
            subOperations: execOperations,
        };
    }

    private async onFreeCache(docId: DocId) {
        const workbook = await this.workbookManager.getWorkbook(docId);
        if (!workbook || !workbook.rev) {
            return;
        }

        const operations = await this.operationManager.getOperationsAfter(docId, workbook.rev);
        if (operations.length > 0) {
            console.log('[SyncServer] onFreeCache.saveSheet ', operations);

            const workbookDelegate = this.workbookDelegateFactory(docId, "SYSTEM");
            await workbookDelegate.createSheet(workbook);
            const {workbookData} = await workbookDelegate.executeOperations(operations, {onlyLocal: true, fromCollab: true});
            await workbookDelegate.dispose();

            await this.workbookManager.saveWorkbook(docId, workbookData.rev!, workbookData);
        }
    }
}
