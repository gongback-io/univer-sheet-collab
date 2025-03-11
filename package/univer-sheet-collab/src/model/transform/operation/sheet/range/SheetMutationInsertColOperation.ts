import {IInsertColMutationParams} from "@univerjs/sheets";
import {ITransformable} from "../../../basic/ITransformable";
import {TransformerOptions} from "../../../basic/ITransformer";
import {CommandTransformable} from "../../CommandTransformable";
import {RangePayload} from "../../../types";
import {CommandTransformer} from "../../CommandTransformer";

export class SheetMutationInsertColTransformer extends CommandTransformer<IInsertColMutationParams>{
    public static override id = 'sheet.mutation.insert-col';

    override transform<T extends ITransformable>(target: T, options: TransformerOptions | undefined): T {
        const params = this.command.params!;
        const range = params.range;
        const colCount = range.endColumn - range.startColumn + 1;
        target.insertColumns(params.unitId, params.subUnitId, range.startColumn, colCount);
        return target;
    }
}
export class SheetMutationInsertColTransformable extends CommandTransformable<IInsertColMutationParams>{
    public static override id = 'sheet.mutation.insert-col';

    override getRangePayload(): RangePayload[] | undefined {
        return [
            {
                docId: this.command.params!.subUnitId,
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
