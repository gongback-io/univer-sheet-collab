
import {
    ICommandService,
    IUniverInstanceService,
    Disposable,
    UniverInstanceType,
    Workbook,
    Injector,
    Inject,
    LocaleService
} from '@univerjs/core'
import {IConfirmService, IUIPartsService} from '@univerjs/ui';
import {
    DocId,
    IOperation,
    IOperationModel,
    OpBroadcastResponse,
    OpResponse,
    RevisionId,
    transformModelFactory
} from "@gongback/univer-sheet-collab";
import {CollabSocket} from "./socket/CollabSocket";
import SortingOperationQueue from "../model/queue/SortingOperationQueue";
import {IBlockMutationService} from "../services/block.mutation.service";
import {IOperationService} from "../services/operation.service";
import {RevertOperationManager} from "./revert-operation-manager";
import {BehaviorSubject, distinctUntilChanged, Observable} from "rxjs";

type Status = 'SYNCED' | 'SYNCING' | 'PENDING' | 'FETCH_MISS' | 'OFFLINE' | 'RECONNECTING';
export class SheetOperationHandler extends Disposable {
    private readonly docId: DocId;
    private readonly workbook: Workbook
    private readonly collabId: string;

    private readonly revertOperationManager: RevertOperationManager;
    private status: Status = 'SYNCED';
    private pendingRequests: IOperation[] = [];
    private waitingRequests: IOperation[] = [];
    private waitingExecutes: SortingOperationQueue<IOperationModel> = new SortingOperationQueue();

    private _rev$:BehaviorSubject<number>;
    rev$: Observable<number>;
    constructor(
        docId: DocId,
        @Inject(CollabSocket) private readonly collabSocket: CollabSocket,
        @Inject(Injector) private readonly _injector: Injector,
        @IOperationService protected readonly _operationService: IOperationService,
        @IUniverInstanceService protected readonly _univerInstanceService: IUniverInstanceService,
        @ICommandService protected readonly _commandService: ICommandService,
        @IUIPartsService protected readonly _uiPartsService: IUIPartsService,
        @IConfirmService protected readonly _confirmService: IConfirmService,
        @Inject(LocaleService) private readonly _localeService: LocaleService,
        @IBlockMutationService protected readonly _blockMutationService: IBlockMutationService,
    ) {
        super();
        this.docId = docId;
        this.collabId = collabSocket.collabId!;
        this.collabSocket = collabSocket;
        this.workbook = this._univerInstanceService.getUnit<Workbook>(this.docId, UniverInstanceType.UNIVER_SHEET)!;
        this._rev$ = new BehaviorSubject<number>(this.workbook.getRev());
        this.rev$ = this._rev$.pipe(distinctUntilChanged());

        this.revertOperationManager = this._injector.createInstance(RevertOperationManager, docId);

        this.onOffline = this.onOffline.bind(this);
        this.onReconnect = this.onReconnect.bind(this);
        this.onBroadcast = this.onBroadcast.bind(this);
        this.onOpResult = this.onOpResult.bind(this);
        this.setStatus = this.setStatus.bind(this);
        this.fetch = this.fetch.bind(this);
        this.sendOperation = this.sendOperation.bind(this);
        this.reloadWorkbook = this.reloadWorkbook.bind(this);
        this.processFetchMiss = this.processFetchMiss.bind(this);
        this.dispose = this.dispose.bind(this);

        this.collabSocket.setOnOfflineListener(this.docId, this.onOffline);
        this.collabSocket.setOnReconnectListener(this.docId, this.onReconnect);
        this.collabSocket.setOnBroadcastListener(this.docId, this.onBroadcast);

        this.disposeWithMe(
            this._operationService.onOperationExecuted(this.docId, (docId, operation, options) => {
                try {
                    if (options?.fromCollab || options?.onlyLocal) {
                        return;
                    }
                    console.log('[SheetOperationHandler] onOperationExecuted', operation.command.id);

                    if (this.status !== "SYNCED" && this.status !== "PENDING") {
                        console.log('push waitingRequests', operation);
                        this.waitingRequests.push(operation);
                    } else {
                        this.sendOperation(operation);
                    }
                } catch(e) {
                    console.error(e);
                }
            })
        )
    }

    onOpResult(callback?: () => void) {
        return (response: OpResponse)=> {
            let nextStatus: Status | undefined;
            try {
                this.pendingRequests = this.pendingRequests.filter(operation => operation.operationId !== response.operationId);
                if (this.pendingRequests.length === 0) {
                    nextStatus = 'SYNCED';
                }

                if (!response.success) {
                    if (response.message?.startsWith('TooOldRevisionException')) {
                        this.reloadWorkbook();
                        return;
                    }
                    console.error(response.message);
                    this.revertOperationManager.revert(response.operationId);
                    return;
                }
                const {operation, isTransformed} = response!.data!

                const rev = this.workbook.getRev();
                if (rev >= operation.revision) {
                    //already accepted
                    return;
                }
                if (this.status === 'RECONNECTING') {
                    return;
                }
                if (rev + 1 === operation.revision) {
                    if (this.status !== "SYNCED" && this.status !== "PENDING") {
                        this.waitingExecutes.push(transformModelFactory.createOperationModel(operation, {isTransformed}));
                        return;
                    }
                    this.executeOpResultCommand(operation, isTransformed);
                } else {
                    console.log("FETCH_MISS", rev, operation.revision);
                    this.setStatus('FETCH_MISS');
                    return;
                }
            } catch(e) {
                console.error(e);
            } finally {
                if (nextStatus) {
                    this.setStatus(nextStatus);
                }
                callback?.();
            }
        }
    }

    onBroadcast(response: OpBroadcastResponse) {
        if (response.docId !== this.docId) {
            return;
        }
        try {
            const rev = this.workbook.getRev();
            if (rev >= response.operation.revision) {
                //already accepted
                return;
            }
            if (response.operation.collabId === this.collabId) {
                return;
            }
            if (this.status === 'RECONNECTING') {
                return;
            }
            if (rev + 1 === response.operation.revision) {
                if (this.status !== "SYNCED" && this.status !== "PENDING") {
                    this.waitingExecutes.push(transformModelFactory.createOperationModel(response.operation));
                    return;
                }
                this.execCollabCommand(response.operation);
            } else {
                console.log("FETCH_MISS", rev, response.operation.revision);
                this.setStatus('FETCH_MISS');
                return;
            }
        } catch(e) {
            console.error(e);
        }
    }

    setStatus(status: Status) {
        if (this.status === status) {
            return;
        }
        if (this.status === "RECONNECTING") {
            if (status === 'OFFLINE') {
                this.reloadWorkbook();
                return;
            } else if (status !== 'FETCH_MISS') {
                return;
            }
        }
        this.status = status;
        console.log("=============status changed==============", status);

        switch (status) {
            case "SYNCED":
                break;
            case "SYNCING":
                const rev = this.workbook.getRev();
                console.log("syncing", rev);

                let waitingExecute:IOperationModel | undefined = this.waitingExecutes.shift();
                while(waitingExecute) {
                    const rev = this.workbook.getRev();
                    if (rev >= waitingExecute.revision) {
                        waitingExecute = this.waitingExecutes.shift();
                        continue;
                    }
                    if (rev + 1 !== waitingExecute.revision) {
                        throw new Error(`${this.docId}: REVISION MISMATCH`);
                    }
                    if (waitingExecute.collabId === this.collabId) {
                        this.executeOpResultOperation(waitingExecute);
                    } else {
                        let transformed = waitingExecute;
                        this.waitingExecutes.forEach((operation) => {
                            transformed = operation.transform(transformed);
                        })
                        this.execCollabOperation(transformed);
                    }
                    waitingExecute = this.waitingExecutes.shift();
                }
                console.log("finish SYNCING");

                this.setStatus("SYNCED");
                break;
            case "PENDING":
                break;
            case "OFFLINE":
                break;
            case "FETCH_MISS":
                this._blockMutationService.block();
                this.processFetchMiss().then(() => {
                    this.setStatus('SYNCING');
                }).catch(e => {
                    console.error(e);
                }).finally(() => {
                    this._blockMutationService.close();
                })
                break;
            case "RECONNECTING":
                this._blockMutationService.block();
                this.collabSocket.joinSheet(this.docId).then((data) => {
                    const promises: Promise<void>[] = [];

                    const pendingRequests = this.pendingRequests;
                    this.pendingRequests = [];
                    pendingRequests.forEach((operation) => {
                        promises.push(this.sendOperationAwait(operation));
                    })

                    //send waitingRequests
                    let waitingRequest = this.waitingRequests.shift()
                    while(waitingRequest) {
                        promises.push(this.sendOperationAwait(waitingRequest));
                        waitingRequest = this.waitingRequests.shift();
                    }
                    Promise.all(promises).then(() => {
                        console.log("All pending requests are sent");
                        this.setStatus("FETCH_MISS")
                    }).catch(e => {
                        console.error(e);
                    })
                }).catch(e =>{
                    console.error(e);
                }).finally(() => {
                    this._blockMutationService.close();
                })
                break;
        }
    }

    onOffline(reason: string) {
        console.log('onOffline', reason);
        this.setStatus('OFFLINE');
    }

    onReconnect() {
        this.setStatus('RECONNECTING');
    }

    async processFetchMiss(retry?: number) {
        try {
            const fetched = await this.fetch(this.workbook.getRev());
            this.waitingExecutes.clear();
            fetched.forEach(op => {
                this.waitingExecutes.push(transformModelFactory.createOperationModel(op));
            });
        } catch(e: any) {
            if (e && e.message.startsWith('TooOldRevisionException')) {
                this.reloadWorkbook();
            } else if (e && e.message === 'NEED_RELOAD') {
                this.reloadWorkbook();
            }
            if (retry && retry > 3) {
                throw e;
            }
            await this.processFetchMiss((retry || 0) + 1);
        }
    }

    private async fetch(revision: RevisionId): Promise<IOperation[]> {
        const response = await this.collabSocket.fetch(this.docId, revision)
        if (!response.success) {
            throw new Error(response.message);
        }
        return response.data!.operations;
    }

    private reloadWorkbook() {
        //WARING
        // All unsent user operations will be discarded.
        this._confirmService.confirm({
            id: 'collab.confirm.apply-revision',
            children: { title: this._localeService.t('collab.error.needReload') },
            confirmText: this._localeService.t('button.confirm'),
        }).then((confirm) => {
            window.location.reload();
        });
    }

    private sendOperation(operation: IOperation, callback?: () => void) {
        const workbook = this._univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET);
        if (!workbook || workbook.getUnitId() !== this.docId) {
            throw new Error('A send operation occurred in an inactive workbook.');
        }

        const request = {
            docId: this.docId,
            operation
        }

        this.setStatus("PENDING");
        this.pendingRequests.push(operation);
        this.collabSocket?.sendOperation(request, this.onOpResult(callback));
    }

    private async sendOperationAwait(operation: IOperation): Promise<void> {
        return new Promise(resolve => {
            this.sendOperation(operation, resolve);
        })
    }

    private executeOpResultCommand(transformed: IOperation, isTransformed: boolean) {
        const operation = transformModelFactory.createOperationModel(transformed, {isTransformed});
        this.executeOpResultOperation(operation);
    }

    private executeOpResultOperation(transformed: IOperationModel) {
        this.revertOperationManager.commit(transformed);
        this.workbook.setRev(transformed.revision);
        this._rev$.next(transformed.revision);
    }

    private execCollabCommand(operation: IOperation) {
        const operationModel = transformModelFactory.createOperationModel(operation);
        this.execCollabOperation(operationModel);
    }

    private execCollabOperation(operation: IOperationModel) {
        const command = operation.command;
        this._commandService.syncExecuteCommand(command.id, command.params, {fromCollab: true})
        this.workbook.setRev(operation.revision);
        this._rev$.next(operation.revision);
    }

    override dispose() {
        super.dispose();
        this.collabSocket?.leaveSheet(this.docId);
        this.collabSocket?.removeOnBroadcastListener(this.docId);
        this.collabSocket?.removeOnOfflineListener(this.docId);
        this.revertOperationManager.dispose();
    }
}


