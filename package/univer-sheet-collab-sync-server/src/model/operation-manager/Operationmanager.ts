import {InMemoryOperationQueue} from "../operation-queue/InMemoryOperationQueue";
import {DocId, IOperation, IOperationModel, IOperationStorage} from "@gongback/univer-sheet-collab";
import {IOperationManager} from "./IOperationManager";

export class OperationManager implements IOperationManager {
    constructor(
        private operationQueue: InMemoryOperationQueue,
        private operationStorage: IOperationStorage
    ) {}

    async addOperation(docId: DocId, operationModel: IOperationModel): Promise<void> {
        try {
            await this.operationQueue.add(docId, operationModel);
        } catch (err) {
            console.error('[OperationManager] Failed to add operation:', err);
            throw err;
        }
    }

    async getOperationsAfter(docId: DocId, revision: number): Promise<IOperation[]> {
        return await this.operationStorage.selectAfter(docId, revision);
    }

    async getCurrentRevision(docId: DocId): Promise<number> {
        return await this.operationQueue.getCurrentRevision(docId);
    }
}
