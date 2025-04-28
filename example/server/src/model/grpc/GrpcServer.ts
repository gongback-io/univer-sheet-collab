import {DocId, ExecResult} from "@gongback/univer-sheet-collab";
import {SyncServer} from "@gongback/univer-sheet-collab-sync-server";
import * as grpc from '@grpc/grpc-js';
import {CreateDocGrpcRequest, CreateDocGrpcResult, SendOperationGrpcRequest, SendOperationGrpcResult} from "../../types";
import {leaderProto} from "../../proto";
import { IWorkbookData } from "@univerjs/core";

export function startGrpcServer(syncServer: SyncServer) {
    // (3) gRPC 서버 생성
    const server = new grpc.Server();

    // (4) LeaderService에 handler 등록
    server.addService(leaderProto.leader.LeaderService.service, {
        CreateDoc: (call: grpc.ServerUnaryCall<CreateDocGrpcRequest, any>, callback: grpc.sendUnaryData<CreateDocGrpcResult>) => {
            const request:CreateDocGrpcRequest = call.request; // OperationRequest
            console.log('[grpcServer] createDoc request', request);
            const docId: DocId = request.docId;
            const initialWorkbookData = JSON.parse(request.initialWorkbookDataJson) as IWorkbookData;
            syncServer.createDoc(docId, initialWorkbookData).then((workbookData) => {
                const result: CreateDocGrpcResult = {
                    docId,
                    workbookDataJson: JSON.stringify(workbookData),
                }
                console.log('[grpcServer] createDoc result', result);
                callback(null, result)
            }).catch(e => {
                console.error('[grpcServer] createDoc Error:', e);
                callback({
                    code: grpc.status.UNKNOWN,
                    message: 'Internal Server Error',
                } as grpc.ServiceError, null);
            })
        },
        SendOperation: (call: grpc.ServerUnaryCall<SendOperationGrpcRequest, any>, callback: grpc.sendUnaryData<SendOperationGrpcResult>) => {
            const request:SendOperationGrpcRequest = call.request; // OperationRequest
            console.log('[grpcServer] grpcRequest', request);

            const {
                docId,
                collabId,
                operationId,
                revision,
                commandJson
            } = request;

            syncServer.execOperation({
                docId,
                collabId,
                operationId,
                revision,
                command: JSON.parse(commandJson),
            }).then((result: ExecResult) => {
                const grpcResult:SendOperationGrpcResult = {
                    docId: result.docId,
                    operationJson: JSON.stringify(result.operation),
                    isTransformed: result.isTransformed,
                    execResultJson: JSON.stringify(result.execResult)
                };
                console.log('[grpcServer] grpcResponse', grpcResult);
                callback(null, grpcResult);
            }).catch((error) => {
                console.error('[grpcServer] sendOperation Error:', error);
                callback({
                    code: grpc.status.UNKNOWN,
                    message: 'Internal Server Error',
                } as grpc.ServiceError, null);
            })
        }
    });

    // (5) 서버 바인딩
    const bindAddress = '0.0.0.0:50051';
    server.bindAsync(bindAddress, grpc.ServerCredentials.createInsecure(), (err, port) => {
        if (err) throw err;
        console.log(`[grpcServer] gRPC server listening on ${bindAddress}`);
        server.start();
    });
}
