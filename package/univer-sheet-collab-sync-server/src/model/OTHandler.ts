import { Mutex } from 'async-mutex';

import {
    DocId,
    IOperation,
    transformModelFactory,
    IOperationModel,
} from "@gongback/univer-sheet-collab";
import {IOperationQueue} from "./operation-queue/IOperationQueue";
import {isSheetChangeOp} from "../util/OperationModelUtil";

type HandleResult = {
    operationModel: IOperationModel,
    isTransformed: boolean,
}
export class OTHandler {
    private readonly operationQueue: IOperationQueue

    constructor(options: {operationQueue: IOperationQueue}) {
        this.operationQueue = options.operationQueue;
    }

    async handleTransform(collabId: string, docId: DocId, operation:IOperation): Promise<{operation: IOperation, isTransformed: boolean, isSheetChangeOp: boolean}> {
        try {
            const operationModel = transformModelFactory.createOperationModel(operation);
            const {operationModel: transformedModel} = await this._handleOperationModel(docId, operationModel);
            transformedModel.revision += 1
            await this.addQueue(docId, transformedModel);
            return {
                operation: {
                    collabId: transformedModel.collabId,
                    operationId: transformedModel.operationId,
                    revision: transformedModel.revision,
                    command: transformedModel.command,
                },
                isTransformed: transformedModel.isTransformed,
                isSheetChangeOp: isSheetChangeOp(transformedModel),
            };
        } catch (e: any) {
            console.error(e);
            throw e;
        }
    }

    private async _handleOperationModel(docId: DocId, operation: IOperationModel): Promise<HandleResult> {
        const operationModels = await this.operationQueue.getAfter(docId, operation.revision );
        const alreadyIn = operationModels.find((operationStorageItem) =>
            operationStorageItem!.operationId === operation.operationId
        )
        if (alreadyIn) {
            return {
                operationModel: alreadyIn,
                isTransformed: alreadyIn.isTransformed,
            }
        }
        const transformed = this._handleTransform(
            operation,
            operationModels
        )

        const currentRevision = await this.operationQueue.getCurrentRevision(docId);
        if (transformed.revision !== currentRevision) {
            throw new Error(`Invalid revision: ${transformed.revision} / ${currentRevision}`)
        }

        return {
            operationModel: transformed,
            isTransformed: transformed.isTransformed,
        };
    }
    private _handleTransform<T extends IOperationModel>(
        operation: T,
        transformers: IOperationModel[]
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

    async addQueue(docId: DocId, operation: IOperationModel) {
        return this.operationQueue.add(docId, operation)
    }
}

