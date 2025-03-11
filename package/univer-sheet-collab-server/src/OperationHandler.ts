import { Mutex } from 'async-mutex';

import {
    DocId,
    IApplayRevisionMutationParams,
    IOperation,
    ITransformableOperation,
    transformModelFactory,
    RevisionId,
} from "@gongback/univer-sheet-collab";
import {IOperationQueue} from "./data/IOperationQueue";
import {isSheetChangeOp} from "./util/OperationModelUtil";
import {IWorkbookDelegate, IWorkbookStorage} from "./types";
import {IWorkbookData} from "@univerjs/core";

type OpResult = {
    docId: DocId;
    transformed: ITransformableOperation,
    snapshot: IWorkbookData
}
type HandleResult = {
    operationModel: ITransformableOperation,
    isTransformed: boolean,
}
export class OperationHandler {
    private readonly docId: DocId;

    private readonly workbookDelegate: IWorkbookDelegate;

    private readonly operationQueue: IOperationQueue

    private readonly workbookStorage: IWorkbookStorage

    private operationLock = new Mutex();

    constructor(docId: DocId, options: {operationQueue: IOperationQueue, workbookDelegate: IWorkbookDelegate, workbookStorage: IWorkbookStorage}) {
        this.docId = docId
        this.operationQueue = options.operationQueue;
        this.workbookDelegate = options.workbookDelegate;
        this.workbookStorage = options.workbookStorage;
    }

    async handleOperation(collabId: string, docId: DocId, operation:IOperation): Promise<OpResult> {
        try {
            if (this.docId != docId) {
                throw new Error(`Invalid docId: ${docId} / ${this.docId}`)
            }
            const transformedModel = await this.operationLock.runExclusive(async () => {
                const operationModel = transformModelFactory.createTransformableOperation(operation);
                const {operationModel: transformedModel} = await this.handleOperationModel(operationModel);
                transformedModel.revision = await this.addQueue(transformedModel);
                return transformedModel;
            });

            const workbookData = await this.postProcess(transformedModel);

            return {
                docId: this.docId,
                transformed: transformedModel,
                snapshot: workbookData,
            }
        } catch (e: any) {
            console.error(e);
            throw e;
        }
    }

    async handleFetch(docId: DocId, revision: RevisionId): Promise<IOperation[]> {
        if (this.docId != docId) {
            throw new Error(`Invalid docId: ${docId} / ${this.docId}`)
        }
        const operationModels = await this.operationQueue.getAfter(revision + 1);
        return operationModels.map((item) => item);
    }

    async handleOperationModel(operation: ITransformableOperation): Promise<HandleResult> {
        const operationModels = await this.operationQueue.getAfter(operation.revision + 1);
        const alreadyIn = operationModels.find((operationStorageItem) =>
            operationStorageItem!.operationId === operation.operationId
        )
        if (alreadyIn) {
            return {
                operationModel: alreadyIn,
                isTransformed: alreadyIn.isTransformed,
            }
        }
        const transformed = this.handleTransform(
            operation,
            operationModels
        )

        if (transformed.revision !== this.operationQueue.currentRevision) {
            throw new Error(`Invalid revision: ${transformed.revision} / ${this.operationQueue.currentRevision}`)
        }

        return {
            operationModel: transformed,
            isTransformed: transformed.isTransformed,
        };
    }
    handleTransform<T extends ITransformableOperation>(
        operation: T,
        transformers: ITransformableOperation[]
    ): T {
        let transformed:T = operation;
        for (const transformer of transformers) {
            if (transformer.collabId === transformed.collabId) {
                // Skip the operation of the same user
                // because the operation is already applied
            } else {
                // last operation is the latest operation
                transformed = transformer.transform(transformed, {ignoreCellUpdate: true});
            }
            transformed.revision = transformer.revision
        }
        return transformed
    }

    async postProcess(transformedOperation: ITransformableOperation) {
        const transformed = transformedOperation;
        if (transformed.command.id === "collab.mutation.apply-revision") {
            const params = transformed.command.params as IApplayRevisionMutationParams
            const revisionWorkbookData = await this.workbookStorage.select(this.docId, params.revision);
            if (!revisionWorkbookData) {
                throw new Error(`Cannot revert revision: ${params.revision}`);
            }
            revisionWorkbookData.rev = transformed.revision
            await this.workbookDelegate.dispose();
            await Promise.all([
                this.workbookDelegate.createSheet(revisionWorkbookData),
                this.workbookStorage.insert(this.docId, transformed.revision, revisionWorkbookData)
            ]);
            return revisionWorkbookData;
        }
        const workbookData = await this.workbookDelegate.executeOperation(transformed)
        if (isSheetChangeOp(transformedOperation)) {
            this.workbookStorage.insert(this.docId, transformed.revision, workbookData).catch(
                error => console.error(error)
            );
        }

        return workbookData;
    }

    async addQueue(operation: ITransformableOperation) {
        return this.operationQueue.add(operation)
    }
}

