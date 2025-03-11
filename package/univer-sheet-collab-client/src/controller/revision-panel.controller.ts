
import {
    Disposable,
    Injector,
    Inject,
    IConfigService
} from '@univerjs/core'
import { BuiltInUIPart, connectInjector, IUIPartsService } from '@univerjs/ui';
import Header from "../views/Header";
import {
    IRevisionPanelConfig,
    REVISION_PANEL_CONFIG_KEY,
} from "./config.schema";
import Layer from "../views/Layer";

export class RevisionPanelController extends Disposable {

    constructor(
        @Inject(Injector) private readonly _injector: Injector,
        @IConfigService private readonly _configService: IConfigService,
        @IUIPartsService protected readonly _uiPartsService: IUIPartsService
    ) {
        super();
        const config = _configService.getConfig<IRevisionPanelConfig>(REVISION_PANEL_CONFIG_KEY);
        if (config?.revisionControl) {
            this.disposeWithMe(
                this._uiPartsService.registerComponent(BuiltInUIPart.HEADER_MENU, () => connectInjector(Header, this._injector))
            );
            this.disposeWithMe(
                this._uiPartsService.registerComponent(BuiltInUIPart.GLOBAL, () => connectInjector(Layer, this._injector))
            );
        }
    }
}
