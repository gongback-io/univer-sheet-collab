
import {
    IUniverInstanceService,
    Disposable,
    Injector,
    Inject,
    LocaleService,
} from '@univerjs/core'
import {IConfirmService} from '@univerjs/ui';
import {IApplyRevisionService} from "@gongback/univer-sheet-collab";

export class ApplyRevisionClientController extends Disposable {

    constructor(
        @Inject(Injector) private readonly _injector: Injector,
        @IUniverInstanceService protected readonly _univerInstanceService: IUniverInstanceService,
        @IApplyRevisionService protected readonly _applyRevisionService: IApplyRevisionService,
        @IConfirmService protected readonly _confirmService: IConfirmService,
        @Inject(LocaleService) private readonly _localeService: LocaleService,
    ) {
        super();
        this.disposeWithMe(
            _applyRevisionService.needApply$.subscribe((needApply) => {
                if (needApply) {
                    _confirmService.confirm({
                        id: 'collab.confirm.apply-revision',
                        children: { title: _localeService.t('collab.apply.refreshMessage') },
                        confirmText: _localeService.t('button.confirm'),
                    }).then((confirm) => {
                        window.location.reload();
                    });
                }
            })
        )
    }
}
