import {
    DocId,
    IApplayRevisionMutationParams,
    IOperation,
    IOperationStorage,
    IWorkbookStorage
} from "@gongback/univer-sheet-collab";
import {IWorkbookDelegate} from "./workbook-delegate/IWorkbookDelegate";

export class PostProcessor {
    private workbookStorage: IWorkbookStorage;
    private operationStorage: IOperationStorage;

    constructor(workbookStorage: IWorkbookStorage, operationStorage: IOperationStorage) {
        this.workbookStorage = workbookStorage;
        this.operationStorage = operationStorage;
    }

    async postProcess(docId: DocId, workbookDelegate: IWorkbookDelegate, transformedOperation: IOperation, isSheetChangeOp:boolean): Promise<{
        needPublish: boolean,
        execResult: any
    }> {
        const transformed = transformedOperation;
        if (transformed.command.id === "collab.mutation.apply-revision") {
            const params = transformed.command.params as IApplayRevisionMutationParams
            const revisionWorkbookData = await this.workbookStorage.select(docId, params.revision);
            if (!revisionWorkbookData) {
                throw new Error(`Cannot revert revision: ${params.revision}`);
            }
            revisionWorkbookData.rev = transformed.revision
            await this.workbookStorage.insert(docId, transformed.revision, revisionWorkbookData)
            return {
                needPublish: false,
                execResult: true
            };
        }
        const currentWorkbook = await this.workbookStorage.select(docId);
        if (!currentWorkbook) {
            throw new Error(`Cannot find workbook: ${docId}`);
        }
        let operations: IOperation[] = [];
        if (currentWorkbook.rev) {
            operations = await this.operationStorage.selectAfter(docId, currentWorkbook.rev)
        }
        await workbookDelegate.createSheet(currentWorkbook)

        console.log(transformed.command.id)
        const {workbookData, results} = await workbookDelegate.executeOperations([
            ...operations.filter(operation => operation.operationId !== transformedOperation.operationId),
            transformed,
        ], {onlyLocal: true, fromCollab: true})
        if (isSheetChangeOp) {
            await this.workbookStorage.insert(docId, transformed.revision, workbookData)
        }
        const result = results[results.length - 1];
        return {
            needPublish: true,
            execResult: result
        };
    }
}
