import {
    createIdentifier,
    Disposable,
    Inject,
    Injector, IPermissionService,
    IUniverInstanceService, UniverInstanceType,
    Workbook
} from "@univerjs/core";
import { WorkbookEditablePermission } from "@univerjs/sheets";
import {BehaviorSubject, distinctUntilChanged, Observable} from "rxjs";

export interface IBlockMutationService {
    status$: Observable<boolean>;
    isBlock: boolean;
    block(): void;
    close(): void;
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const IBlockMutationService = createIdentifier<IBlockMutationService>('sheet.block-mutation.service');
export class BlockMutationService extends Disposable implements IBlockMutationService {
    constructor(
        @Inject(Injector) private readonly _injector: Injector,
        @IUniverInstanceService private readonly _univerInstanceService: IUniverInstanceService,
        @IPermissionService private readonly _permissionService: IPermissionService,

    ) {
        super();
    }
    private _status$ = new BehaviorSubject<boolean>(false);
    status$ = this._status$.pipe(distinctUntilChanged());
    get isBlock(): boolean {
        return this._status$.getValue();
    }

    override dispose(): void {
        super.dispose();

        this._status$.next(false);
        this._status$.complete();
    }

    block(): void {
        if (this.setEditable(false)) {
            this._status$.next(true);
        }
    }

    close(): void {
        if (this.setEditable(true)) {
            this._status$.next(false);
        }
    }

    setEditable(editable: Boolean): boolean {
        const workbook = this._univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET);
        if(!workbook) {
            return false;
        }
        const instance = new WorkbookEditablePermission(workbook.getUnitId());
        const editPermissionPoint = this._permissionService.getPermissionPoint(instance.id);
        if (!editPermissionPoint) {
            this._permissionService.addPermissionPoint(instance);
        }
        this._permissionService.updatePermissionPoint(instance.id, editable);
        return true
    }
}
