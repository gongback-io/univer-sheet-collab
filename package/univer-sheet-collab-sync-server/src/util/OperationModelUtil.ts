import {IOperationModel} from "@gongback/univer-sheet-collab";
import { COMMAND_LISTENER_VALUE_CHANGE } from "@univerjs/sheets";

export function isSheetChangeOp(operationModel: IOperationModel): boolean {
    if (operationModel.id.includes("protection")) {
        return true;
    }
    return COMMAND_LISTENER_VALUE_CHANGE.indexOf(operationModel.id) > -1
    // return !!(
    //     operationModel.cellPayload?.find(a => a.cells.getSizeOf() > 0) ||
    //     operationModel.rangePayload
    // );
}
