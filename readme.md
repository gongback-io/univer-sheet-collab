# @gongback/univer-sheet-collab Plugin

**@gongback/univer-sheet-collab** is an open-source collaborative spreadsheet plugin for Univer Spreadsheet ([GitHub](https://github.com/dream-num/univer)). It enables real-time collaboration similar to Google Sheets, allowing simultaneous spreadsheet editing, conflict resolution, and revision management.

> **Warning:** This project is currently unstable, especially regarding conflict resolution and undo/redo management. Use caution and provide feedback for improvements.

For guaranteed performance, reliability, and spreadsheet integrity, consider subscribing to [Univer's official collaboration plugin](https://docs.univer.ai/en-US/guides/sheets/features/collaboration).

---

## Features

- **Real-time Collaboration:** Multiple simultaneous users editing spreadsheets.
- **Conflict Resolution:** Automatic conflict handling for concurrent edits.
- **Undo/Redo Management:** Consistent undo/redo behavior among collaborators.
- **Revision History:** Ability to save and retrieve spreadsheet revisions.

---

## Getting Started

### Client

Install packages

```bash
npm install @gongback/univer-sheet-collab
npm install @gongback/univer-sheet-collab-client
```

Register plugins and join document

```typescript
import { WorkbookCollabPlugin, WorkbookCollabClientPlugin } from '@gongback/univer-sheet-collab-client';
import SheetCollabEnUS from '@gongback/univer-sheet-collab-client/locale/en-US';
import "@gongback/univer-sheet-collab-client/facade";

const univer = new Univer({
    locales: {
        [LocaleType.EN_US]: merge(
            //...
            SheetCollabEnUS
        ),
    }
});

univer.registerPlugin(WorkbookCollabPlugin);
univer.registerPlugin(WorkbookCollabClientPlugin, {
    serverUrl: 'http://localhost:3000',
    revisionControl: {
        storage: {
            revision: new RevisionStorage(),
        },
    },
});

const fCollab = FUniver.newAPI(univer).getCollab();
const workbook = await fCollab.join(docId);
```

Implement the `IRevisionStorage` interface to enable fetching revision data:

```typescript
export interface IRevisionStorage {
    get(docId: DocId, revision: string): Promise<IRevisionWorkbook>;
    getList(docId: DocId, beforeRevision?: string): Promise<IRevisionWorkbook[]>;
}
```

### Server (Node.js)

Install packages

```bash
npm install @gongback/univer-sheet-collab
npm install @gongback/univer-sheet-collab-server
```

Start socket server

```typescript
import { GongbackCollabServer } from '@gongback/univer-sheet-collab-server';
import { Server } from 'socket.io'

const io = new Server();
const gongbackCollabServer = new GongbackCollabServer(io, {
    workbookStorage,
    opStorage,
    workbookFactory: (docId) => new WorkbookDelegate(docId)
});

gongbackCollabServer.listen();
```

Implement the `IWorkbookDelegate` interface:

The server library must communicate with a Univer instance that loads the same plugins as the client instance.

It's recommended to manage Univer instances externally, not directly within the socket server, to prevent excessive memory use.

Extending LocalWorkbookDelegate allows quick local testing but is not recommended for production environments.

Ideally, workbooks should be managed by a dedicated external server instance.

```typescript
export interface IWorkbookDelegate {
    readonly docId: DocId;
    createSheet(workbookData: Partial<IWorkbookData>): Promise<void>;
    executeOperation(operation: IOperation): Promise<IWorkbookData>;
    getSnapshot(): Promise<IWorkbookData>;
    dispose(): Promise<void>;
}
```

Example local instance creation:

```typescript
export class WorkbookModel extends LocalWorkbookDelegate {
    protected makeUniver(): Univer {
        const univer = new Univer();
        //... other plugins
        univer.registerPlugin(UniverSheetCollabPlugin);
        univer.registerPlugin(UniverSheetCollabServerPlugin);
    }
}
```

Implement storage interfaces:

- `IWorkbookStorage` for workbook snapshots (use noSQL DB for efficiency)
- `IOpStorage` for operations (use noSQL DB for efficiency)

---

## Configuration Parameters

### Client Side

| Parameter          | Type                  | Description                                          |
| ------------------ | --------------------- | ---------------------------------------------------- |
| serverUrl          | `string`              | Address of socket server                             |
| socketOptions      | `CollabSocketOptions` | Options for socket connection (optional)             |
| allowOfflineEditing | `boolean`             | Enables offline editing (default: false).            |
| revisionControl    | `object`              | Enables rollback to previous revisions (optional).   |
| ↳ storage.revision | `IRevisionStorage`    | Required if revision rollback functionality is used. |

### Server Side

| Parameter        | Type                                   | Description                              |
| ---------------- | -------------------------------------- | ---------------------------------------- |
| workbookStorage  | `IWorkbookStorage`                     | Storage for workbook snapshots.          |
| opStorage        | `IOpStorage`                           | Storage for operations (commands).       |
| workbookFactory  | `(docId: string) => IWorkbookDelegate` | Delegates workbook operations execution. |
| initialSheetData | `Partial<IWorkbookData>` (optional)    | Optional initial workbook data.          |

---

## Roadmap

Upcoming features:

- Additional command transformations.
- Display of collaborator cursor positions and selected cells.

---

## License

Licensed under **Apache License 2.0**, consistent with Univer Spreadsheet.

[Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0)

