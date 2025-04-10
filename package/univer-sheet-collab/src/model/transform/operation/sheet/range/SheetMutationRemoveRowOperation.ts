import {CommandTransformer} from "../../CommandTransformer";
import {IRemoveRowsMutationParams} from "@univerjs/sheets";
import {ITransformable} from "../../../basic/ITransformable";
import {CommandTransformable} from "../../CommandTransformable";
import {RangePayload} from "../../../types";

export class SheetMutationRemoveRowTransformer extends CommandTransformer<IRemoveRowsMutationParams> {
    public static override id = 'sheet.mutation.remove-row';

    override transform<T extends ITransformable>(target: T): T {
        const params = this.command.params!;
        const range = params.range;
        const rowCount = range.endRow - range.startRow + 1;
        target.removeRows(params.unitId, params.subUnitId, range.startRow, rowCount);
        return target;
    }
}
export class SheetMutationRemoveRowTransformable extends CommandTransformable<IRemoveRowsMutationParams> {
    public static override id = 'sheet.mutation.remove-row';

    override getRangePayload(): RangePayload[] | undefined {
        const params = this.command.params!;
        return [
            {
                docId: params.unitId,
                sheetId: params.subUnitId,
                range: params.range
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
