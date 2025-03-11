
import {
    Plugin,
    Inject,
    Injector,
    IConfigService,
    registerDependencies,
    DependentOn,
    touchDependencies, IUndoRedoService
} from "@univerjs/core";
import {
    UniverSheetCollabPlugin
} from "@gongback/univer-sheet-collab";

import {
    SHEET_COLLAB_PLUGIN_CONFIG_KEY,
    REVISION_PANEL_CONFIG_KEY, SOCKET_CONFIG_KEY
} from "./controller/config.schema";

import type {ISheetCollabClientConfig} from "./controller/config.schema";
import {CollaborativeUndoRedoService} from "./services/collaborative-undo-redo.service";
import {
    IRevisionPannelService,
    RevisionPanelService
} from "./services/revision-panel.service";
import {RevisionPanelController} from "./controller/revision-panel.controller";
import {ApplyRevisionClientController} from "./controller/apply-revision-client.controller";
import {IWorkbookCollabHandlerService, WorkbookCollabHandlerService} from "./services/workbook-collab-handler.service";
import {BlockMutationService, IBlockMutationService} from "./services/block.mutation.service";
import {BlockMutationController} from "./controller/block.mutation.controller";
import {CollabSocket} from "./model/socket/CollabSocket";
import {IOperationService, OperationService} from "./services/operation.service";
export const SHEET_COLLAB_CLIENT_PLUGIN_NAME = 'SHEET_COLLAB_CLIENT_PLUGIN';

@DependentOn(UniverSheetCollabPlugin)
export class UniverSheetCollabClientPlugin extends Plugin {
    static override pluginName = SHEET_COLLAB_CLIENT_PLUGIN_NAME;

    constructor(
        private readonly _config: ISheetCollabClientConfig,
        @Inject(Injector) protected readonly _injector: Injector,
        @IConfigService private readonly _configService: IConfigService,
    ) {
        super()

        this._initConfig();
    }

    private _initConfig(): void {
        this._configService.setConfig(SOCKET_CONFIG_KEY, {
            serverUrl: this._config.serverUrl,
            opts: this._config.socketOptions,
            opEmitName: this._config.opEmitName,
            opEventName: this._config.opEventName,
            joinEventName: this._config.joinEventName,
            leaveEventName: this._config.leaveEventName,
            fetchEventName: this._config.fetchEventName,
        });
        this._configService.setConfig(SHEET_COLLAB_PLUGIN_CONFIG_KEY, this._config);
        this._configService.setConfig(REVISION_PANEL_CONFIG_KEY, {
            revisionControl: this._config.revisionControl
        });
    }

    private _initDependencies(): void {
        registerDependencies(this._injector, [
            [CollabSocket],
            [IOperationService, {useClass: OperationService}],
            [IRevisionPannelService, {useClass: RevisionPanelService}],
            [IWorkbookCollabHandlerService, {useClass: WorkbookCollabHandlerService}],
            [IBlockMutationService, {useClass: BlockMutationService}],
            // controllers
            [RevisionPanelController],
            [ApplyRevisionClientController],
            [BlockMutationController]
        ]);
    }

    override onStarting() {
        this._injector.replace([IUndoRedoService, { useClass: CollaborativeUndoRedoService }]);
        this._initDependencies();
    }

    override onReady() {
        touchDependencies(this._injector, [
            [IOperationService],
            [IRevisionPannelService],
            [IWorkbookCollabHandlerService],
            [IBlockMutationService],

            [RevisionPanelController],
            [ApplyRevisionClientController],
            [BlockMutationController]
        ]);
    }

    override dispose() {
        super.dispose();
    }
}

