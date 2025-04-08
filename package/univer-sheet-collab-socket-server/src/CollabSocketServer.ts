import {
    CollabId,
    decompress,
    deepRestoreUndefined,
    DocId,
    FetchRequest,
    FetchResponse,
    IOperation,
    IOperationStorage,
    IWorkbookStorage,
    JoinRequest,
    JoinResponse,
    LeaveRequest,
    OpBroadcastResponse,
    OpRequest,
    OpResponse,
    ISheetSyncer,
    ExecRequest,
    ExecResult,
} from "@gongback/univer-sheet-collab";
import {IServer, ISocket, Subscriber} from "./types";
import {IWorkbookData} from "@univerjs/core";

export type CollabSocketServerOptions = {
    opEmitEventName?: string;
    fetchEventName?: string;
    opEventName?: string;
    joinEventName?: string;
    leaveEventName?: string;

    syncSubscriber: Subscriber;
    sheetSyncer: ISheetSyncer;
    workbookStorage: IWorkbookStorage;
    opStorage: IOperationStorage;
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

    private readonly sheetSyncer: ISheetSyncer;
    private readonly syncSubscriber: Subscriber;

    private docSubscriptions: Map<DocId, number> = new Map();
    private userJoinedDocs: Map<CollabId, DocId[]> = new Map();

    constructor(server: IServer, options: CollabSocketServerOptions) {
        this.server = server;

        this.syncSubscriber = options.syncSubscriber;
        this.workbookStorage = options.workbookStorage;
        this.opStorage = options.opStorage;
        this.sheetSyncer = options.sheetSyncer;

        this.opEmitEventName = options.opEmitEventName || "sheet-collab-operation";
        this.opEventName = options.opEventName || "sheet-collab-operation";
        this.fetchEventName = options.fetchEventName || "sheet-collab-fetch";
        this.joinEventName = options.joinEventName || "sheet-collab-join";
        this.leaveEventName = options.leaveEventName || "sheet-collab-leave";

        this.onConnect = this.onConnect.bind(this);
        this.handleJoin = this.handleJoin.bind(this);
        this.onReceiveOperation = this.onReceiveOperation.bind(this);
        this.onFetch = this.onFetch.bind(this);
        this.handleLeave = this.handleLeave.bind(this);
    }

    public async listen() {
        await this.syncSubscriber.connect();
        this.server.on("connection", this.onConnect);
    }

    private onConnect(socket: ISocket) {
        socket.on(this.joinEventName,
            async (request: JoinRequest, callback: (response: JoinResponse) => void) => {
                try {
                    socket.join(`sheet-${request.docId}`);
                    const data = await this.handleJoin(socket.id, request.docId);
                    callback({success: true, data});
                } catch (e) {
                    console.error(e);
                    callback({success: false, message: "Failed to load sheet"});
                }
            }
        );

        socket.on(this.leaveEventName, (request: LeaveRequest) => {
            socket.leave(`sheet-${request.docId}`);
            this.handleLeave(socket.id, request.docId);
        });

        socket.on(this.opEventName, async (request: OpRequest, callback: (response: OpResponse) => void) => {
                const result = await this.onReceiveOperation(request, socket);
                callback(result);
            }
        );

        socket.on(this.fetchEventName, (request: FetchRequest, callback: (response: FetchResponse) => void) => {
                this.onFetch(request, callback);
            }
        );

        socket.on("disconnect", () => {
            const joinedDocs = this.userJoinedDocs.get(socket.id) || [];
            for (const docId of joinedDocs) {
                socket.leave(`sheet-${docId}`);
                this.handleLeave(socket.id, docId);
            }
        });
    }

    private async handleJoin(collabId: CollabId, docId: DocId) {
        const joinedDocs = this.userJoinedDocs.get(collabId) || [];
        if (!joinedDocs.includes(docId)) {
            this.userJoinedDocs.set(collabId, [...joinedDocs, docId]);
        }

        this.addDocSubscription(docId);
        return await this.getDocData(docId);
    }

    private async handleLeave(collabId:CollabId, docId: DocId) {
        const count = this.docSubscriptions.get(docId) || 0;
        if (count <= 1) {
            this.docSubscriptions.delete(docId);
            const channel = `doc:${docId}:op`;
            try {
                await this.syncSubscriber.unsubscribe(channel);
                console.log(`[CollabSocketServer] Unsubscribed from channel: ${channel}`);
            } catch (err) {
                console.error(`Error unsubscribing from channel ${channel}:`, err);
            }
        } else {
            this.docSubscriptions.set(docId, count - 1);
        }

        const joinedDocs = this.userJoinedDocs.get(collabId) || [];
        const updatedJoinedDocs = joinedDocs.filter((doc) => doc !== docId);
        if (updatedJoinedDocs.length === 0) {
            this.userJoinedDocs.delete(collabId);
        } else {
            this.userJoinedDocs.set(collabId, updatedJoinedDocs);
        }
    }

    /**
     * 받은 operation을 처리
     * @param request
     * @param socket
     */
    private async onReceiveOperation(request: OpRequest, socket: ISocket): Promise<OpResponse> {
        const receivedOperation = {...request.operation};
        const operationId = receivedOperation.operationId;

        try {
            receivedOperation.command.params = decompress(request.operation.command.params);
            receivedOperation.command.params = deepRestoreUndefined(
                receivedOperation.command.params,
                "$UNDEFINED$"
            );

            // 실제 문서 수정 로직 (SyncServer)
            const execRequest: ExecRequest = {
                docId: request.docId,
                collabId: socket.id,
                operationId: receivedOperation.operationId,
                revision: receivedOperation.revision,
                command: receivedOperation.command
            };

            const result: ExecResult = await this.sheetSyncer.execOperation(execRequest);

            return {
                success: true,
                operationId,
                data: {
                    docId: result.docId,
                    operation: result.operation,
                    isTransformed: result.isTransformed,
                },
            };
        } catch (e: any) {
            console.error(e);
            const message = `${e.name || "Internal Server Error"}: ${e.message || "Unknown Error"}`;
            return {
                success: false,
                operationId,
                message,
            };
        }
    }

    /**
     * 문서별 구독자 수를 관리하는 메서드
     * 구독자 수가 0이 되는 시점에 Redis(또는 Pub/Sub) 채널을 unsubscribe
     */
    private addDocSubscription(docId: DocId) {
        const count = this.docSubscriptions.get(docId) || 0;
        this.docSubscriptions.set(docId, count + 1);

        // 처음 구독이면 Redis subscriber 등록
        if (count === 0) {
            const channel = `doc:${docId}:op`;
            this.syncSubscriber
                .subscribe(channel, (message) => {
                    try {
                        const opResult = JSON.parse(message) as IOperation;
                        const response: OpBroadcastResponse = {
                            docId: docId,
                            operation: opResult,
                        };
                        // 해당 docId room의 모든 클라이언트에게 emit
                        this.server.to(`sheet-${docId}`).emit(this.opEmitEventName, response);
                    } catch (err) {
                        console.error("Error processing Subscriber message:", err);
                    }
                })
                .catch(console.error);

            console.log(`[CollabSocketServer] Subscribed to channel: ${channel}`);
        }
    }

    /**
     * 특정 revision 이후의 operation들을 가져와 응답
     */
    private async onFetch(request: FetchRequest, callback: (response: FetchResponse) => void) {
        try {
            const operations = await this.opStorage.selectAfter(request.docId, request.revision);
            callback({
                success: true,
                data: {
                    docId: request.docId,
                    operations,
                },
            });
        } catch (e) {
            console.error(e);
            callback({
                success: false,
                message: "Failed to fetch operations",
            });
        }
    }

    private async getDocData(docId: DocId) {
        let operations: IOperation[] = [];
        let workbookData: IWorkbookData;
        const workbook = await this.workbookStorage.select(docId);
        if (!workbook?.rev) {
            const newWorkbook = await this.sheetSyncer.createDoc(docId, {
                id: docId,
                rev: 1,
            });
            operations = [];
            workbookData = newWorkbook;
        } else {
            operations = await this.opStorage.selectAfter(docId, workbook.rev);
            workbookData = workbook
        }
        return {
            docId,
            operations,
            workbookData
        };
    }
}
