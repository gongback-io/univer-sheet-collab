
import {IAddWorksheetMergeMutationParams} from "@univerjs/sheets";
import {CommandTransformer} from "../../CommandTransformer";
import {CommandTransformable} from "../../CommandTransformable";

export class SheetMutationAddWorksheetMergeTransformer extends CommandTransformer<IAddWorksheetMergeMutationParams> {
    public static override id = 'sheet.mutation.add-worksheet-merge';

}
export class SheetMutationAddWorksheetMergeTransformable extends CommandTransformable<IAddWorksheetMergeMutationParams>{
    public static override id = 'sheet.mutation.add-worksheet-merge';
}
