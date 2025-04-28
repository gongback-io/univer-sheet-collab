import {IOperation, IOperationModel} from "@gongback/univer-sheet-collab";
import {COMMAND_LISTENER_SKELETON_CHANGE, COMMAND_LISTENER_VALUE_CHANGE} from "@univerjs/sheets";

export function isSheetChangeOp(operation: IOperation): boolean {
    if (operation.command.id.includes("protection")) {
        return true;
    }
    if (operation.command.type !== 2) {
        return false;
    }
    return COMMAND_LISTENER_VALUE_CHANGE.indexOf(operation.command.id) > -1 ||
        COMMAND_LISTENER_SKELETON_CHANGE.indexOf(operation.command.id) > -1
}

export function isPublishableOp(operation: IOperation): boolean {
    return operation.command.id !== 'collab.mutation.apply-revision'
}
