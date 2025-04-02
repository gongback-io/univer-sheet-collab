import 'tsconfig-paths/register';

import express from 'express';
import {createServer} from 'http';
import {Server} from 'socket.io';
import {workbookStorage} from "./repo/WorkbookStorage";
import {startSocketServer} from "./server/socketServer";
import {startSyncServer} from "./server/syncServer";

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

startSocketServer(io);
startSyncServer();

io.on('connection', (socket) => {
    //..
});

const PORT = 3000;
server.listen(PORT);
