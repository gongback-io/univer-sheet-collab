import {createIdentifier, Disposable, Inject, Injector} from "@univerjs/core";

export interface ISheetDataHandlerService {
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const ISheetDataHandlerService = createIdentifier<ISheetDataHandlerService>('sheet.gongback.data.handler.service');
export class SheetDataHandlerService extends Disposable implements ISheetDataHandlerService {
    constructor(
        @Inject(Injector) private readonly _injector: Injector,
    ) {
        super();
    }

    override dispose(): void {
        super.dispose();
    }

}
