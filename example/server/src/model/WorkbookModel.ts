import {Univer} from "@univerjs/core";
import {UniverFormulaEnginePlugin} from "@univerjs/engine-formula";
import {UniverDocsPlugin} from "@univerjs/docs";
import {UniverSheetsPlugin} from "@univerjs/sheets";
import {UniverSheetsFormulaPlugin} from "@univerjs/sheets-formula";
import {UniverSheetsFilterPlugin} from "@univerjs/sheets-filter";
import {UniverSheetsSortPlugin} from "@univerjs/sheets-sort";
import {UniverSheetsNumfmtPlugin} from "@univerjs/sheets-numfmt";
import {UniverSheetCollabPlugin} from "@gongback/univer-sheet-collab";
import {UniverSheetCollabServerPlugin, LocalWorkbookDelegate} from "@gongback/univer-sheet-collab-server";

export class WorkbookModel extends LocalWorkbookDelegate {
    protected makeUniver(): Univer {
        const univer = new Univer();
        this.registerBasicPlugin(univer);
        this.registerDocPlugin(univer);
        this.registerSheetPlugin(univer);
        return univer;
    }

    private registerBasicPlugin(univer: Univer): void {
        univer.registerPlugin(UniverFormulaEnginePlugin);
    }

    private registerDocPlugin(univer: Univer): void {
        univer.registerPlugin(UniverDocsPlugin);
    }

    private registerSheetPlugin(univer: Univer): void {
        univer.registerPlugin(UniverSheetsPlugin);
        univer.registerPlugin(UniverSheetsFormulaPlugin);
        univer.registerPlugin(UniverSheetsFilterPlugin);
        univer.registerPlugin(UniverSheetsSortPlugin);
        univer.registerPlugin(UniverSheetsNumfmtPlugin);
        univer.registerPlugin(UniverSheetCollabPlugin);
        univer.registerPlugin(UniverSheetCollabServerPlugin);
    }
}
