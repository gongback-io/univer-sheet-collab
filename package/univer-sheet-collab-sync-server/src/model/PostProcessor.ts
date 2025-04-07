import {
    DocId,
    IApplayRevisionMutationParams,
    IOperation,
    IOperationStorage,
    IWorkbookStorage
} from "@gongback/univer-sheet-collab";
import {WorkbookDelegateFactory} from "../types";

export class PostProcessor {
    private workbookDelegateFactory: WorkbookDelegateFactory;
    private workbookStorage: IWorkbookStorage;
    private operationStorage: IOperationStorage;

    constructor(workbookDelegateFactory: WorkbookDelegateFactory, workbookStorage: IWorkbookStorage, operationStorage: IOperationStorage) {
        this.workbookDelegateFactory = workbookDelegateFactory;
        this.workbookStorage = workbookStorage;
        this.operationStorage = operationStorage;
    }

    async postProcess(docId: DocId, transformedOperation: IOperation, isSheetChangeOp:boolean) {
        const transformed = transformedOperation;
        if (transformed.command.id === "collab.mutation.apply-revision") {
            const params = transformed.command.params as IApplayRevisionMutationParams
            const revisionWorkbookData = await this.workbookStorage.select(docId, params.revision);
            if (!revisionWorkbookData) {
                throw new Error(`Cannot revert revision: ${params.revision}`);
            }
            revisionWorkbookData.rev = transformed.revision
            await this.workbookStorage.insert(docId, transformed.revision, revisionWorkbookData)
            return;
        }
        if (isSheetChangeOp) {
            const currentWorkbook = await this.workbookStorage.select(docId);
            if (!currentWorkbook) {
                throw new Error(`Cannot find workbook: ${docId}`);
            }
            let operations: IOperation[] = [];
            if (currentWorkbook.rev) {
                operations = await this.operationStorage.selectAfter(docId, currentWorkbook.rev+1)
            }
            const workbookDelegate = this.workbookDelegateFactory(docId)
            await workbookDelegate.createSheet(currentWorkbook)

            const workbookData = await workbookDelegate.executeOperations([
                ...operations,
                transformed,
            ])

            await workbookDelegate.dispose();
            await this.workbookStorage.insert(docId, transformed.revision, workbookData)
        }

        return;
    }
}
