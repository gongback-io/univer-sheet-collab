import {FBaseInitialable} from "@univerjs/core/facade";
import {CollabSocket} from "../model/socket/CollabSocket";
import {
    IConfigService,
    ICreateUnitOptions, IDisposable,
    Inject,
    Injector,
    IUniverInstanceService,
    IWorkbookData, toDisposable,
    UniverInstanceType,
    Workbook
} from "@univerjs/core";
import {FWorkbook} from "@univerjs/sheets/facade";
import {IWorkbookCollabHandlerService} from "../services/workbook-collab-handler.service";
import {DocId} from "@gongback/univer-sheet-collab";

export class FCollab extends FBaseInitialable {
    constructor(
        @Inject(Injector) protected override readonly _injector: Injector,
        @IConfigService protected readonly _configService: IConfigService,
        @IUniverInstanceService protected readonly _univerInstanceService: IUniverInstanceService,
    ) {
        super(_injector);

        this._injector.onDispose(() => {
            this.dispose();
        });
    }

    getSocket(): CollabSocket {
        return this._injector.get(CollabSocket);
    }
    async join(docId: string, options?:ICreateUnitOptions): Promise<FWorkbook> {
        const collabSocket = this._injector.get(CollabSocket);

        const response = await collabSocket.joinSheet(docId);
        const workbook = this._univerInstanceService.createUnit<IWorkbookData, Workbook>(UniverInstanceType.UNIVER_SHEET, response.workbookData, options);

        const workbookCollabHandlerService = this._injector.get(IWorkbookCollabHandlerService);
        workbookCollabHandlerService.join(docId);

        return this._injector.createInstance(FWorkbook, workbook);
    }

    onRevisionChanged(docId: DocId, callback: (revision: number) => void): IDisposable {
        const workbookCollabHandlerService = this._injector.get(IWorkbookCollabHandlerService);
        const controller = workbookCollabHandlerService.getController(docId);
        if (!controller) {
            throw new Error('No controller found for docId: ' + docId);
        }
        return toDisposable(
            controller.rev$.subscribe((rev) => {
                callback(rev);
            })
        )
    }

    override dispose() {
        super.dispose();

    }
}
