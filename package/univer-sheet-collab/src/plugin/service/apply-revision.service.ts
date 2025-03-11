import {BehaviorSubject, distinctUntilChanged, Observable} from "rxjs";
import {createIdentifier, Disposable} from "@univerjs/core";
import {RevisionId} from "../../types";

export interface IApplyRevisionService {
    needApply$: Observable<boolean>
    apply(revision: RevisionId): void
}

export const ApplyRevisionServiceName = 'apply-revision-service';

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const IApplyRevisionService = createIdentifier<IApplyRevisionService>(ApplyRevisionServiceName);

export class ApplyRevisionService extends Disposable implements IApplyRevisionService {

    private _needApply = new BehaviorSubject<boolean>(false);
    needApply$ = this._needApply.pipe(distinctUntilChanged());

    apply(revision: RevisionId) {
        this._needApply.next(true);
    }
}
