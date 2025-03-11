import {
    DocId,
    JoinRequest,
    JoinResponse,
    LeaveRequest,
    ParticipantId
} from "@gongback/univer-sheet-collab";
import {IOpStorage, IWorkbookStorage, IServer, ISocket, IWorkbookDelegate} from "./types";
import WorkbookController from "./WorkbookController";
import {IWorkbookData} from "@univerjs/core";

export type GongbackCollabServerOptions = {
    workbookStorage: IWorkbookStorage;
    opStorage: IOpStorage;
    workbookFactory: (docId: string) => IWorkbookDelegate;
    initialSheetData?: Partial<IWorkbookData>;

    opEmitEventName?: string;
    fetchEventName?: string;
    opEventName?: string;
    joinEventName?: string;
    leaveEventName?: string;
}
export class GongbackCollabServer {
    private readonly server: IServer

    private readonly opEventName: string;
    private readonly fetchEventName: string;
    private readonly opEmitEventName: string;
    private readonly joinEventName: string;
    private readonly leaveEventName: string;

    private readonly opStorage: IOpStorage;
    private readonly workbookStorage: IWorkbookStorage;
    private readonly initialSheetData?: Partial<IWorkbookData>;
    private readonly workbookDelegateFactory: (docId: string) => IWorkbookDelegate;

    private joinedDocs: {[key: ParticipantId]: DocId[]} = {};
    private workbookControllerStorage: {[key: string]: WorkbookController} = {};

    constructor(server: IServer, options: GongbackCollabServerOptions) {
        this.server = server;

        this.workbookStorage = options.workbookStorage
        this.initialSheetData = options.initialSheetData;
        this.workbookDelegateFactory = options.workbookFactory;
        this.opStorage = options.opStorage;
        this.opEmitEventName = options?.opEmitEventName || 'sheet-collab-operation';
        this.opEventName = options?.opEventName || 'sheet-collab-operation';
        this.fetchEventName = options?.fetchEventName || 'sheet-collab-fetch';
        this.joinEventName = options?.joinEventName || 'sheet-collab-join';
        this.leaveEventName = options?.leaveEventName || 'sheet-collab-leave';

        this.onJoinSheet = this.onJoinSheet.bind(this);
        this.onLeaveSheet = this.onLeaveSheet.bind(this);
        this.appendParticipant = this.appendParticipant.bind(this);
        this.removeParticipant = this.removeParticipant.bind(this);
        this.leaveSheet = this.leaveSheet.bind(this);
        this.disposeSheet = this.disposeSheet.bind(this);
    }

    public listen() {
        this.server.on('connection', this.onConnect.bind(this));
    }

    private onConnect = (socket: ISocket) => {
        const _onJoinSheet = (request: JoinRequest, callback: (response: JoinResponse) => void) => {
            return this.onJoinSheet(socket, request, callback);
        }
        const _onLeaveSheet = (request: LeaveRequest) => {
            return this.onLeaveSheet(socket, request);
        }
        socket.on(this.joinEventName, _onJoinSheet);
        socket.on(this.leaveEventName, _onLeaveSheet);

        socket.on('disconnect', (e: any) => {
            const collabId = (socket as any).collabId;
            this.removeParticipant(collabId);

            socket.off(this.joinEventName, _onJoinSheet);
            socket.off(this.leaveEventName, _onLeaveSheet);
        });
    };

    private getWorkbookController(docId: string): WorkbookController | undefined {
        return this.workbookControllerStorage[docId];
    }

    private async onJoinSheet(socket: ISocket, request: JoinRequest, callback: (response: JoinResponse) => void) {
        try {
            const collabId = request.collabId;
            (socket as any).collabId = collabId;
            console.log(`${collabId} join sheet`, request);
            const docId = request.docId;

            const controller = await this.getOrCreateController(docId);
            this.appendParticipant(docId, controller, socket);

            const workbook = await controller.getSnapshot();
            if (!workbook.rev) {
                throw new Error('Failed to load sheet')
            }
            const operations = await controller.getOperationAfter(workbook.rev+1);
            callback?.({
                success: true,
                data: {
                    docId,
                    workbookData: workbook,
                    operations
                },
            });
        } catch (e) {
            console.error(e);
            callback?.({ success: false, message: 'Failed to load sheet' });
        }
    };

    private onLeaveSheet (socket: ISocket, request: LeaveRequest)  {
        const collabId = (socket as any).collabId;
        const docId = request.docId;
        this.leaveSheet(collabId, docId).then(() => {
            socket.leave(`sheet-${docId}`);
            console.log(`${collabId}: leave sheet`, request)
        })
    }

    private async leaveSheet(participantId: string, docId: string) {
        const controller = this.getWorkbookController(docId)
        if (controller?.removeParticipant(participantId) == 0) {
            await this.disposeSheet(docId);
        }
    }

    private appendParticipant(docId: string, controller: WorkbookController, socket: ISocket) {
        const participantId = (socket as any).collabId;
        this.joinedDocs[participantId] = this.joinedDocs[participantId] || [];
        this.joinedDocs[participantId].push(docId);
        controller.appendParticipant(socket);
    }

    private removeParticipant(participantId: string) {
        const docIds = this.joinedDocs[participantId];
        if (docIds) {
            docIds.forEach(docId => {
                this.leaveSheet(participantId, docId);
            });
            delete this.joinedDocs[participantId];
        }
    }

    private async disposeSheet(docId: string) {
        const controller = this.getWorkbookController(docId);
        if (controller) {
            await controller.dispose();
        }
        delete this.workbookControllerStorage[docId]
    }

    private controllerCreationPromises: { [docId: string]: Promise<WorkbookController> } = {};
    private async getOrCreateController(docId: string): Promise<WorkbookController> {
        let controller = this.getWorkbookController(docId);
        if (controller) return controller;

        if (!this.controllerCreationPromises[docId]) {
            this.controllerCreationPromises[docId] = (async () => {
                const newController = new WorkbookController(docId, {
                    opEmitEventName: this.opEmitEventName,
                    opEventName: this.opEventName,
                    fetchEventName: this.fetchEventName,
                    opStorage: this.opStorage,
                    workbookStorage: this.workbookStorage,
                    workbookDelegate: this.workbookDelegateFactory(docId),
                    initialSheetData: this.initialSheetData
                });
                await newController.init();

                //TODO
                // newController.setOnDisposeListener(() => {
                //     delete this.workbookControllerStorage[docId];
                // });

                this.workbookControllerStorage[docId] = newController;
                // 생성이 완료되면 프로미스 제거
                delete this.controllerCreationPromises[docId];
                return newController;
            })();
        }
        // 이미 생성 중인 프로미스가 있다면 기다림
        return this.controllerCreationPromises[docId];
    }

}
