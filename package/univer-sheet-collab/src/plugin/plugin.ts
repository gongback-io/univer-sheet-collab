import {
    ICommandService,
    Inject,
    Injector,
    Plugin,
    registerDependencies,
    touchDependencies,
} from "@univerjs/core";
import {ApplyRevisionService, IApplyRevisionService} from "./service/apply-revision.service";
import {ApplyRevisionController} from "./controller/apply-revision.controller";

export class UniverSheetCollabPlugin extends Plugin {
    static override pluginName = 'SHEET_COLLAB_PLUGIN';
    constructor(
        private readonly _config: unknown,
        @Inject(Injector) protected readonly _injector: Injector,
        @ICommandService protected readonly _commandService: ICommandService,
    ) {
        super()
    }

    override onStarting() {
        this._initDependencies();
    }

    override onReady() {
        touchDependencies(this._injector, [
            [IApplyRevisionService],
            [ApplyRevisionController],
        ]);
    }

    private _initDependencies(): void {
        registerDependencies(this._injector, [
            [IApplyRevisionService, {useClass: ApplyRevisionService}],
            [ApplyRevisionController],
        ]);
    }
}
