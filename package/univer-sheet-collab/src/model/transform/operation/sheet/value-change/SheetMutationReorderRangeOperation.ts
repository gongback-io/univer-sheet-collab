import {CommandTransformer} from "../../CommandTransformer";
import {IReorderRangeMutationParams} from "@univerjs/sheets";
import {CommandTransformable} from "../../CommandTransformable";

export class SheetMutationReorderRangeTransformer extends CommandTransformer<IReorderRangeMutationParams> {
    public static override id = 'sheet.mutation.reorder-range';
}
export class SheetMutationReorderRangeTransformable extends CommandTransformable<IReorderRangeMutationParams> {
    public static override id = 'sheet.mutation.reorder-range';
}
