import {Disposable, ICommandService, Inject, Injector} from "@univerjs/core";
import {DataHandlerCommand} from "../commands/mutations/data-handler-command";

export class DataHandlerController extends Disposable {
    constructor(
        @Inject(Injector) private readonly _injector: Injector,
        @ICommandService protected readonly _commandService: ICommandService,
    ) {
        super();
        this.disposeWithMe(this._commandService.registerCommand(DataHandlerCommand))
    }
}
