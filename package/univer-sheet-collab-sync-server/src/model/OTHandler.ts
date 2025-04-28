import {DocId, IOperation, IOperationModel, transformModelFactory,} from "@gongback/univer-sheet-collab";
import {IOperationQueue} from "./operation-queue/IOperationQueue";

type HandleResult = {
    operationModel: IOperationModel,
    isTransformed: boolean,
}
export class OTHandler {
    private readonly operationQueue: IOperationQueue

    constructor(options: {operationQueue: IOperationQueue}) {
        this.operationQueue = options.operationQueue;
    }

    async handleTransform(collabId: string, docId: DocId, operation:IOperation): Promise<{operationModel: IOperationModel, operation: IOperation, isTransformed: boolean}> {
        try {
            const operationModel = transformModelFactory.createOperationModel(operation);
            if (operation.command.type !== 2) {
                return {
                    operationModel,
                    operation: operation,
                    isTransformed: false,
                };
            }
            const {operationModel: transformedModel} = await this._handleOperationModel(docId, operationModel);
            transformedModel.revision += 1
            return {
                operationModel: transformedModel,
                operation: {
                    collabId: transformedModel.collabId,
                    operationId: transformedModel.operationId,
                    revision: transformedModel.revision,
                    command: transformedModel.command,
                },
                isTransformed: transformedModel.isTransformed,
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
}

