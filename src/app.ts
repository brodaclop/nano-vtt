import express, { Router } from 'express';
import expressWs from 'express-ws';


const app = express();
const inst = expressWs(app);

const router = Router();

app.use(express.json());
app.use(express.static('static'));

inst.app.ws('/api', (ws, req) => {
    ws.on('message', async msg => {
        const clients = (inst as any).getWss('/api').clients;
        // TODO: why can we receive different types here?
        const buffer = msg as Buffer;

        const mType = buffer.readUInt8(0);
        // TODO: there must be a better way to share constants, this is MessageType.JOIN_ROOM
        if (mType === 3) {
            const blob = new Blob([buffer as any]);
            const room = (await blob.slice(5).text()).split(' | ')[0];
            (ws as any).context = { room: room };
        }
        [...clients].filter(c => {
            const sameRoom = (ws as any).context?.room && c.context?.room === (ws as any).context.room;
            return sameRoom && c !== ws;
        }).forEach(c => c.send(msg));
    });
});

app.use('/', router);

export default app;