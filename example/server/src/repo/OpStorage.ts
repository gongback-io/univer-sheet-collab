import { promises as fs } from 'fs';
import {DocId, IOperation, IOperationStorage, RevisionId} from "@gongback/univer-sheet-collab";
import path from 'path';

const operationsFilePath = path.join(__dirname, 'data', 'operations.json');

type IOpRow = {
    docId: string;
    revision: number;
    operation: string; // JSON 문자열로 저장
};

/*
 * File based storage for example.
 * This is not recommended for production.
 */
async function readOperationsFile(): Promise<IOpRow[]> {
    try {
        const data = await fs.readFile(operationsFilePath, 'utf8');
        return JSON.parse(data) as IOpRow[];
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            await fs.mkdir(path.dirname(operationsFilePath), { recursive: true });
            await fs.writeFile(operationsFilePath, '[]', 'utf8');
            return [];
        }
        throw error;
    }
}

async function writeOperationsFile(rows: IOpRow[]): Promise<void> {
    await fs.writeFile(operationsFilePath, JSON.stringify(rows, null, 2), 'utf8');
}

class OpStorage implements IOperationStorage {
    async insert(docId: DocId, operation: IOperation<any>): Promise<void> {
        const rows = await readOperationsFile();
        rows.push({
            docId,
            revision: operation.revision,
            operation: JSON.stringify(operation)
        });
        await writeOperationsFile(rows);
    }

    async selectAfter(docId: string, revision: RevisionId): Promise<IOperation[]> {
        const rows = await readOperationsFile();
        const filtered = rows.filter(row => row.docId === docId && row.revision > revision);
        return filtered.map(row => JSON.parse(row.operation));
    }

    async selectMaxRevision(docId: string): Promise<RevisionId> {
        const rows = await readOperationsFile();
        const filtered = rows.filter(row => row.docId === docId);
        if (filtered.length === 0) {
            return 1;
        }
        return Math.max(...filtered.map(row => row.revision));
    }
}

const opStorage = new OpStorage();
export { opStorage };
