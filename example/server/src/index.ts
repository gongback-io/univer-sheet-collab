import {GongbackCollabServer} from "@gongback/univer-sheet-collab-server";

import {LocaleType} from "@univerjs/core";
import 'tsconfig-paths/register';

import {WorkbookModel} from "./model/WorkbookModel";
import express from 'express';
import {createServer} from 'http';
import {Server} from 'socket.io';
import {workbookStorage} from "./repo/WorkbookStorage";
import {opStorage} from "./repo/OpStorage";


const app = express();
const server = createServer(app);
app.all("*", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "*");
    next();
});
app.get('/', (req, res) => {
    res.send('Hello Univer Collaborative Sheet!');
});
app.get('/sheet/:docId', (req, res) => {
    const docId = req.params.docId;
    workbookStorage.selectWorkbooks(docId).then((sheet) => {
        console.log('getSheetsData', sheet);
        res.json(sheet);
    })
});

const io = new Server(server, {
    cors: {
        origin: "*",
    },
});
const gongbackCollabServer = new GongbackCollabServer(io, {
    workbookStorage,
    opStorage,
    initialSheetData: {
        locale: LocaleType.EN_US
    },
    workbookFactory: (docId)=> new WorkbookModel(docId)
});
gongbackCollabServer.listen();

io.on('connection', (socket) => {
    //..
});

const PORT = 3000;
server.listen(PORT);
