import {IApplayRevisionMutationParams} from "../../../../commands/mutations/apply-revision.mutation";
import {ITransformable} from "../../basic/ITransformable";
import {TooOldRevisionException} from "../../../../exception/TooOldRevisionException";
import {CommandTransformable} from "../CommandTransformable";
import {CommandTransformer} from "../CommandTransformer";

export class ApplyRevisionTransformer extends CommandTransformer<IApplayRevisionMutationParams> {
    public static override id = 'collab.mutation.apply-revision';

    override transform<T extends ITransformable>(target: T): T {
        throw new TooOldRevisionException(`The workbook's revision has been rolled back. The user must reload the workbook.`);
    }
}

export class ApplyRevisionTransformable extends CommandTransformable<IApplayRevisionMutationParams> {
    public static override id = 'collab.mutation.apply-revision';
}
