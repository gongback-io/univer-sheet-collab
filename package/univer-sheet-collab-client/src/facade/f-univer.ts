
import { FUniver } from '@univerjs/core/facade';
import {FCollab} from "./f-collab";

export interface IFUniverDocsUIMixin {
    getCollab(): FCollab;
}

export class FUniverDocsMixin extends FUniver implements IFUniverDocsUIMixin {
    override getCollab(): FCollab {
        return this._injector.createInstance(FCollab);
    }
}

FUniver.extend(FUniverDocsMixin);
declare module '@univerjs/core/facade' {
    // eslint-disable-next-line ts/naming-convention
    interface FUniver extends IFUniverDocsUIMixin {}
}
