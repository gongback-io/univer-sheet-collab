import {LocaleType, Univer, merge} from "@univerjs/core";
import {UniverFormulaEnginePlugin} from "@univerjs/engine-formula";
import {UniverDocsPlugin} from "@univerjs/docs";
import {UniverSheetsPlugin} from "@univerjs/sheets";
import {UniverSheetsFormulaPlugin} from "@univerjs/sheets-formula";
import {UniverSheetsFilterPlugin} from "@univerjs/sheets-filter";
import {UniverSheetsSortPlugin} from "@univerjs/sheets-sort";
import {UniverSheetsNumfmtPlugin} from "@univerjs/sheets-numfmt";

import SheetsEnUS from '@univerjs/sheets/locale/en-US';
import SheetsFormulaEnUS from '@univerjs/sheets-formula/locale/en-US';
import FindReplaceEnUS from '@univerjs/find-replace/locale/en-US';
import SheetsFindReplaceEnUS from '@univerjs/sheets-find-replace/locale/en-US';
import {LocalWorkbookDelegate} from "@gongback/univer-sheet-collab-sync-server";
import {DataPlugin} from "./sheet/data-plugin/plugin";


export class WorkbookModel extends LocalWorkbookDelegate {
    protected makeUniver(): Univer {
        const univer = new Univer({
            locale: LocaleType.EN_US,
            locales: {
                [LocaleType.EN_US]: merge(
                    SheetsEnUS,
                    SheetsFormulaEnUS,
                    FindReplaceEnUS,
                    SheetsFindReplaceEnUS,
                ),
            }
        });
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
        univer.registerPlugin(DataPlugin);
        // univer.registerPlugin(UniverSheetCollabPlugin);
        // univer.registerPlugin(UniverSheetCollabServerPlugin);
    }
}
