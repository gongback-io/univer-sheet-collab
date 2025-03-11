import {DocId, ITransformableOperation, transformModelFactory, RevisionId} from "@gongback/univer-sheet-collab";
import {IOperationQueue} from "./IOperationQueue";
import {IOpStorage} from "../types";

export class DefaultOperationQueue implements IOperationQueue {
    docId: DocId;
    opStorage: IOpStorage
    operations: {
        [key: RevisionId]: ITransformableOperation
    }
    private _currentRevision: RevisionId;

    constructor(docId: DocId, opStorage: IOpStorage, currentRevision: RevisionId) {
        this.docId = docId;
        this.operations = {};
        this.opStorage = opStorage;
        this._currentRevision = currentRevision;
    }

    get(revisionId: RevisionId): ITransformableOperation | null {
        return this.operations[revisionId] || null;
    }

    async getAfter(fromRevisionId: RevisionId): Promise<ITransformableOperation[]> {
        if (!this.operations[fromRevisionId]) {
            const operations = await this.opStorage.selectAfter(this.docId, fromRevisionId-1);
            operations.forEach(operation => {
                if (!this.operations[operation.revision]) {
                    this.operations[operation.revision] = transformModelFactory.createTransformableOperation(operation);
                }
            })
        }

        if (fromRevisionId > this.currentRevision) {
            return [];
        }
        const result: ITransformableOperation[] = [];
        for (let i = fromRevisionId; i <= this.currentRevision; i+=1) {
            const operation = this.operations[i];
            if (operation === null) {
                throw new Error("Operation not found");
            }
            result.push(operation);
        }
        return result;
    }

    add(operation: ITransformableOperation): RevisionId {
        this._currentRevision += 1;
        this.operations[this.currentRevision] = operation;
        operation.revision = this.currentRevision;

        this.opStorage.insert(this.docId, operation).catch((err) => {
            console.error(err);
        })
        return this.currentRevision;
    }

    get currentRevision(): RevisionId {
        return this._currentRevision;
    }
}
