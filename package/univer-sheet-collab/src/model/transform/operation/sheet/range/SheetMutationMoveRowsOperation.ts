import {CommandTransformer} from "../../CommandTransformer";
import {IMoveRowsMutationParams} from "@univerjs/sheets";
import {CommandTransformable} from "../../CommandTransformable";

export class SheetMutationMoveRowsTransformer extends CommandTransformer<IMoveRowsMutationParams> {
    public static override id = 'sheet.mutation.move-rows';
}

export class SheetMutationMoveRowsTransformable extends CommandTransformable<IMoveRowsMutationParams>{
    public static override id = 'sheet.mutation.move-rows';
}
