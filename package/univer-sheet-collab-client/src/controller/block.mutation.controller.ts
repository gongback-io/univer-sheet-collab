import {Disposable, IConfigService, Inject, Injector} from "@univerjs/core";
import ActivityIndicator from "../views/ActivityIndicator";
import {BuiltInUIPart, connectInjector, IUIPartsService} from "@univerjs/ui";
import Header from "../views/Header";
import Block from "../views/Block";

export class BlockMutationController extends Disposable {
    constructor(
        @Inject(Injector) private readonly _injector: Injector,
        @IConfigService private readonly _configService: IConfigService,
        @IUIPartsService protected readonly _uiPartsService: IUIPartsService
    ) {
        super();
        this.disposeWithMe(
            this._uiPartsService.registerComponent(BuiltInUIPart.GLOBAL, () => connectInjector(Block, this._injector))
        );
    }
}
