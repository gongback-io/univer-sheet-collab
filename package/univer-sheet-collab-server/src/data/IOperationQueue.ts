import {ITransformableOperation, RevisionId} from "@gongback/univer-sheet-collab";

export interface IOperationQueue {
    readonly currentRevision: RevisionId
    get(revisionId: RevisionId) : ITransformableOperation | null
    getAfter(fromRevisionId: RevisionId) : Promise<ITransformableOperation[]>
    add(operation: ITransformableOperation): RevisionId
}
