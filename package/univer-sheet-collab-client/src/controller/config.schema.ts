import {DocId, IRevisionWorkbook} from "@gongback/univer-sheet-collab";
import {CollabSocketOptions} from "../types";

export interface IRevisionStorage {
    get(docId: DocId, revision: string): Promise<IRevisionWorkbook>
    getList(docId: DocId, beforeRevision?: string): Promise<IRevisionWorkbook[]>
}
export const SHEET_COLLAB_PLUGIN_CONFIG_KEY = 'sheets-collab-client.config';
export interface ISheetCollabClientConfig {
    serverUrl: string,
    socketOptions?: CollabSocketOptions,
    revisionControl?: {
        storage: {
            revision: IRevisionStorage
        }
    }
    allowOfflineEditing?: boolean,

    opEmitName?: string
    opEventName?: string
    opEmitEventName?: string
    joinEventName?: string
    leaveEventName?: string
    fetchEventName?: string
}

export const REVISION_PANEL_CONFIG_KEY = 'sheets-collab-revision-panel.config';
export interface IRevisionPanelConfig {
    revisionControl?: {
        storage: {
            revision: IRevisionStorage
        }
    }
}

export const SOCKET_CONFIG_KEY = 'sheets-collab-socket.config';
export interface ISocketConfig {
    serverUrl: string,
    opts?: CollabSocketOptions
    opEmitName?  : string;
    opEventName?: string;
    joinEventName?: string;
    leaveEventName?: string;
    fetchEventName?: string;
}
