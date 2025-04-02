import {CollabSocketServer} from "@gongback/univer-sheet-collab-socket-server";
import {workbookStorage} from "../repo/WorkbookStorage";
import {opStorage} from "../repo/OpStorage";
import {sendOverGrpc} from "../model/GrpcClient";
import {Server} from 'socket.io';
import {createClient as createRedisClient} from 'redis';

export function startSocketServer(io: Server) {
    new CollabSocketServer(io, {
        syncSubscriber: createRedisClient({
            url: 'redis://localhost:6379'
        }),
        workbookStorage,
        opStorage,
        sendToSyncServer: sendOverGrpc
    }).listen().then(() => {
        console.log('Socket server listening');
    });
}
