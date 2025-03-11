import {Disposable, ICommandService, Inject, Injector} from "@univerjs/core";
import {ApplyRevisionMutation} from "../../commands/mutations/apply-revision.mutation";

export class ApplyRevisionController extends Disposable {
    constructor(
        @Inject(Injector) private readonly _injector: Injector,
        @ICommandService protected readonly _commandService: ICommandService,
    ) {
        super();
        this.disposeWithMe(this._commandService.registerCommand(ApplyRevisionMutation))
    }
}
