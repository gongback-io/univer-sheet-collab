import {ICommandInfo} from "@univerjs/core";
import {ITransformer} from "../basic/ITransformer";

export interface ICommandTransformer<T extends Object = object> extends ITransformer {
    readonly command: ICommandInfo<T>
}
