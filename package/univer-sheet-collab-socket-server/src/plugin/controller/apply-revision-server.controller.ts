import {Disposable, ICommandService, Inject, Injector} from "@univerjs/core";
import {IApplyRevisionService} from "@gongback/univer-sheet-collab";

export class ApplyRevisionServerController extends Disposable {
    preventApply = false;

    constructor(
        @Inject(Injector) private readonly _injector: Injector,
        @ICommandService protected readonly _commandService: ICommandService,
        @IApplyRevisionService protected readonly _applyRevisionService: IApplyRevisionService,
    ) {
        super();

        _applyRevisionService.needApply$.subscribe(apply => {
            this.preventApply = apply;
        })

        _commandService.beforeCommandExecuted((command, options) => {
            if (this.preventApply) {
                throw new Error('Sheet Must be refreshed');
            }
        })
    }
}
