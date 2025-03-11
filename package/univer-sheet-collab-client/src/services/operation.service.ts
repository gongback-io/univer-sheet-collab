
import {
    Disposable,
    Injector,
    Inject,
    createIdentifier,
    Workbook,
    UniverInstanceType,
    ICommandService,
    IUniverInstanceService,
    IDisposable,
    IExecutionOptions, toDisposable,
} from '@univerjs/core'
import {IOperation} from "@gongback/univer-sheet-collab";
import {RichTextEditingMutation} from "@univerjs/docs";
import {CollabSocket} from "../model/socket/CollabSocket";

export type OperationListener = (docId: string, operation: Readonly<IOperation>, options?: IExecutionOptions) => void;
export interface IOperationService {
    onOperationExecuted(unitId: string, listener: OperationListener): IDisposable;
    onOperationExecutedAll(listener: OperationListener): IDisposable;
    beforeOperationExecuted(unitId: string, listener: OperationListener): IDisposable;
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const IOperationService = createIdentifier<IOperationService>('sheet.collab-operation.service');
export class OperationService extends Disposable implements IOperationService {
    private readonly _operationExecutedListeners: {[unitId: string]:OperationListener[]} = {};
    private readonly _operationExecutedAllListeners: OperationListener[] = [];
    private readonly _beforeOperationExecutedListeners: {[unitId: string]:OperationListener[]} = {};
    constructor(
        @Inject(Injector) private readonly _injector: Injector,
        @ICommandService protected readonly _commandService: ICommandService,
        @Inject(CollabSocket) private readonly _collabSocket: CollabSocket,
        @IUniverInstanceService protected readonly _univerInstanceService: IUniverInstanceService,
    ) {
        super();
        this.disposeWithMe(
            this._commandService.onCommandExecuted((command, options) => {
                const workbook = this._univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET);
                if (!workbook) {
                    return;
                }

                if (command.type === 2 && command.id !== RichTextEditingMutation.id) {
                    const collabId = this._collabSocket.collabId!
                    try {
                        const operation = {
                            collabId: collabId,
                            operationId: (command as any).operationId,
                            revision: workbook.getRev(),
                            command: JSON.parse(JSON.stringify(command)),
                        };
                        const listeners = this._operationExecutedListeners[workbook.getUnitId()];
                        if (listeners) {
                            listeners.forEach(listener => listener(workbook.getUnitId(), operation, options));
                        }
                        this._operationExecutedAllListeners.forEach(listener => listener(workbook.getUnitId(), operation, options));
                    } catch(e) {
                        console.error(e);
                    }
                }
            })
        );

        this.disposeWithMe(
            this._commandService.beforeCommandExecuted((command, options) => {
                const workbook = this._univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET);
                if (!workbook) {
                    return;
                }

                if (!(command as any).operationId) {
                    (command as any).operationId = uuidv4();
                }
                if (command.type === 2 && command.id !== RichTextEditingMutation.id) {
                    try {
                        const collabId = this._collabSocket.collabId!
                        const operation: IOperation = {
                            collabId: collabId,
                            operationId: (command as any).operationId,
                            revision: workbook.getRev(),
                            command: JSON.parse(JSON.stringify(command)),
                        }
                        const listeners = this._beforeOperationExecutedListeners[workbook.getUnitId()];
                        if (listeners) {
                            listeners.forEach(listener => listener(workbook.getUnitId(), operation));
                        }
                    } catch(e) {
                        console.error(e);
                    }
                }

            })
        );
    }
    onOperationExecuted(unitId: string, listener: OperationListener): IDisposable {
        const listeners = this._operationExecutedListeners[unitId] || (this._operationExecutedListeners[unitId] = []);
        if (!listeners.includes(listener)) {
            listeners.push(listener);
        }

        return toDisposable(() => {
            const index = listeners.indexOf(listener);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        });
    }
    onOperationExecutedAll(listener: OperationListener): IDisposable {
        const listeners = this._operationExecutedAllListeners;
        if (!listeners.includes(listener)) {
            listeners.push(listener);
        }

        return toDisposable(() => {
            const index = listeners.indexOf(listener);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        })
    }
    beforeOperationExecuted(unitId: string, listener: (docId: string, operation: IOperation) => void): IDisposable {
        const listeners = this._beforeOperationExecutedListeners[unitId] || (this._beforeOperationExecutedListeners[unitId] = []);
        if (!listeners.includes(listener)) {
            listeners.push(listener);
        }

        return toDisposable(() => {
            const index = listeners.indexOf(listener);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        });
    }
}
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        // eslint-disable-next-line no-bitwise
        const r = (Math.random() * 16) | 0;
        // eslint-disable-next-line no-bitwise
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
