import { ITransformable } from "./ITransformable";
import {ICommandInfo} from "@univerjs/core";

export type ITransformerOptions = {

}
export type TransformerOptions = {
    ignoreCellUpdate?: boolean
}
export interface ITransformer {
    readonly id: string;
    transform: <T extends ITransformable>(target: T, options?: TransformerOptions) => T
}

