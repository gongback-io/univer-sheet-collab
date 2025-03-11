import {CommandTransformer} from "../../CommandTransformer";
import {ISetRangeValuesMutationParams} from "@univerjs/sheets";
import {CommandTransformable} from "../../CommandTransformable";
import {CellPayload} from "../../../types";
import {ObjectMatrix} from "@univerjs/core";

export class SheetMutationSetRangeValuesTransformer extends CommandTransformer<ISetRangeValuesMutationParams> {
    public static override id = 'sheet.mutation.set-range-values';
}
export class SheetMutationSetRangeValuesTransformable extends CommandTransformable<ISetRangeValuesMutationParams> {
    public static override id = 'sheet.mutation.set-range-values';

    override getCellPayload(): CellPayload[] | undefined {
        const params = this.command.params!;
        const {unitId, subUnitId, cellValue} = params;
        return [
            {
                docId: unitId,
                sheetId: subUnitId,
                cells: new ObjectMatrix(cellValue)
            }
        ]
    }

    override onCellPayloadChanged(cellMatrix: CellPayload[]) {
        this.command.params!.cellValue = cellMatrix[0].cells.clone();
    }
}
