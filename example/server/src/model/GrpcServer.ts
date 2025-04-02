import {DocId, IOperation} from "@gongback/univer-sheet-collab";
import {SyncServer, SyncResult} from "@gongback/univer-sheet-collab-sync-server";
import * as grpc from '@grpc/grpc-js';
import {GrpcRequest, GrpcResult} from "../types";
import {leaderProto} from "../proto";

export function startGrpcServer(syncServer: SyncServer) {
    // (3) gRPC 서버 생성
    const server = new grpc.Server();

    // (4) LeaderService에 handler 등록
    server.addService(leaderProto.leader.LeaderService.service, {
        SendOperation: (call: grpc.ServerUnaryCall<GrpcRequest, any>, callback: grpc.sendUnaryData<GrpcResult>) => {
            const request:GrpcRequest = call.request; // OperationRequest
            console.log('[grpcServer] grpcRequest', request);
            const docId: DocId = request.docId;
            const collabId = request.collabId;
            const operation = JSON.parse(request.operationJson) as IOperation;

            syncServer.sendOperation({
                docId,
                collabId,
                operation,
            }).then((result: SyncResult) => {
                const grpcResult:GrpcResult = {
                    docId: result.docId,
                    operationJson: JSON.stringify(result.operation),
                    isTransformed: result.isTransformed,
                };
                console.log('[grpcServer] grpcResponse', grpcResult);
                callback(null, grpcResult);
            }).catch((error) => {
                console.error('[LeaderServer] sendOperation Error:', error);
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
        console.log(`[LeaderServer] gRPC server listening on ${bindAddress}`);
        server.start();
    });
}
