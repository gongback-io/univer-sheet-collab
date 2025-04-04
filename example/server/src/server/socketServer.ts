import {CollabSocketServer} from "@gongback/univer-sheet-collab-socket-server";
import {workbookStorage} from "../repo/WorkbookStorage";
import {opStorage} from "../repo/OpStorage";
import {Server} from 'socket.io';
import {createClient as createRedisClient} from 'redis';
import sheetSyncer from "../model/SheetSyncer";

export function startSocketServer(io: Server) {
    new CollabSocketServer(io, {
        syncSubscriber: createRedisClient({
            url: 'redis://localhost:6379'
        }),
        workbookStorage,
        opStorage,
        sheetSyncer
    }).listen().then(() => {
        console.log('Socket server listening');
    });
}
