import {CommandTransformer} from "../../CommandTransformer";
import {IMoveColumnsMutationParams} from "@univerjs/sheets";
import {CommandTransformable} from "../../CommandTransformable";

export class SheetMutationMoveColumnsTransformer extends CommandTransformer<IMoveColumnsMutationParams> {
    public static override id = 'sheet.mutation.move-columns';
}
export class SheetMutationMoveColumnsTransformable extends CommandTransformable<IMoveColumnsMutationParams>{
    public static override id = 'sheet.mutation.move-columns';
}
