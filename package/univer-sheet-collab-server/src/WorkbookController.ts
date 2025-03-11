import {
    deepReplaceUndefined,
    deepRestoreUndefined,
    decompress,
    DocId,
    FetchRequest,
    FetchResponse, IOperation, ITransformableOperation,
    OpBroadcastResponse,
    OpRequest,
    OpResponse, RevisionId
} from "@gongback/univer-sheet-collab";
import {IOpStorage, ISocket, IWorkbookDelegate, IWorkbookStorage} from "./types";
import {OperationHandler} from "./OperationHandler";
import {IOperationQueue} from "./data/IOperationQueue";
import {IWorkbookData} from "@univerjs/core";
import {DefaultOperationQueue} from "./data/DefaultOperationQueue";

type SheetOptions = {
    opEventName: string,
    opEmitEventName: string,
    fetchEventName: string,
    workbookStorage: IWorkbookStorage
    workbookDelegate: IWorkbookDelegate
    opStorage: IOpStorage
    initialSheetData?: Partial<IWorkbookData>
}
export default class WorkbookController {
    private readonly docId: DocId;

    private readonly opEmitEventName: string;
    private readonly fetchEventName
    private readonly opEventName: string;

    private readonly opStorage: IOpStorage;
    private readonly workbookStorage: IWorkbookStorage
    private readonly workbookDelegate: IWorkbookDelegate

    private readonly initialSheetData?: Partial<IWorkbookData>;
    private operationQueue?: IOperationQueue;
    private operationHandler?: OperationHandler

    private snapshot: IWorkbookData | undefined;
    private participants: {
        socket: ISocket;
        participantId: string;
        wrappedOpCallback: (request: OpRequest, callback: (response: OpResponse) => {}) => void
        wrappedFetchCallback: (request: FetchRequest, callback: (response: FetchResponse) => {}) => void
    }[] = [];

    constructor(docId: string, options: SheetOptions) {
        this.docId = docId;
        this.opEventName = options.opEventName;
        this.opEmitEventName = options.opEmitEventName;
        this.fetchEventName = options.fetchEventName;
        this.workbookDelegate = options.workbookDelegate;
        this.workbookStorage = options.workbookStorage;
        this.opStorage = options.opStorage;
        this.initialSheetData = options.initialSheetData;

        this.appendParticipant = this.appendParticipant.bind(this);
        this.removeParticipant = this.removeParticipant.bind(this);
        this.onReceiveOperation = this.onReceiveOperation.bind(this);
        this.onFetch = this.onFetch.bind(this);
    }

    public async init() {
        const workbookData = await this.workbookStorage.select(this.docId);
        if (workbookData) {
            this.snapshot = workbookData;
            await this.workbookDelegate.createSheet(workbookData);

            const currentRevision = await this.opStorage.selectMaxRevision(this.docId);
            if (workbookData.rev === undefined || currentRevision < workbookData.rev) {
                throw new Error(`revision not matched ${workbookData.rev}, ${currentRevision}`);
            }

            this.operationQueue = new DefaultOperationQueue(this.docId, this.opStorage, currentRevision);
            this.operationHandler = new OperationHandler(this.docId, {
                operationQueue: this.operationQueue,
                workbookDelegate: this.workbookDelegate,
                workbookStorage: this.workbookStorage
            });
        } else {
            if (this.initialSheetData?.id) {
                console.log('ignore initialSheetData.id');
            }
            await this.workbookDelegate.createSheet({
                rev: 1,
                ...this.initialSheetData,
                id: this.docId,
            });
            this.operationQueue = new DefaultOperationQueue(this.docId, this.opStorage, 1);
            this.operationHandler = new OperationHandler(this.docId, {
                operationQueue: this.operationQueue,
                workbookDelegate: this.workbookDelegate,
                workbookStorage: this.workbookStorage
            });
        }
    }

    public appendParticipant(socket: ISocket): void {
        const wrappedOpCallback = (request: OpRequest, callback: (response: OpResponse) => {}) => {
            this.onReceiveOperation(request, socket).then(result => {
                callback(result);
            })
        };
        const wrappedFetchCallback = (request: FetchRequest, callback: (response: FetchResponse) => {}) => {
            this.onFetch(request, callback);
        }

        socket.off(`${this.opEventName}:${this.docId}`, wrappedOpCallback);
        socket.on(`${this.opEventName}:${this.docId}`, wrappedOpCallback);
        socket.off(`${this.fetchEventName}:${this.docId}`, wrappedFetchCallback);
        socket.on(`${this.fetchEventName}:${this.docId}`, wrappedFetchCallback);
        socket.join(`sheet-${this.docId}`);

        const participantId = (socket as any).collabId;
        if (!this.participants.find((p) => p.participantId === participantId)) {
            this.participants.push({
                socket,
                participantId,
                wrappedOpCallback,
                wrappedFetchCallback
            });
        } else {
            // console.log('participant already exists', participantId, this.participants);
        }
        // console.log('appendParticipant', participantId, this.participants.map((p) => p.participantId));
    }

    public removeParticipant(participantId: string): number {
        const participant = this.participants.find((p) => p.participantId === participantId);
        if (participant) {
            participant.socket.leave(`sheet-${this.docId}`);
            participant.socket.off(`${this.opEventName}:${this.docId}`, participant.wrappedOpCallback);
            participant.socket.off(`${this.fetchEventName}:${this.docId}`, participant.wrappedFetchCallback);
        }
        this.participants = this.participants.filter((p) => p.participantId !== participantId);
        return this.participants.length;
    }

    private async onReceiveOperation(request: OpRequest, socket: ISocket): Promise<OpResponse> {
        const receivedOperation = {...request.operation};
        const operationId = receivedOperation.operationId
        try {
            const collabId = (socket as any).collabId;
            receivedOperation.command.params = decompress(request.operation.command.params);
            receivedOperation.command.params = deepRestoreUndefined(receivedOperation.command.params, "$UNDEFINED$");

            //FIXME
            if (JSON.stringify(receivedOperation.command.params).includes("$UNDEFINED$")) {
                throw new Error('Invalid operation');
            }

            const result = await this.operationHandler!.handleOperation(collabId, request.docId, receivedOperation)
            this.snapshot = result.snapshot;

            const isTransformed = result.transformed.isTransformed

            const transformedOperation: IOperation = result.transformed;
            transformedOperation.command.params = deepReplaceUndefined(transformedOperation.command.params, "$UNDEFINED$");

            socket.to(`sheet-${this.docId}`).emit(`${this.opEmitEventName}:${this.docId}`, {
                docId: this.docId,
                operation: transformedOperation,
            } as OpBroadcastResponse);

            return {success: true, operationId, data: {docId: result.docId, operation: transformedOperation, isTransformed}};
        } catch (e: any) {
            console.error(e);
            const message = `${e.name || 'Internal Server Error'}: ${e.message || 'Unknown Error'}`;
            return {success: false, message, operationId};
        }
    }

    private onFetch(request: FetchRequest, callback: (response: FetchResponse) => {}): void {
        this.operationHandler!.handleFetch(request.docId, request.revision).then((result) => {
            result.forEach(op => op.command.params = deepReplaceUndefined(op.command.params, "$UNDEFINED$"));
            callback?.({success: true, data: {docId: request.docId, operations: result}});
        }).catch((e) => {
            callback?.({success: false, message: e?.message || 'Internal Server Error'});
        });
    }

    public async getSnapshot(): Promise<IWorkbookData> {
        return this.snapshot = this.snapshot || await this.workbookDelegate.getSnapshot();
    }

    public async getOperationAfter(revision: RevisionId): Promise<IOperation[]> {
        const operationModels = await this.operationQueue!.getAfter(revision);
        return operationModels.map((item) => item!);
    }

    public async dispose() {
        await this.workbookDelegate.dispose();
        this.participants.forEach((participant) =>
            this.removeParticipant(participant.participantId)
        );
    }
}
