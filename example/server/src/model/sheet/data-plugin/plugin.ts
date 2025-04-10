import {
    ICommandService,
    IConfigService,
    Inject,
    Injector,
    Plugin,
    registerDependencies,
    touchDependencies
} from "@univerjs/core";
import {DATA_CONFIG, DATA_CONFIG_KEY} from "./types";
import {DataHandlerController} from "./controller/DataHandlerController";

export class DataPlugin extends Plugin {
    static override pluginName = 'GONGBACK_DATA_PLUGIN';
    constructor(
        private readonly _config: DATA_CONFIG,
        @Inject(Injector) protected readonly _injector: Injector,
        @ICommandService protected readonly _commandService: ICommandService,
        @IConfigService private readonly _configService: IConfigService,
    ) {
        super()
        this._configService.setConfig(DATA_CONFIG_KEY, _config);
    }

    override onStarting() {
        this._initDependencies();
    }

    private _initDependencies(): void {
        registerDependencies(this._injector, [
            [DataHandlerController]
        ]);
    }
    override onReady() {
        touchDependencies(this._injector, [
            [DataHandlerController],
        ]);
    }
}
