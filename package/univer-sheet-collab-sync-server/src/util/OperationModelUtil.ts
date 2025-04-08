import {IOperationModel} from "@gongback/univer-sheet-collab";

export function isSheetChangeOp(operationModel: IOperationModel): boolean {
    if (operationModel.id.includes("protection")) {
        return true;
    }
    return !!(
        operationModel.cellPayload?.find(a => a.cells.getSizeOf() > 0) ||
        operationModel.rangePayload
    );
}
