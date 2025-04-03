import {
    decompress,
    deepRestoreUndefined,
    DocId,
    FetchRequest,
    FetchResponse,
    IOperation, IOperationStorage, IWorkbookStorage,
    JoinRequest,
    JoinResponse,
    LeaveRequest,
    OpBroadcastResponse,
    OpRequest,
    OpResponse,
} from "@gongback/univer-sheet-collab";
import {IServer, ISocket, Subscriber} from "./types";

import { IWorkbookData } from "@univerjs/core";
import { SyncRequest, SyncResult} from "@gongback/univer-sheet-collab-sync-interface";

export type CollabSocketServerOptions = {
    opEmitEventName?: string;
    fetchEventName?: string;
    opEventName?: string;
    joinEventName?: string;
    leaveEventName?: string;

    syncSubscriber: Subscriber
    sendToSyncServer: (request: SyncRequest) => Promise<SyncResult>
    workbookStorage: IWorkbookStorage,
    opStorage: IOperationStorage
};

export class CollabSocketServer {
    private readonly server: IServer;

    private readonly opEventName: string;
    private readonly fetchEventName: string;
    private readonly opEmitEventName: string;
    private readonly joinEventName: string;
    private readonly leaveEventName: string;

    private readonly workbookStorage: IWorkbookStorage;
    private readonly opStorage: IOperationStorage;

    private sendToSyncServer: (request: SyncRequest) => Promise<SyncResult>
    private syncSubscriber :Subscriber;
    private docSubscriptions: Map<DocId, number> = new Map();

    constructor(server: IServer, options: CollabSocketServerOptions) {
        this.server = server;

        this.syncSubscriber = options.syncSubscriber;
        this.workbookStorage = options.workbookStorage;
        this.opStorage = options.opStorage;

        this.opEmitEventName = options?.opEmitEventName || 'sheet-collab-operation';
        this.opEventName = options?.opEventName || 'sheet-collab-operation';
        this.fetchEventName = options?.fetchEventName || 'sheet-collab-fetch';
        this.joinEventName = options?.joinEventName || 'sheet-collab-join';
        this.leaveEventName = options?.leaveEventName || 'sheet-collab-leave';

        this.sendToSyncServer = options.sendToSyncServer;

        this.onConnect = this.onConnect.bind(this);
        this.onJoin = this.onJoin.bind(this);
        this.onReceiveOperation = this.onReceiveOperation.bind(this);
        this.onFetch = this.onFetch.bind(this);
        this.handleLeave = this.handleLeave.bind(this);
    }

    public async listen() {
        await this.syncSubscriber.connect()
        this.server.on('connection', this.onConnect.bind(this));
    }

    private onConnect(socket: ISocket) {
        socket.on(this.joinEventName, async (request: JoinRequest, callback: (response: JoinResponse) => void) => {
            try {
                socket.join(`sheet-${request.docId}`);
                this.onJoin(socket, request.docId);

                const workbook = await this.workbookStorage.select(request.docId);
                if (!workbook?.rev) {
                    const newWorkbook = {
                        id: request.docId,
                        rev: 1
                    } as IWorkbookData

                    await this.workbookStorage.insert(
                        request.docId,
                        newWorkbook.rev!,
                        newWorkbook
                    )
                    callback({
                        success: true,
                        data: {
                            docId: request.docId,
                            operations: [],
                            workbookData: newWorkbook,
                        }
                    });
                    return;
                }
                const operations = await this.opStorage.selectAfter(request.docId, workbook.rev);
                callback({
                    success: true,
                    data: {
                        docId: request.docId,
                        operations,
                        workbookData: workbook,
                    }
                });
            } catch (e) {
                console.error(e);
                callback({ success: false, message: 'Failed to load sheet' });
            }
        });
        socket.on(this.leaveEventName, (request: LeaveRequest) => {
            socket.leave(`sheet-${request.docId}`);
            this.handleLeave(request.docId);
        });

        socket.on('disconnect', (e: any) => {
        });
    }

    private onJoin(socket: ISocket, docId: DocId) {
        const wrappedOpCallback = async (request: OpRequest, callback: (response: OpResponse) => void) => {
            const result = await this.onReceiveOperation(request, socket);
            callback(result);
        };

        const wrappedFetchCallback = (request: FetchRequest, callback: (response: FetchResponse) => void) => {
            this.onFetch(request, callback);
        };

        const wrappedLeaveCallback = (request: LeaveRequest) => {
            socket.off(`${this.opEventName}:${request.docId}`, wrappedOpCallback);
            socket.off(`${this.fetchEventName}:${request.docId}`, wrappedFetchCallback);
            socket.off(this.leaveEventName, wrappedLeaveCallback);
            this.handleLeave(request.docId);
        };

        socket.off(`${this.opEventName}:${docId}`, wrappedOpCallback);
        socket.on(`${this.opEventName}:${docId}`, wrappedOpCallback);
        socket.off(`${this.fetchEventName}:${docId}`, wrappedFetchCallback);
        socket.on(`${this.fetchEventName}:${docId}`, wrappedFetchCallback);
        socket.on(this.leaveEventName, wrappedLeaveCallback);

        this.addDocSubscription(docId);
    }

    private async onReceiveOperation(request: OpRequest, socket: ISocket): Promise<OpResponse> {
        const receivedOperation = { ...request.operation };
        const operationId = receivedOperation.operationId;
        try {
            const collabId = (socket as any).collabId;
            receivedOperation.command.params = decompress(request.operation.command.params);
            receivedOperation.command.params = deepRestoreUndefined(receivedOperation.command.params, "$UNDEFINED$");

            const syncRequest:SyncRequest = {
                docId: request.docId,
                collabId: collabId,
                operation: receivedOperation
            };

            const result:SyncResult = await this.sendToSyncServer(syncRequest);
            const response: OpResponse = {
                success: true,
                operationId,
                data: {
                    docId: result.docId,
                    operation: result.operation,
                    isTransformed: result.isTransformed
                }
            }

            return response;
        } catch (e: any) {
            console.error(e);
            const message = `${e.name || 'Internal Server Error'}: ${e.message || 'Unknown Error'}`;
            const response: OpResponse = {
                success: false,
                operationId,
                message,
            }
            return response;
        }
    }

    private addDocSubscription(docId: DocId) {
        // 구독자 수 증가
        const count = this.docSubscriptions.get(docId) || 0;
        this.docSubscriptions.set(docId, count + 1);

        if (count === 0) {
            const channel = `doc:${docId}:op`;
            this.syncSubscriber.subscribe(channel, (message) => {
                try {
                    const opResult = JSON.parse(message) as IOperation;
                    const response: OpBroadcastResponse = {
                        docId: docId,
                        operation: opResult
                    }
                    // 해당 docId 룸에 연결된 모든 클라이언트에게 emit
                    this.server.to(`sheet-${docId}`).emit(`${this.opEmitEventName}:${docId}`, response);
                } catch (err) {
                    console.error('Error processing Subscriber message:', err);
                }
            }).catch(console.error);
            console.log(`[GongbackCollabServer] Subscribed to Subscriber channel ${channel}`);
        }
    }

    private async handleLeave(docId: DocId) {
        const count = this.docSubscriptions.get(docId) || 0;
        if (count <= 1) {
            this.docSubscriptions.delete(docId);
            const channel = `doc:${docId}:op`;
            try {
                await this.syncSubscriber.unsubscribe(channel);
                console.log(`[GongbackCollabServer] Unsubscribed from Subscriber channel ${channel}`);
            } catch (err) {
                console.error(`Error unsubscribing from channel ${channel}:`, err);
            }
        } else {
            this.docSubscriptions.set(docId, count - 1);
        }
    }

    private async onFetch(request: FetchRequest, callback: (response: FetchResponse) => void) {
        const operations = await this.opStorage.selectAfter(request.docId, request.revision)
        callback({
            success: true,
            data: {
                docId: request.docId,
                operations,
            }
        })
    }
}
