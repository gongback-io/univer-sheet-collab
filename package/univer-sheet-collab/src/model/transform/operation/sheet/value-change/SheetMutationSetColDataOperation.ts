import {CommandTransformer} from "../../CommandTransformer";
import {ISetColDataMutationParams} from "@univerjs/sheets";
import {CommandTransformable} from "../../CommandTransformable";

export class SheetMutationSetColDataTransformer extends CommandTransformer<ISetColDataMutationParams> {
    public static override id = 'sheet.mutation.set-col-data';
}

export class SheetMutationSetColDataTransformable extends CommandTransformable<ISetColDataMutationParams> {
    public static override id = 'sheet.mutation.set-col-data';
}
