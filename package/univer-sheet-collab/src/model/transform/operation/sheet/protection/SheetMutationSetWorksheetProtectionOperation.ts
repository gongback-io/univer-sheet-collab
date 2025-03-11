import {CommandTransformer} from "../../CommandTransformer";
import {ISetWorksheetProtectionParams} from "@univerjs/sheets";
import {CommandTransformable} from "../../CommandTransformable";

export class SheetMutationSetWorksheetProtectionTransformer extends CommandTransformer<ISetWorksheetProtectionParams> {
    public static override id = 'sheet.mutation.set-worksheet-protection';
}
export class SheetMutationSetWorksheetProtectionTransformable extends CommandTransformable<ISetWorksheetProtectionParams> {
    public static override id = 'sheet.mutation.set-worksheet-protection';
}
