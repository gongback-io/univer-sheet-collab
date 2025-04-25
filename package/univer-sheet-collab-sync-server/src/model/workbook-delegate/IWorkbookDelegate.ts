import {CollabId, DocId, IOperation} from "@gongback/univer-sheet-collab";
import {IExecutionOptions, IWorkbookData } from "@univerjs/core";

export type OnOperationExecutedCallback = (command: IOperation, options?: IExecutionOptions) => void;
export interface IWorkbookDelegate {
    readonly docId: DocId;
    readonly collabId: CollabId;
    createSheet(workbookData: Partial<IWorkbookData>): Promise<void>;
    onOperationExecuted(operation: IOperation, options?: IExecutionOptions): void;
    setOnOperationExecuted(listener:OnOperationExecutedCallback): Promise<void>
    executeOperations(operation: IOperation[], options?:IExecutionOptions): Promise<{ workbookData: IWorkbookData, results: any[] }>
    getSnapshot(): Promise<IWorkbookData>
    dispose(): Promise<void>;
}
