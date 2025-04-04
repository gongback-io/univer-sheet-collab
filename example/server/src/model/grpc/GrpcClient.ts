import * as grpc from '@grpc/grpc-js';
import {leaderProto} from "../../proto";

export const grpcClient = new leaderProto.leader.LeaderService('localhost:50051', grpc.credentials.createInsecure());
