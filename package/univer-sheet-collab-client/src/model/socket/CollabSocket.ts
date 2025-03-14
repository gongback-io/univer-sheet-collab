import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import {
    DocId,
    JoinRequest,
    JoinResponse,
    JoinResponseData,
    OpRequest,
    OpResponse,
    OpBroadcastResponse,
    FetchResponse,
    FetchRequest,
    deepReplaceUndefined,
    deepRestoreUndefined,
    IOperation,
    compressDuplicates
} from '@gongback/univer-sheet-collab';
import {
    CollabSocketOptions,
    defaultOpEmitName,
    defaultOpEventName,
    defaultJoinEventName,
    defaultLeaveEventName, defaultFetchEventName,
} from "../../types";
import SortingOperationQueue from "../queue/SortingOperationQueue";
import {Disposable, IConfigService} from "@univerjs/core";
import {
    ISocketConfig,
    SOCKET_CONFIG_KEY
} from "../../controller/config.schema";

export type OperationBroadCastListener = (response: OpBroadcastResponse) => void;

export class CollabSocket extends Disposable {
    readonly collabId: string = uuid8();

    private socket?: Socket;
    private readonly serverUrl: string;
    private readonly opts?: CollabSocketOptions;

    private pendingOperation: { [docId: string]: SortingOperationQueue<IOperation> } = {};
    private onOperationBroadcastListeners: { [docId: string]: OperationBroadCastListener } = {};

    private offlineListeners: { [docId: string]: (reason: string) => void} = {};
    private reconnectListeners: { [docId: string]: () => void} = {};

    private opEmitName: string;
    private opEventName: string;
    private joinEventName: string;
    private leaveEventName: string;
    private fetchEventName: string;

    constructor(
        @IConfigService private readonly _configService: IConfigService
    ) {
        super();
        const config = _configService.getConfig<ISocketConfig>(SOCKET_CONFIG_KEY)!;

        this.serverUrl = config.serverUrl;
        this.opts = config.opts;
        this.opEmitName = config?.opEmitName || defaultOpEmitName;
        this.opEventName = config?.opEventName || defaultOpEventName;
        this.joinEventName = config?.joinEventName || defaultJoinEventName;
        this.leaveEventName = config?.leaveEventName || defaultLeaveEventName;
        this.fetchEventName = config?.fetchEventName || defaultFetchEventName;

        this.onBroadcast = this.onBroadcast.bind(this);
        this.closeSocket = this.closeSocket.bind(this);
        this.onDisconnect = this.onDisconnect.bind(this);
        this.onReconnect = this.onReconnect.bind(this);
        this.leaveSheet = this.leaveSheet.bind(this);
        this.fetch = this.fetch.bind(this);
        this.setOnOfflineListener = this.setOnOfflineListener.bind(this);
        this.removeOnOfflineListener = this.removeOnOfflineListener.bind(this);
        this.setOnReconnectListener = this.setOnReconnectListener.bind(this);
        this.removeOnReconnectListener = this.removeOnReconnectListener.bind(this);
        this.setOnBroadcastListener = this.setOnBroadcastListener.bind(this);
        this.removeOnBroadcastListener = this.removeOnBroadcastListener.bind(this);
    }

    public on(event: string, listener: (...args: any[]) => void) {
        this.socket?.on(event, listener);
    }
    public off(event: string, listener: (...args: any[]) => void) {
        this.socket?.off(event, listener);
    }
    public connect() {
        this.socket?.connect();
    }
    public disconnect() {
        this.socket?.disconnect();
    }

    public setOnOfflineListener(docId: DocId, listener: (reason: string) => void) {
        this.offlineListeners[docId] = listener;
    }

    public removeOnOfflineListener(docId: DocId) {
        delete this.offlineListeners[docId];
    }

    public setOnReconnectListener(docId: DocId, listener: () => void) {
        this.reconnectListeners[docId] = listener;
    }
    public removeOnReconnectListener(docId: DocId) {
        delete this.reconnectListeners[docId];
    }

    public setOnBroadcastListener(docId: DocId, broadcastListener: OperationBroadCastListener) {
        this.pendingOperation[docId]?.forEach(operation => {
            broadcastListener({ docId, operation });
        });
        delete this.pendingOperation[docId];
        this.onOperationBroadcastListeners[docId] = broadcastListener;
    }

    public removeOnBroadcastListener(docId: DocId) {
        delete this.onOperationBroadcastListeners[docId];
    }

    public async joinSheet(docId: string): Promise<JoinResponseData> {
        const request: JoinRequest = { docId, collabId: this.collabId };
        if (!this.socket) {
            await this.connectSocket();
        }

        return new Promise((resolve, reject) => {
            if (!this.onOperationBroadcastListeners[docId]) {
                this.pendingOperation[docId] = new SortingOperationQueue();
            }
            this.socket!.on(`${this.opEventName}:${docId}`, this.onBroadcast);

            this.socket!.emit(this.joinEventName, request, (response: JoinResponse) => {
                if (!response.success) {
                    const err = new Error(response.message || 'Join failed');
                    console.error(err);
                    reject(err);
                    return;
                }

                if (response.data) {
                    const joinResponseData: JoinResponseData = response.data;
                    console.log('Joined doc:', docId, 'Revision:', response.data.workbookData.rev);

                    if (this.onOperationBroadcastListeners[docId]) {
                        joinResponseData.operations.map(op => {
                            this.onOperationBroadcastListeners[docId]({ docId, operation: op });
                        });

                    } else {
                        if (this.pendingOperation[docId]) {
                            response.data.operations.map(op => {
                                this.pendingOperation[docId].push(op);
                            })
                        }
                    }

                    resolve(joinResponseData);
                } else {
                    reject(new Error('Join failed'));
                }
            });
        });
    }

    public leaveSheet(docId: string) {
        if (!this.socket) {
            return;
        }
        console.log('leaveSheet')
        this.socket?.off(`${this.opEventName}:${docId}`, this.onBroadcast);

        this.socket?.emit(this.leaveEventName, { docId });

        delete this.pendingOperation[docId];
        this.removeOnOfflineListener(docId);
        this.removeOnBroadcastListener(docId);
    }

    public fetch(docId: DocId, revision: number): Promise<FetchResponse> {
        return new Promise((resolve, reject) => {
            try {
                if (!this.socket) {
                    reject(new Error('Socket not connected'));
                    return;
                }
                const request: FetchRequest = { docId, revision };
                this.socket.emit(`${this.fetchEventName}:${docId}`, request, (response: FetchResponse) => {
                    response.data?.operations.forEach(op => {
                        op.command.params = deepRestoreUndefined(op.command.params, "$UNDEFINED$");
                    })
                    resolve(response);
                });
            } catch(e) {
                reject(e);
            }
        });
    }

    public sendOperation(request: OpRequest, callback: (response: OpResponse) => void) {
        if (!this.socket) {
            throw new Error('Socket not connected');
        }
        const docId = request.docId;

        request.operation.command.params = deepReplaceUndefined(request.operation.command.params, "$UNDEFINED$");
        request.operation.command.params = compressDuplicates(request.operation.command.params);
        console.log('sendOperation', request.operation, JSON.stringify(request.operation.command.params).length);
        this.socket.emit(`${this.opEmitName}:${docId}`, request, (response: OpResponse) => {
            if (response.data?.operation.command.params) {
                response.data.operation.command.params = deepRestoreUndefined(response.data?.operation.command.params, "$UNDEFINED$");
            }
            callback(response);
        });
    }

    private onBroadcast(data: OpBroadcastResponse) {
        data.operation.command.params = deepRestoreUndefined(data.operation.command.params, "$UNDEFINED$");
        if (this.onOperationBroadcastListeners[data.docId]) {
            this.onOperationBroadcastListeners[data.docId](data);
        } else {
            this.pendingOperation[data.docId]?.push(data.operation);
        }
    }

    private async connectSocket() {
        this.socket = io(this.serverUrl, {
            ...this.opts,
            reconnection: true,
        });

        await new Promise((resolve, reject) => {
            const onConnectError = (err: any) => {
                console.error('Socket connection error:', err);
                this.socket?.off('connect_error', onConnectError);
                this.socket?.off('connect', onConnect);
                reject(err);
            };
            const onConnect = () => {
                console.log('Socket connected');
                this.socket?.off('connect_error', onConnectError);
                this.socket?.off('connect', onConnect);
                resolve(null);
            };
            this.socket!.on('connect_error', onConnectError);
            this.socket!.on('connect', onConnect);
        });

        // 소켓 disconnect(offline) 이벤트 등록
        this.socket?.on('disconnect', this.onDisconnect);
        this.socket?.on('connect', this.onReconnect);
    }

    private closeSocket() {
        this.socket?.off('disconnect', this.onDisconnect);

        this.socket?.close();
        this.socket = undefined;
    }

    private onDisconnect(reason: string) {
        console.log('Socket disconnected:', reason);
        Object.keys(this.offlineListeners).forEach(docId => {
            this.offlineListeners[docId](reason);
        });
    }

    private onReconnect() {
        console.log('Socket reconnected');

        Object.keys(this.reconnectListeners).forEach(docId => {
            this.reconnectListeners[docId]();
        });
    }

    override dispose() {
        this.closeSocket();
    }
}
function uuid8() {
    return 'xxxxxxxx'.replace(/x/g, () => {
        const r = (Math.random() * 16) | 0;
        return r.toString(16);
    });
}
