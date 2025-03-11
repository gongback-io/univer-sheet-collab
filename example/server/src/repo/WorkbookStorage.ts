import { promises as fs } from 'fs';
import { IWorkbookData } from "@univerjs/core";
import { IWorkbookStorage } from "@gongback/univer-sheet-collab-server";
import { IRevisionWorkbook, RevisionId } from "@gongback/univer-sheet-collab";
import path from 'path';

const sheetsFilePath = path.join(__dirname, 'data', 'sheets.json');

type ISheetRow = {
    docId: string;
    revision: number;
    name?: string;
    sheetData: string;
    at: string;
};

/*
 * File based storage for example.
 * This is not recommended for production.
 */
async function readSheetsFile(): Promise<ISheetRow[]> {
    try {
        const data = await fs.readFile(sheetsFilePath, 'utf8');
        return JSON.parse(data) as ISheetRow[];
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            await fs.mkdir(path.dirname(sheetsFilePath), { recursive: true });
            await fs.writeFile(sheetsFilePath, '[]', 'utf8');
            return [];
        }
        throw error;
    }
}

async function writeSheetsFile(rows: ISheetRow[]): Promise<void> {
    await fs.writeFile(sheetsFilePath, JSON.stringify(rows, null, 2), 'utf8');
}

class WorkbookStorage implements IWorkbookStorage {
    public async selectWorkbook(docId: string, revision: number): Promise<IRevisionWorkbook | undefined> {
        const rows = await readSheetsFile();
        const found = rows.find(row => row.docId === docId && row.revision === revision);
        if (!found) {
            return undefined;
        }
        return {
            docId: found.docId,
            revision: found.revision,
            workbookData: JSON.parse(found.sheetData),
            at: new Date(found.at)
        };
    }

    public async selectLatestWorkbook(docId: string): Promise<IRevisionWorkbook | undefined> {
        const rows = await readSheetsFile();
        const filtered = rows.filter(row => row.docId === docId);
        if (filtered.length === 0) {
            return undefined;
        }
        const latest = filtered.reduce((prev, curr) => (prev.revision > curr.revision ? prev : curr));
        return {
            docId: latest.docId,
            revision: latest.revision,
            workbookData: JSON.parse(latest.sheetData),
            at: new Date(latest.at)
        };
    }

    async select(docId: string, revision?: RevisionId): Promise<IWorkbookData | undefined> {
        if (revision) {
            const revisionSheet = await this.selectWorkbook(docId, revision);
            return revisionSheet?.workbookData;
        }
        const revisionSheet = await this.selectLatestWorkbook(docId);
        return revisionSheet?.workbookData;
    }

    public async insert(docId: string, revision: number, sheetData: IWorkbookData): Promise<void> {
        const rows = await readSheetsFile();
        rows.push({
            docId,
            revision,
            sheetData: JSON.stringify(sheetData),
            at: new Date().toISOString()
        });
        await writeSheetsFile(rows);
    }

    public async selectWorkbooks(docId: string): Promise<IRevisionWorkbook[]> {
        const rows = await readSheetsFile();
        const filtered = rows.filter(row => row.docId === docId);
        return filtered.map(row => ({
            docId: row.docId,
            revision: row.revision,
            workbookData: JSON.parse(row.sheetData),
            at: new Date(row.at)
        }));
    }
}

const workbookStorage = new WorkbookStorage();
export { workbookStorage };
