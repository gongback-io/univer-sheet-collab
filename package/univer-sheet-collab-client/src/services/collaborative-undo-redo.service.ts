import {
    ICommandService,
    IContextService,
    IUndoRedoItem,
    IUniverInstanceService,
    LocalUndoRedoService,
    IMutationInfo
} from "@univerjs/core";
import {
    ICommandTransformable,
    IOperationModel,
    transformModelFactory,
} from "@gongback/univer-sheet-collab";
import {IOperationService} from "./operation.service";

interface ICollabMutationInfo<T extends Object = object> extends IMutationInfo<T> {
    transformable: ICommandTransformable;
}
interface ICollabUndoRedoItem extends IUndoRedoItem {
    undoMutations: ICollabMutationInfo[];
    redoMutations: ICollabMutationInfo[];
}
export class CollaborativeUndoRedoService extends LocalUndoRedoService {

    constructor(
        @IUniverInstanceService _univerInstanceService: IUniverInstanceService,
        @ICommandService  _commandService: ICommandService,
        @IContextService _contextService: IContextService,
        @IOperationService _operationService: IOperationService,
    ) {
        super(_univerInstanceService, _commandService, _contextService);

        this.disposeWithMe(
            _operationService.onOperationExecutedAll((docId, operation) => {
                const operationModel = transformModelFactory.createOperationModel(operation);
                this.transformFrom(docId, operationModel);
            })
        )
    }

    override pushUndoRedo(item: IUndoRedoItem): void {
        const collabItem:ICollabUndoRedoItem = {
            ...item,
            undoMutations: item.undoMutations.map(mutation => ({...mutation, transformable: transformModelFactory.createTransformable(mutation)})),
            redoMutations: item.redoMutations.map(mutation => ({...mutation, transformable: transformModelFactory.createTransformable(mutation)})),
        }
        return super.pushUndoRedo(collabItem)
    }

    transformFrom(unitID: string, operation: IOperationModel<object>): void {
        const redoStack = this._getRedoStack(unitID, true) as ICollabUndoRedoItem[];
        const undoStack = this._getUndoStack(unitID, true) as ICollabUndoRedoItem[];

        redoStack.forEach(item => {
            item.redoMutations.forEach(mutation => {
                mutation.transformable = operation.transform(mutation.transformable, {ignoreCellUpdate: true})
                mutation.params = mutation.transformable.command.params!
            })
            item.undoMutations.forEach(mutation => {
                mutation.transformable = operation.transform(mutation.transformable, {ignoreCellUpdate: true})
                mutation.params = mutation.transformable.command.params!
            })
        })
        undoStack.forEach(item => {
            item.redoMutations.forEach(mutation => {
                mutation.transformable = operation.transform(mutation.transformable, {ignoreCellUpdate: true})
                mutation.params = mutation.transformable.command.params!
            })
            item.undoMutations.forEach(mutation => {
                mutation.transformable = operation.transform(mutation.transformable, {ignoreCellUpdate: true})
                mutation.params = mutation.transformable.command.params!
            })
        })
    }
}
