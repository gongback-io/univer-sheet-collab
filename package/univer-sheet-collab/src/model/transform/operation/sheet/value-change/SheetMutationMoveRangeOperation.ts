import {CommandTransformer} from "../../CommandTransformer";
import {IMoveRangeMutationParams} from "@univerjs/sheets";
import {CommandTransformable} from "../../CommandTransformable";
import {CellPayload, RangePayload} from "../../../types";
import {ObjectMatrix} from "@univerjs/core";

export default class SheetMutationMoveRangeTransformer extends CommandTransformer<IMoveRangeMutationParams> {
    public static override id = 'sheet.mutation.move-range';
}

export class SheetMutationMoveRangeTransformable extends CommandTransformable<IMoveRangeMutationParams> {
    public static override id = 'sheet.mutation.move-range';
    override getCellPayload(): CellPayload[] | undefined {
        const params = this.command.params!;
        const {subUnitId: fromSubUnitId, value: fromValue} = params.from;
        const {subUnitId: toSubUnitId, value: toValue} = params.to;
        return [
            {docId: params.unitId, sheetId: fromSubUnitId, cells: new ObjectMatrix(fromValue)},
            {docId: params.unitId, sheetId: toSubUnitId, cells: new ObjectMatrix(toValue)}
        ]
    }

    override onCellPayloadChanged(cellMatrix: CellPayload[]) {
        if (cellMatrix.length !== 2) {
            throw new Error('Invalid cell matrix');
        }
        this.command.params!.from.value = cellMatrix[0].cells.clone();
        this.command.params!.to.value = cellMatrix[1].cells.clone();
    }

    override getRangePayload(): RangePayload[] | undefined {
        const params = this.command.params!;
        const {subUnitId: fromSubUnitId} = params.from;
        const {subUnitId: toSubUnitId} = params.to;

        return [
            {docId: params.unitId, sheetId: fromSubUnitId, range: this.command.params!.fromRange},
            {docId: params.unitId, sheetId: toSubUnitId, range: this.command.params!.toRange}
        ]
    }

    override onRangePayloadChanged(sheetRange: RangePayload[]) {
        if (sheetRange.length !== 2) {
            throw new Error('Invalid range');
        }
        this.command.params!.fromRange = sheetRange[0].range;
        this.command.params!.toRange = sheetRange[1].range;
    }
}
