import { io } from "socket.io-client";

const SOCKET_SERVER_URL = "http://192.168.1.44:4000";
const NEW_GAME_MOVE_EVENT = "newGameMove"; // Name of the event
const GAME_MOVE_REFUSAL = "badGameMove";
const NEW_PLAYER_EVENT = "newPlayer";

export default class GameSocket {
	constructor(username, onNewMoveCallback, onNewPlayerCallback, onBadMoveCallback) {

		// Creates a WebSocket connection
		const socket = io(SOCKET_SERVER_URL, {
			query: { username },
			reconnectionDelayMax: 10000
		});

		this.state = {
			socket: socket
		}

		// Listens for incoming game moves
		socket.on(NEW_GAME_MOVE_EVENT, square => onNewMoveCallback(square));
		socket.on(NEW_PLAYER_EVENT, player => onNewPlayerCallback(player));
		socket.on(GAME_MOVE_REFUSAL, badMove => onBadMoveCallback(badMove));
	}
	// Sends a move to the server that forwards it to the other user
	sendMove = (square) => {
		this.state.socket.emit(NEW_GAME_MOVE_EVENT, {
			square,
			senderId: this.state.socket.id,
		});
	};
};
