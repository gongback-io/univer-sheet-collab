import {ICommandInfo} from "@univerjs/core";
import {BaseTransformable} from "../basic/BaseTransformable";
import {ICommandTransformable} from "./ICommandTransformable";
import {ITransformableOption} from "../basic/ITransformable";

export class CommandTransformable<T extends Object = object> extends BaseTransformable implements ICommandTransformable {
    command: ICommandInfo<T>;

    constructor(command: ICommandInfo<T>, options?: ITransformableOption) {
        super(options);
        this.command = command;
    }
}
