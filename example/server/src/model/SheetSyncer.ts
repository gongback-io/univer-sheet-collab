import {ExecResult, ExecRequest, ISheetSyncer} from "@gongback/univer-sheet-collab";
import {CreateDocGrpcRequest, CreateDocGrpcResult, SendOperationGrpcRequest, SendOperationGrpcResult} from "../types";
import {grpcClient} from "./grpc/GrpcClient";
import { IWorkbookData } from "@univerjs/core";

class SheetSyncer implements ISheetSyncer {
    createDoc(docId: string, initialWorkbookData?: Partial<IWorkbookData>): Promise<IWorkbookData> {
        return new Promise((resolve, reject) => {
            const grpcRequest: CreateDocGrpcRequest = {
                docId,
                initialWorkbookDataJson: JSON.stringify({rev:1, id: docId})
            }
            console.log('[grpcClient] createDoc request', grpcRequest);
            grpcClient.CreateDoc(grpcRequest, (err: any, response: CreateDocGrpcResult) => {
                console.log('[grpcClient] createDoc response', response);
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.parse(response.workbookDataJson) as IWorkbookData);
                }
            });
        });
    }
    execOperation(request: ExecRequest): Promise<ExecResult> {
        return new Promise((resolve, reject) => {
            const {
                docId,
                collabId,
                operationId,
                revision,
                command
            } = request;
            const grpcRequest: SendOperationGrpcRequest = {
                docId,
                collabId,
                operationId,
                revision,
                commandJson : JSON.stringify(command)
            }
            console.log('[grpcClient] sync', grpcRequest);
            grpcClient.SendOperation(grpcRequest, (err: any, response: SendOperationGrpcResult) => {
                console.log('[grpcClient] sync', response);
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        docId: response.docId,
                        operation: JSON.parse(response.operationJson),
                        isTransformed: response.isTransformed,
                    } as ExecResult);
                }
            });
        });
    }
}
const sheetSyncer = new SheetSyncer();
export default sheetSyncer;
