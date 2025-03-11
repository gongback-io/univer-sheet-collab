import {CommandTransformer} from "../../CommandTransformer";
import {IAddRangeProtectionMutationParams} from "@univerjs/sheets";
import {CommandTransformable} from "../../CommandTransformable";

export class SheetMutationAddRangeProtectionTransformer extends CommandTransformer<IAddRangeProtectionMutationParams> {
    public static override id = 'sheet.mutation.add-range-protection';
}
export class SheetMutationAddRangeProtectionTransformable extends CommandTransformable<IAddRangeProtectionMutationParams> {
    public static override id = 'sheet.mutation.add-range-protection';
}
