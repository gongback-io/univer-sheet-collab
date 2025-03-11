import {ITransformableOperation} from "@gongback/univer-sheet-collab";

export function isSheetChangeOp(operationModel: ITransformableOperation) {
    return (
        operationModel.cellPayload?.find(a => a.cells.getSizeOf() > 0) ||
        operationModel.rangePayload
    )
}
