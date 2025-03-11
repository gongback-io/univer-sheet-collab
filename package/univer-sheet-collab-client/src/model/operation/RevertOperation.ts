import {
    BaseTransformable,
    CellPayload,
} from "@gongback/univer-sheet-collab";

export default class RevertOperation extends BaseTransformable {
    private _cellPayload: CellPayload[];
    constructor(cellPayloads: CellPayload[]) {
        super({isTransformed: false});
        this._cellPayload = cellPayloads;
    }

    override getCellPayload(): CellPayload[] | undefined {
        return this._cellPayload;
    }
    override onCellPayloadChanged(cellPayloads: CellPayload[]) {
        this._cellPayload = cellPayloads;
    }
}
