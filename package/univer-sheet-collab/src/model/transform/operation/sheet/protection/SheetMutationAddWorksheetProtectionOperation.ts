import {CommandTransformer} from "../../CommandTransformer";
import {IAddWorksheetProtectionParams} from "@univerjs/sheets";
import {CommandTransformable} from "../../CommandTransformable";

export class SheetMutationAddWorksheetProtectionTransformer extends CommandTransformer<IAddWorksheetProtectionParams> {
    public static override id = 'sheet.mutation.add-worksheet-protection';
}
export class SheetMutationAddWorksheetProtectionTransformable extends CommandTransformable<IAddWorksheetProtectionParams> {
    public static override id = 'sheet.mutation.add-worksheet-protection';
}
