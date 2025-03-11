import {CommandTransformer} from "../../CommandTransformer";
import {ISetRowDataMutationParams} from "@univerjs/sheets";
import {CommandTransformable} from "../../CommandTransformable";

export class SheetMutationSetRowDataTransformer extends CommandTransformer<ISetRowDataMutationParams> {
    public static override id = 'sheet.mutation.set-row-data';
}

export class SheetMutationSetRowDataTransformable extends CommandTransformable<ISetRowDataMutationParams> {
    public static override id = 'sheet.mutation.set-row-data';
}
