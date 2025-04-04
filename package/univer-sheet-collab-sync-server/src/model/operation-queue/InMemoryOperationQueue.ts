/* InMemoryOperationQueue.ts */

import {IOperationQueue} from './IOperationQueue';
import {
    DocId,
    IOperation,
    IOperationModel,
    IOperationStorage,
    RevisionId,
    transformModelFactory
} from '@gongback/univer-sheet-collab';

export class InMemoryOperationQueue implements IOperationQueue {
    private docCache = new Map<DocId, InMemoryDocOps>();
    private readonly CACHE_DURATION_MS = 10_000; // 10초

    constructor(
        private opStorage: IOperationStorage,
        private onAllFreedListener: (docId: DocId) => void
    ) {}

    private async getCache(docId: DocId): Promise<InMemoryDocOps>  {
        let docOps = this.docCache.get(docId);
        if (!docOps) {
            docOps = {
                ops: [],
                currentRevision: await this.opStorage.selectMaxRevision(docId) || 1,
                timer: null,
            };
            console.log(`[InMemoryOperationQueue] createCache: ${docId} / ${docOps.currentRevision}`);
            this.docCache.set(docId, docOps);
        }
        this.resetTimer(docId, docOps);
        return docOps;
    }

    public async getCurrentRevision(docId: DocId): Promise<RevisionId> {
        const docOps = await this.getCache(docId);
        return docOps.currentRevision;
    }

    public async getAfter(docId: DocId, fromRevisionId: RevisionId): Promise<IOperationModel[]> {
        const docOps = this.docCache.get(docId);
        if (docOps?.ops && docOps?.ops.length > 0 && docOps.ops[0].revision > fromRevisionId) {
            return docOps.ops
                .filter(op => op.revision > fromRevisionId)
                .map(op => op);
        }
        const ops = await this.opStorage.selectAfter(docId, fromRevisionId);
        return ops.map(op => transformModelFactory.createOperationModel(op));
    }

    public async add(docId: DocId, operation: IOperationModel): Promise<RevisionId> {
        const docOps = await this.getCache(docId);

        if (docOps.currentRevision + 1 !== operation.revision) {
            throw new Error(`Invalid revision: ${operation.revision} / ${docOps.currentRevision}`);
        }
        docOps.currentRevision = operation.revision;

        docOps.ops.push(operation);

        this.opStorage.insert(docId, operation).catch(err => {
            console.error('Failed to insert OP to storage:', err);
        });

        return operation.revision;
    }

    private resetTimer(docId:DocId, docOps: InMemoryDocOps) {
        if (docOps.timer) {
            clearTimeout(docOps.timer);
            docOps.timer = null;
        }

        docOps.timer = setTimeout(() => {
            this.freeDoc(docId);
        }, this.CACHE_DURATION_MS);
    }

    private freeDoc(docId: DocId) {
        const docOps = this.docCache.get(docId);
        if (!docOps) return;

        if (docOps.timer) {
            clearTimeout(docOps.timer);
        }
        docOps.ops = [];
        this.docCache.delete(docId);

        if (this.docCache.size === 0) {
            this.onAllFreed(docId);
        }
    }

    private onAllFreed(docId: DocId) {
        console.log('[InMemoryOperationQueue] All docIds freed. (Memory cleared)');
        this.onAllFreedListener?.(docId);
    }
}

interface InMemoryDocOps {
    ops: Array<IOperationModel>;
    currentRevision: RevisionId;
    timer: NodeJS.Timeout | null;
}
