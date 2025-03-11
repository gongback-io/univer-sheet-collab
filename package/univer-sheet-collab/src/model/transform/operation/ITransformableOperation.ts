import {IOperation} from "../../../types";
import {ICommandTransformable} from "./ICommandTransformable";
import {ICommandTransformer} from "./ICommandTransformer";
import {ICommandInfo} from "@univerjs/core";

export interface ITransformableOperation<T extends Object = object> extends IOperation<T>, ICommandTransformable<T>, ICommandTransformer<T> {
    readonly command: ICommandInfo<T>;
}
