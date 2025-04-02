import path from 'path';
import * as protoLoader from '@grpc/proto-loader';
import * as grpc from '@grpc/grpc-js';

const PROTO_PATH = path.join(__dirname, 'leader_service.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const leaderProto = grpc.loadPackageDefinition(packageDefinition) as any;

export {leaderProto}
