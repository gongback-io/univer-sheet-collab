import {CommandTransformer} from "../../CommandTransformer";
import {ISetRangeProtectionMutationParams} from "@univerjs/sheets";
import {CommandTransformable} from "../../CommandTransformable";

export class SheetMutationSetRangeProtectionTransformer extends CommandTransformer<ISetRangeProtectionMutationParams> {
    public static override id = 'sheet.mutation.set-range-protection';
}
export class SheetMutationSetRangeProtectionTransformable extends CommandTransformable<ISetRangeProtectionMutationParams> {
    public static override id = 'sheet.mutation.set-range-protection';
}
