import {ICommandInfo} from "@univerjs/core";
import {ITransformable} from "../basic/ITransformable";

export interface ICommandTransformable<T extends Object = object> extends ITransformable {
    readonly command: ICommandInfo<T>;
}
