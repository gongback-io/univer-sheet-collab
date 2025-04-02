import * as grpc from '@grpc/grpc-js';
import {SyncRequest, SyncResult} from "@gongback/univer-sheet-collab-sync-server";
import {GrpcRequest, GrpcResult} from "../types";
import {leaderProto} from "../proto";

const grpcClient = new leaderProto.leader.LeaderService('localhost:50051', grpc.credentials.createInsecure());
export async function sendOverGrpc (request: SyncRequest): Promise<SyncResult> {
    return await new Promise((resolve, reject) => {
        const grpcRequest: GrpcRequest = {
            docId: request.docId,
            collabId: request.collabId,
            operationJson: JSON.stringify(request.operation)
        }
        console.log('[grpcClient] grpcRequest', grpcRequest);
        grpcClient.SendOperation(grpcRequest, (err: any, response: GrpcResult) => {
            console.log('[grpcClient] grpcResponse', response);
            if (err) {
                reject(err);
            } else {
                resolve({
                    docId: response.docId,
                    operation: JSON.parse(response.operationJson),
                    isTransformed: response.isTransformed,
                } as SyncResult);
            }
        });
    });
}
