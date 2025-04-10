import 'tsconfig-paths/register';

import express from 'express';
import {createServer} from 'http';
import {Server} from 'socket.io';
import {workbookStorage} from "./repo/WorkbookStorage";
import {startSocketServer} from "./server/socketServer";
import {startSyncServer} from "./server/syncServer";
import sheetSyncer from "./model/SheetSyncer";

const app = express();
app.use(express.json());

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
app.post('/sheet/:docId', (req, res) => {

    // API server also executes the operation
    sheetSyncer.execOperation({
        docId: req.params.docId,
        collabId: 'SYSTEM',
        command: req.body.command
    }).then((result) => {
        console.log('execOperation', result);
        res.json(result);
    }).catch((err) => {
        console.error('execOperation error', err);
        res.status(500).json({error: 'Internal Server Error'});
    })
})

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
