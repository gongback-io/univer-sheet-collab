import {CommandTransformer} from "../../CommandTransformer";
import {ISetWorksheetRowAutoHeightMutationParams} from "@univerjs/sheets";
import {CommandTransformable} from "../../CommandTransformable";
import {DocId} from "../../../../../types";

export class SheetMutationSetWorksheetRowAutoHeightTransformer extends CommandTransformer<ISetWorksheetRowAutoHeightMutationParams> {
    public static override id = 'sheet.mutation.set-worksheet-row-auto-height';
}

export class SheetMutationSetWorksheetRowAutoHeightTransformable extends CommandTransformable<ISetWorksheetRowAutoHeightMutationParams>{
    public static override id = 'sheet.mutation.set-worksheet-row-auto-height';
    override insertRows(docId: DocId, sheetId: string, rowIndex: number, numRows: number) {
        if (
            this.command.params!.unitId !== docId ||
            this.command.params!.subUnitId !== sheetId
        ) {
            return;
        }
        this.command.params!.rowsAutoHeightInfo = this.command.params!.rowsAutoHeightInfo.map(info => {
            if (info.row >= rowIndex) {
                info.row += numRows;
            }
            return info;
        })
    }
    override removeRows(docId: DocId, sheetId: string, rowPosition: number, howMany: number) {
        if (
            this.command.params!.unitId !== docId ||
            this.command.params!.subUnitId !== sheetId
        ) {
            return;
        }
        this.command.params!.rowsAutoHeightInfo = this.command.params!.rowsAutoHeightInfo.map(info => {
            if (info.row >= rowPosition) {
                info.row -= howMany;
            }
            return info;
        })
    }
}
