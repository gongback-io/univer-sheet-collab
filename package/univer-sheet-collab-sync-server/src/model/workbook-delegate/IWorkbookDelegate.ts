import {DocId, IOperation} from "@gongback/univer-sheet-collab";
import {ICommandInfo, IExecutionOptions, IWorkbookData } from "@univerjs/core";

export type OnOperationExecutedCallback = (command: IOperation, options?: IExecutionOptions) => void;
export interface IWorkbookDelegate {
    readonly docId: DocId;
    createSheet(workbookData: Partial<IWorkbookData>): Promise<void>;
    onOperationExecuted(listener:OnOperationExecutedCallback): Promise<void>
    executeOperations(operation: IOperation[], options?:IExecutionOptions): Promise<{ workbookData: IWorkbookData, results: any[] }>
    getSnapshot(): Promise<IWorkbookData>
    dispose(): Promise<void>;
}
