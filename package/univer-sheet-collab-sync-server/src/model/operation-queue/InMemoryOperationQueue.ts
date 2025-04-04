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

/**
 * 최근 10초 동안의 OP를 메모리에 캐싱하며, 필요 시 opStorage를 조회/저장
 */
export class InMemoryOperationQueue implements IOperationQueue {
    private docCache = new Map<DocId, InMemoryDocOps>();
    private readonly CACHE_DURATION_MS = 10_000; // 10초

    constructor(private opStorage: IOperationStorage) {}

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
        this.resetTimer(docId, docOps); // 접근 시 타이머 리셋
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

    /**
     * (4) OP 추가
     *  - 메모리에 기록 & revision 갱신
     *  - DB(opStorage)에도 insert
     */
    public async add(docId: DocId, operation: IOperationModel): Promise<RevisionId> {
        const docOps = await this.getCache(docId);

        if (docOps.currentRevision + 1 !== operation.revision) {
            throw new Error(`Invalid revision: ${operation.revision} / ${docOps.currentRevision}`);
        }
        docOps.currentRevision = operation.revision;

        // 메모리에 추가
        docOps.ops.push(operation);

        this.opStorage.insert(docId, operation).catch(err => {
            console.error('Failed to insert OP to storage:', err);
        });

        return operation.revision;
    }

    /** ------------------ 내부 유틸 함수들 ------------------ **/

    /**
     * docId에 대한 10초 타이머(캐시 만료)를 리셋
     * - 이미 타이머가 있으면 clearTimeout 후 새로 setTimeout
     */
    private resetTimer(docId:DocId, docOps: InMemoryDocOps) {
        // 기존 타이머 클리어
        if (docOps.timer) {
            clearTimeout(docOps.timer);
            docOps.timer = null;
        }

        // 새 타이머 설정
        docOps.timer = setTimeout(() => {
            this.freeDoc(docId);
        }, this.CACHE_DURATION_MS);
    }

    /**
     * docId 캐시 완전 삭제
     * - ops 배열도 비우고, Map에서 제거
     * - 모든 docId가 free되면(즉 size=0), 필요시 추가 로직
     */
    private freeDoc(docId: DocId) {
        const docOps = this.docCache.get(docId);
        if (!docOps) return;

        // 타이머 해제
        if (docOps.timer) {
            clearTimeout(docOps.timer);
        }
        // ops 배열 비우기
        docOps.ops = [];
        this.docCache.delete(docId);

        // 모든 docId가 free되었는지 확인
        if (this.docCache.size === 0) {
            this.onAllFreed();
        }
    }

    /**
     * 모든 docId의 opList가 free된 경우
     * - 필요하면 추가 리소스 정리 (예: 이벤트 emit, DB 연결 해제 등)
     */
    private onAllFreed() {
        // 예: 큐 자체를 완전히 파괴하거나, 로그 출력 등
        console.log('[InMemoryOperationQueue] All docIds freed. (Memory cleared)');
        // 추가 정리 로직이 필요하다면 여기서 구현
    }
}

/**
 * 내부 구조: docCache에 저장되는 각 문서 데이터
 */
interface InMemoryDocOps {
    ops: Array<IOperationModel>;
    currentRevision: RevisionId;
    timer: NodeJS.Timeout | null;
}
