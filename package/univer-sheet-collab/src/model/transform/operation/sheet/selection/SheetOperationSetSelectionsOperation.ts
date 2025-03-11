import {CommandTransformer} from "../../CommandTransformer";
import {ISetSelectionsOperationParams} from "@univerjs/sheets";
import {CommandTransformable} from "../../CommandTransformable";

export class SheetOperationSetSelectionsTransformer extends CommandTransformer<ISetSelectionsOperationParams> {
    public static override id = "sheet.operation.set-selections";
}
export class SheetOperationSetSelectionsTransformable extends CommandTransformable<ISetSelectionsOperationParams> {
    public static override id = "sheet.operation.set-selections";
}
