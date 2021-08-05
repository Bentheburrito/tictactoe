import { io } from "socket.io-client";

import { SOCKET_SERVER_URL, NEW_MOVE_EVENT, PLAY_AGAIN_EVENT, NEW_GAME_EVENT } from "./constants";

export default class GameSocket {
	constructor(username, onEventCallback) {

		// Creates a WebSocket connection
		const socket = io(SOCKET_SERVER_URL, {
			path: "/tictactoe/server",
			query: { username },
			reconnectionDelayMax: 10000
		});

		this.state = {
			socket: socket
		}
		console.log(socket);
		// Listens for incoming game events
		socket.onAny((eventName, ...data) => onEventCallback(eventName, ...data));
	}

	// Sends a move to the server that forwards it to the other user
	sendMove = (square) => {
		this.state.socket.emit(NEW_MOVE_EVENT, {
			square,
			senderId: this.state.socket.id,
		});
	};

	playAgain = () => {
		this.state.socket.emit(PLAY_AGAIN_EVENT);
	}

	newGame = () => {
		this.state.socket.emit(NEW_GAME_EVENT);
	}
};
