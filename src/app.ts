import express, { Router } from 'express';
import expressWs from 'express-ws';


const app = express();
const inst = expressWs(app);

const router = Router();

app.use(express.json());
app.use(express.static('static'));

inst.app.ws('/api', (ws, req) => {
    ws.on('message', msg => {
        const clients = (inst as any).getWss('/api').clients;
        [...clients].filter(c => c !== ws).forEach(c => c.send(msg));
    });
});

app.use('/', router);

export default app;