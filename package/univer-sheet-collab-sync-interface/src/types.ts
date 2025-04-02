import {IOperation} from "@gongback/univer-sheet-collab";

export type SyncRequest = {
    docId: string;
    operation: IOperation;
    collabId: string;
}
export type SyncResult = {
    docId: string,
    operation: IOperation,
    isTransformed: boolean,
}
