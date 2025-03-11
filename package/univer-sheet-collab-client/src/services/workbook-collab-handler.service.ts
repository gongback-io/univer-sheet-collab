
import {
    Disposable,
    Injector,
    Inject,
    createIdentifier,
} from '@univerjs/core'
import {SheetOperationHandler} from "../model/sheet-operation-handler";
import {DocId} from '@gongback/univer-sheet-collab';

export interface IWorkbookCollabHandlerService {
    join(docId: string): void
    getController(docId: DocId): SheetOperationHandler | null;
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const IWorkbookCollabHandlerService = createIdentifier<IWorkbookCollabHandlerService>('sheet.collab-handler.service');
export class WorkbookCollabHandlerService extends Disposable implements IWorkbookCollabHandlerService {
    private _handler: { [docId: DocId]: SheetOperationHandler } = {};

    constructor(
        @Inject(Injector) private readonly _injector: Injector,
    ) {
        super();
    }

    join(docId: string): void {
        if (this._handler[docId]) {
            return;
        }
        const handler = this._injector.createInstance(SheetOperationHandler, docId);
        this._handler[docId] = handler;
    }

    getController(docId: DocId): SheetOperationHandler | null {
        return this._handler[docId] || null;
    }

    override dispose() {
        super.dispose();
        for (const docId in this._handler) {
            this._handler[docId].dispose();
        }
    }
}
