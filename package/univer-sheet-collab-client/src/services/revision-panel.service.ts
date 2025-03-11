import {
    createIdentifier,
    Disposable,
} from "@univerjs/core";
import {BehaviorSubject, distinctUntilChanged, Observable, Subject} from 'rxjs';
export interface IRevisionPanelService {
    open$: Observable<boolean>
    isOpen: boolean
    open(): void
    close(): void
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const IRevisionPannelService = createIdentifier<IRevisionPanelService>('sheet.operation-revision-service');

export class RevisionPanelService extends Disposable implements IRevisionPanelService {

    private _open$ = new BehaviorSubject<boolean>(false);
    open$ = this._open$.pipe(distinctUntilChanged());
    get isOpen(): boolean {
        return this._open$.getValue();
    }

    override dispose(): void {
        super.dispose();

        this._open$.next(false);
        this._open$.complete();
    }

    open(): void {
        this._open$.next(true);
    }

    close(): void {
        this._open$.next(false);
    }
}
