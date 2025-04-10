import {CommandTransformable} from "./CommandTransformable";
import {CommandTransformer} from "./CommandTransformer";

export class DefaultTransformer extends CommandTransformer {
    public static override id = 'default.operation';
}
export class DefaultTransformableModel extends CommandTransformable {
    public static override id = 'default.operation';
}
