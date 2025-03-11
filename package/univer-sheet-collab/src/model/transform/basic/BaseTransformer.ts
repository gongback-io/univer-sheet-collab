import {ITransformable} from "./ITransformable";
import {ITransformer, ITransformerOptions, TransformerOptions} from "./ITransformer";

export class BaseTransformer implements ITransformer {
    static id: string;

    constructor(options?: ITransformerOptions) {
    }

    transform<T extends ITransformable>(target: T, options: TransformerOptions | undefined): T {
        return target;
    }

    public get id(): string {
        return (this.constructor as typeof BaseTransformer).id;
    }
}
