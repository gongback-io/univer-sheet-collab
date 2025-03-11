import {IRevisionStorage} from "@gongback/univer-sheet-collab-client";
import {DocId, IRevisionWorkbook} from "@gongback/univer-sheet-collab";
import axios from "axios";

export class RevisionStorage implements IRevisionStorage {
    async get(docId: DocId, revision: string): Promise<IRevisionWorkbook> {
        const res = await axios.get<IRevisionWorkbook>(`http://localhost:3000/sheet/${docId}/${revision}`)
        return res.data;
    }

    async getList(docId: DocId, beforeRevision?: string): Promise<IRevisionWorkbook[]> {
        const res = await axios.get<IRevisionWorkbook[]>(`http://localhost:3000/sheet/${docId}`, {
            params: {
                beforeRevision
            }
        })
        return res.data.map(revision => ({
            ...revision,
            at: new Date(revision.at)
        }));
    }
}
