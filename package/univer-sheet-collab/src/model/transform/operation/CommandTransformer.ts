import {ITransformerOptions} from "../basic/ITransformer";
import {ICommandInfo} from "@univerjs/core";
import {BaseTransformer} from "../basic/BaseTransformer";
import {ICommandTransformer} from "./ICommandTransformer";

export class CommandTransformer<T extends Object = object> extends BaseTransformer implements ICommandTransformer<T> {
    command: ICommandInfo<T>;

    constructor(command: ICommandInfo<T>, options?: ITransformerOptions) {
        super(options);
        this.command = command;
    }
}
