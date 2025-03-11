import {CommandTransformer} from "../../CommandTransformer";
import {IRemoveColMutationParams} from "@univerjs/sheets";
import {ITransformable} from "../../../basic/ITransformable";
import {CommandTransformable} from "../../CommandTransformable";
import {RangePayload} from "../../../types";

export class SheetMutationRemoveColTransformer extends CommandTransformer<IRemoveColMutationParams> {
    public static override id = 'sheet.mutation.remove-col';

    override transform<T extends ITransformable>(target: T): T {
        const params = this.command.params!;
        const range = params.range;
        const colCount = range.endColumn - range.startColumn + 1;
        target.removeColumns(params.unitId, params.subUnitId, range.startColumn, colCount);
        return target;
    }
}

export class SheetMutationRemoveColTransformable extends CommandTransformable<IRemoveColMutationParams> {
    public static override id = 'sheet.mutation.remove-col';
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
