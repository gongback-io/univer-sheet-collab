import {
    Disposable,
    ICommandService,
    Inject,
    Injector, IUniverInstanceService,
    Workbook
} from "@univerjs/core";
import {
    getOldCells,
    IOperation,
    IOperationModel,
    OperationId,
    transformModelFactory
} from "@gongback/univer-sheet-collab";
import RevertOperation from "./operation/RevertOperation";
import {ISetRangeValuesMutationParams, SetRangeValuesMutation} from "@univerjs/sheets";
import {IOperationService} from "../services/operation.service";

export interface IRevertOperationManager {
    revert(operationId: string): void;
    commit(operation: IOperationModel): void;
}

export class RevertOperationManager extends Disposable implements IRevertOperationManager {
    private docId: string;
    private revertOperationMap: {[key: OperationId]: RevertOperation} = {};

    constructor(
        docId: string,
        @Inject(Injector) private readonly _injector: Injector,
        @IOperationService protected _operationService: IOperationService,
        @IUniverInstanceService protected readonly _univerInstanceService: IUniverInstanceService,
        @ICommandService private readonly _commandService: ICommandService,
    ) {
        super();

        this.docId = docId;
        this.add = this.add.bind(this);
        this.delete = this.delete.bind(this);
        this.revert = this.revert.bind(this);
        this.transformFrom = this.transformFrom.bind(this);

        this.disposeWithMe(
            this._operationService.onOperationExecuted(this.docId, (docId, operation, options) => {
                try {
                    const operationModel = transformModelFactory.createOperationModel(operation);
                    this.transformFrom(operationModel);
                } catch(e) {
                    console.error(e);
                    if (operation.operationId) {
                        this.revert(operation.operationId);
                    }
                }
            })
        )
        this.disposeWithMe(
            this._operationService.beforeOperationExecuted(this.docId, (docId, operation, options) => {
                if (options?.fromCollab || options?.onlyLocal) {
                    return;
                }
                this.add(operation);
            })
        )

    }

    add(operation: IOperation) {
        const workbook = this._univerInstanceService.getUnit<Workbook>(this.docId);
        if (!workbook) {
            return;
        }

        const operationModel = transformModelFactory.createOperationModel(operation);
        if (operationModel.cellPayload) {
            const oldCells = getOldCells(workbook, operationModel.cellPayload);
            this.revertOperationMap[operation.operationId] = new RevertOperation(oldCells);
        }
    }
    delete(unitId: string, operationId: OperationId) {
        delete this.revertOperationMap[operationId];
    }
    revert(operationId: string) {
        const revertOperation = this._getRevertOperation(operationId);
        if (revertOperation) {
            revertOperation.cellPayload?.forEach(({docId, sheetId, cells}) => {
                const params:ISetRangeValuesMutationParams = {
                    unitId: docId,
                    subUnitId: sheetId,
                    cellValue: cells.getMatrix()
                }
                this._commandService.syncExecuteCommand(SetRangeValuesMutation.id, params, {onlyLocal: true});
            });
            delete this.revertOperationMap[operationId];
        }
    }
    transformFrom(operation: IOperationModel<object>) {
        Object.keys(this.revertOperationMap).forEach(operationId => {
            if (operation.operationId !== operationId) {
                this.revertOperationMap[operationId] = operation.transform(this.revertOperationMap[operationId]);
            }
        });
    }
    commit(operation: IOperationModel) {
        if (operation.isTransformed) {
            this.revert(operation.operationId);
            operation.cellPayload?.forEach(({sheetId, cells}) => {
                const params:ISetRangeValuesMutationParams = {
                    subUnitId: sheetId,
                    unitId: this.docId,
                    cellValue: cells.getMatrix()
                }
                this._commandService.syncExecuteCommand(SetRangeValuesMutation.id, params, {onlyLocal: true});
            });

        }
    }
    private _getRevertOperation(operationId: OperationId) {
        return this.revertOperationMap[operationId];
    }
}
