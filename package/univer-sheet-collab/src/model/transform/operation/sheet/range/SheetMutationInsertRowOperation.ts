import {ITransformable} from "../../../basic/ITransformable";
import {CommandTransformer} from "../../CommandTransformer";
import {IInsertRowMutationParams} from "@univerjs/sheets";
import {CommandTransformable} from "../../CommandTransformable";
import {RangePayload} from "../../../types";

export class SheetMutationInsertRowTransformer extends CommandTransformer<IInsertRowMutationParams> {
    public static override id = 'sheet.mutation.insert-row';

    override transform<T extends ITransformable>(target: T): T {
        const params = this.command.params!;
        const { unitId, subUnitId, range, rowInfo } = params;
        const rowCount = range.endRow - range.startRow + 1;
        target.insertRows(unitId, subUnitId, range.startRow, rowCount);
        return target;
    }
}
export class SheetMutationInsertRowTransformable extends CommandTransformable<IInsertRowMutationParams>{
    public static override id = 'sheet.mutation.insert-row';
    override getRangePayload():RangePayload[] | undefined {
        return [
            {
                docId: this.command.params!.unitId,
                sheetId: this.command.params!.subUnitId,
                range: this.command.params!.range
            }
        ]
    }

    override onRangePayloadChanged(sheetRange: RangePayload[]) {
        if (sheetRange.length !== 1) {
            throw new Error('Invalid range');
        }
        this.command.params!.range = sheetRange[0].range;
    }
}
