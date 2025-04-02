import {
    DependentOn,
    ICommandService,
    Inject,
    Injector,
    Plugin,
    registerDependencies,
    touchDependencies
} from "@univerjs/core";
import {UniverSheetCollabPlugin} from "@gongback/univer-sheet-collab";
import {ApplyRevisionServerController} from "./controller/apply-revision-server.controller";

@DependentOn(UniverSheetCollabPlugin)
export class UniverSheetCollabServerPlugin extends Plugin {
    static override pluginName = 'SHEET_COLLAB_SERVER_PLUGIN';
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
            [ApplyRevisionServerController]
        ]);
    }

    private _initDependencies(): void {
        registerDependencies(this._injector, [
            [ApplyRevisionServerController]
        ]);
    }
}
