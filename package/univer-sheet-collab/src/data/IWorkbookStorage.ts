import { IWorkbookData } from "@univerjs/core";
import {RevisionId} from "../types";

export type IWorkbookStorage = {
    select(docId: string, revision?:RevisionId): Promise<IWorkbookData | undefined>;
    insert(docId: string, revision:RevisionId, workbookData: IWorkbookData): Promise<void>;
}
