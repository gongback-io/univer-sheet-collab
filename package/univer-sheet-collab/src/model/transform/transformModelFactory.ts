import {TransformableOperation, TransformableOperationOptions} from "./operation/TransformableOperation";
import {
    SheetMutationAddRangeProtectionTransformable,
    SheetMutationAddRangeProtectionTransformer
} from "./operation/sheet/protection/SheetMutationAddRangeProtectionOperation";
import {ApplyRevisionTransformable, ApplyRevisionTransformer} from "./operation/collab/ApplyRevisionOperation";
import {
    SheetMutationAddWorksheetProtectionTransformable,
    SheetMutationAddWorksheetProtectionTransformer
} from "./operation/sheet/protection/SheetMutationAddWorksheetProtectionOperation";
import {
    SheetMutationSetRangeProtectionTransformable,
    SheetMutationSetRangeProtectionTransformer
} from "./operation/sheet/protection/SheetMutationSetRangeProtectionOperation";
import {
    SheetMutationSetWorksheetProtectionTransformable,
    SheetMutationSetWorksheetProtectionTransformer
} from "./operation/sheet/protection/SheetMutationSetWorksheetProtectionOperation";
import {
    SheetMutationInsertColTransformable,
    SheetMutationInsertColTransformer
} from "./operation/sheet/range/SheetMutationInsertColOperation";
import {
    SheetMutationInsertRowTransformable,
    SheetMutationInsertRowTransformer
} from "./operation/sheet/range/SheetMutationInsertRowOperation";
import {
    SheetMutationMoveColumnsTransformable,
    SheetMutationMoveColumnsTransformer
} from "./operation/sheet/range/SheetMutationMoveColumnsOperation";
import {
    SheetMutationMoveRowsTransformable,
    SheetMutationMoveRowsTransformer
} from "./operation/sheet/range/SheetMutationMoveRowsOperation";
import {
    SheetMutationRemoveColTransformable,
    SheetMutationRemoveColTransformer
} from "./operation/sheet/range/SheetMutationRemoveColOperation";
import {
    SheetMutationRemoveRowTransformable,
    SheetMutationRemoveRowTransformer
} from "./operation/sheet/range/SheetMutationRemoveRowOperation";
import {
    SheetMutationSetWorksheetRowAutoHeightTransformable,
    SheetMutationSetWorksheetRowAutoHeightTransformer
} from "./operation/sheet/range/SheetMutationSetWorksheetRowAutoHeightOperation";
import {
    SheetMutationAddWorksheetMergeTransformable,
    SheetMutationAddWorksheetMergeTransformer
} from "./operation/sheet/value-change/SheetMutationAddWorksheetMergeOperation";
import SheetMutationMoveRangeTransformer, {
    SheetMutationMoveRangeTransformable
} from "./operation/sheet/value-change/SheetMutationMoveRangeOperation";
import {
    SheetMutationReorderRangeTransformable,
    SheetMutationReorderRangeTransformer
} from "./operation/sheet/value-change/SheetMutationReorderRangeOperation";
import {
    SheetMutationSetColDataTransformable,
    SheetMutationSetColDataTransformer
} from "./operation/sheet/value-change/SheetMutationSetColDataOperation";
import {
    SheetMutationSetRangeValuesTransformable,
    SheetMutationSetRangeValuesTransformer
} from "./operation/sheet/value-change/SheetMutationSetRangeValuesOperation";
import {
    SheetMutationSetRowDataTransformable,
    SheetMutationSetRowDataTransformer
} from "./operation/sheet/value-change/SheetMutationSetRowDataOperation";
import {ICommandInfo} from "@univerjs/core";
import {DefaultTransformableModel, DefaultTransformer} from "./operation/DefaultOperation";
import {IOperation} from "../../types";
import {ITransformableOption} from "./basic/ITransformable";
import {ITransformerOptions} from "./basic/ITransformer";
import {ITransformableOperation} from "./operation/ITransformableOperation";
import {ICommandTransformer} from "./operation/ICommandTransformer";
import {ICommandTransformable} from "./operation/ICommandTransformable";

export interface Ctor<T> {
    new (...args: any[]): T;
    name: string;
    id: string;
}
export class TransformModelFactory {
    private transformableMap: Map<string, Ctor<ICommandTransformable>> = new Map();
    private transformerMap: Map<string, Ctor<ICommandTransformer>> = new Map();

    constructor(
    ) {
        this.registTransformer([
            ApplyRevisionTransformer,
            SheetMutationAddRangeProtectionTransformer,
            SheetMutationAddWorksheetProtectionTransformer,
            SheetMutationSetRangeProtectionTransformer,
            SheetMutationSetWorksheetProtectionTransformer,
            SheetMutationInsertColTransformer,
            SheetMutationInsertRowTransformer,
            SheetMutationMoveColumnsTransformer,
            SheetMutationMoveRowsTransformer,
            SheetMutationRemoveColTransformer,
            SheetMutationRemoveRowTransformer,
            SheetMutationSetWorksheetRowAutoHeightTransformer,
            SheetMutationAddWorksheetMergeTransformer,
            SheetMutationMoveRangeTransformer,
            SheetMutationReorderRangeTransformer,
            SheetMutationSetColDataTransformer,
            SheetMutationSetRangeValuesTransformer,
            SheetMutationSetRowDataTransformer,
        ])
        this.registTransformable([
            ApplyRevisionTransformable,
            SheetMutationAddRangeProtectionTransformable,
            SheetMutationAddWorksheetProtectionTransformable,
            SheetMutationSetRangeProtectionTransformable,
            SheetMutationSetWorksheetProtectionTransformable,
            SheetMutationInsertColTransformable,
            SheetMutationInsertRowTransformable,
            SheetMutationMoveColumnsTransformable,
            SheetMutationMoveRowsTransformable,
            SheetMutationRemoveColTransformable,
            SheetMutationRemoveRowTransformable,
            SheetMutationSetWorksheetRowAutoHeightTransformable,
            SheetMutationAddWorksheetMergeTransformable,
            SheetMutationMoveRangeTransformable,
            SheetMutationReorderRangeTransformable,
            SheetMutationSetColDataTransformable,
            SheetMutationSetRangeValuesTransformable,
            SheetMutationSetRowDataTransformable,
        ])
    }
    registTransformable(ctr: Ctor<ICommandTransformable>[]): void {
        ctr.forEach(o => this.transformableMap.set(o.id, o));
    }
    registTransformer(ctr: Ctor<ICommandTransformer>[]): void {
        ctr.forEach(o => this.transformerMap.set(o.id, o));
    }
    createTransformable(command: ICommandInfo<any>, options?: ITransformableOption): ICommandTransformable {
        const ctr = this.transformableMap.get(command.id);
        if (ctr) {
            return new ctr(JSON.parse(JSON.stringify(command)), options);
        }
        return new DefaultTransformableModel(command, options);
    }
    createTransformer(command: ICommandInfo<any>, options?: ITransformerOptions): ICommandTransformer {
        const ctr = this.transformerMap.get(command.id);
        const operation = JSON.parse(JSON.stringify(command));
        if (ctr) {
            return new ctr(operation, command, options);
        }
        return new DefaultTransformer(command, options);
    }
    createTransformableOperation(o: IOperation<any>, options?: TransformableOperationOptions): ITransformableOperation {
        const transformable = this.createTransformable(o.command);
        const transformer = this.createTransformer(o.command);

        return new TransformableOperation(o, transformable, transformer, options);
    }
}

const transformModelFactory = new TransformModelFactory();
export {transformModelFactory};
