import { DurableObject } from 'cloudflare:workers';
import { Buffer } from 'node:buffer';

// Worker
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.url.endsWith('/ws')) {
			// Expect to receive a WebSocket Upgrade request.
			// If there is one, accept the request and return a WebSocket Response.
			const upgradeHeader = request.headers.get('Upgrade');
			if (!upgradeHeader || upgradeHeader !== 'websocket') {
				return new Response('Worker expected Upgrade: websocket', {
					status: 426,
				});
			}

			if (request.method !== 'GET') {
				return new Response('Worker expected GET method', {
					status: 400,
				});
			}

			// Since we are hard coding the Durable Object ID by providing the constant name 'foo',
			// all requests to this Worker will be sent to the same Durable Object instance.
			let id = env.SESSIONS.idFromName('foo');
			let stub = env.SESSIONS.get(id);

			return stub.fetch(request);
		}

		return new Response(
			`Supported endpoints:
/websocket: Expects a WebSocket upgrade request`,
			{
				status: 200,
				headers: {
					'Content-Type': 'text/plain',
				},
			}
		);
	},
};

// Durable Object
export class VttSessions extends DurableObject {
	// Keeps track of all WebSocket connections
	sessions: Map<WebSocket, string> = new Map();
	rooms: Map<string, Array<WebSocket>> = new Map();

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.sessions = new Map();
	}

	async fetch(request: Request): Promise<Response> {
		// Creates two ends of a WebSocket connection.
		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		// Calling `accept()` tells the runtime that this WebSocket is to begin terminating
		// request within the Durable Object. It has the effect of "accepting" the connection,
		// and allowing the WebSocket to send and receive messages.
		server.accept();

		server.addEventListener('open', e => console.log('open', e));
		server.addEventListener('error', e => {
			this.handleConnectionClose(server);
		});

		server.addEventListener('message', (event) => {
			this.handleWebSocketMessage(server, event.data);
		});

		// If the client closes the connection, the runtime will close the connection too.
		server.addEventListener('close', () => {
			this.handleConnectionClose(server);
		});

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	async handleWebSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
		await this.processRoomJoinMessage(message as ArrayBuffer, ws);
		const room = this.sessions.get(ws)!;

		if (room) {
			this.getOthersInSameRoom(ws).forEach(target => {
				target.send(message);
			});
		}
	}

	async handleConnectionClose(ws: WebSocket) {
		console.log('leaving room', ws);
		this.leaveRoom(ws);
		ws.close(1000, 'Closing WebSocket');
	}

	getOthersInSameRoom = (ws: WebSocket): Array<WebSocket> => {
		const room = this.sessions.get(ws);
		if (room) {
			return this.rooms.get(room)!.filter(item => item !== ws);
		}
		return [];
	}

	processRoomJoinMessage = async (message: ArrayBuffer, ws: WebSocket) => {
		const buffer = Buffer.from(message);
		const fragNo = buffer.readUInt8(4);
		const fragCount = buffer.readUInt8(5);
		const mType = buffer.readUInt8(6);
		// TODO: there must be a better way to share constants, this is MessageType.JOIN_ROOM
		if (mType === 3 && fragNo === 0 && fragCount === 1) {
			const blob = new Blob([buffer]);
			const [room, name] = (await blob.slice(11).text()).split(' | ');

			console.log('joining room', room, name);
			this.sessions.set(ws, room);
			this.rooms.set(room, [...(this.rooms.get(room) ?? []), ws]);
		}
	}

	leaveRoom = (ws: WebSocket) => {
		const room = this.sessions.get(ws);
		if (room) {
			this.rooms.set(room, this.getOthersInSameRoom(ws))
			this.sessions.delete(ws);
		}

	}
}