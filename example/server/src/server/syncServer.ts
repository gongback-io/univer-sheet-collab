import {SyncServer} from "@gongback/univer-sheet-collab-sync-server";
import {opStorage} from "../repo/OpStorage";
import {workbookStorage} from "../repo/WorkbookStorage";
import {DocId} from "@gongback/univer-sheet-collab";
import {WorkbookModel} from "../model/WorkbookModel";
import {startGrpcServer} from "../model/grpc/GrpcServer";
import {createClient as createRedisClient} from 'redis';

export function startSyncServer() {
    const syncServer = new SyncServer({
        operationStorage: opStorage,
        workbookStorage,
        workbookDelegateFactory:(docId: DocId) => new WorkbookModel(docId),
        syncPublisher: createRedisClient({
            url: 'redis://localhost:6379'
        }),
    });
    syncServer.start().then(() => {
        startGrpcServer(syncServer)
        console.log('Sync server started');
    })
}
