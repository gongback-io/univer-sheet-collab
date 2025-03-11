import type {
    IMutation,
    IMutationCommonParams,
    Workbook,
} from '@univerjs/core';
import { CommandType, IUniverInstanceService } from '@univerjs/core';
import {RevisionId} from "../../types";
import {IApplyRevisionService} from "../../plugin/service/apply-revision.service";

export interface IApplayRevisionMutationParams extends IMutationCommonParams {
    unitId: string;
    revision: RevisionId
}

export const ApplyRevisionMutation: IMutation<IApplayRevisionMutationParams, boolean> = {
    id: 'collab.mutation.apply-revision',

    type: CommandType.MUTATION,

    handler: (accessor, params) => {
        const { unitId, revision } = params;
        const univerInstanceService = accessor.get(IUniverInstanceService);
        const workbook = univerInstanceService.getUnit<Workbook>(unitId);
        if (!workbook) {
            return false;
        }
        const applyRevisionService = accessor.get(IApplyRevisionService);
        if (!applyRevisionService) {
            return false;
        }

        applyRevisionService.apply(revision);

        /* TODO
            const confirm = await confirmService.confirm({
                id: 'collab.confirm.apply-revision',
                title: {
                    title: localeService.t('collab.apply.title'),
                },
                children: { title: localeService.t('collab.apply.message') },
                cancelText: localeService.t('button.cancel'),
                confirmText: localeService.t('button.confirm'),
            });
         */
        return false;
    },
};
