import { io } from "socket.io-client";

import { SOCKET_SERVER_URL, NEW_MOVE_EVENT, PLAY_AGAIN_EVENT, NEW_GAME_EVENT, REQ_LOAD_SAVED_GAME_EVENT, ACC_LOAD_SAVED_GAME_EVENT, REJ_LOAD_SAVED_GAME_EVENT } from "./constants";

export default class GameSocket {
	constructor(username, onEventCallback) {

		// Creates a WebSocket connection
		const socket = io(process.env.NODE_ENV === "production" ? SOCKET_SERVER_URL : "http://192.168.1.44:4000", {
			path: process.env.NODE_ENV === "production" ? "/tictactoe/server" : "/socket.io",
			query: { username },
			reconnectionDelayMax: 10000
		});

		this.state = {
			socket: socket
		}

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

	loadGameRequest = squares => {
		this.state.socket.emit(REQ_LOAD_SAVED_GAME_EVENT, squares);
	}

	loadGameAccept = squares => {
		this.state.socket.emit(ACC_LOAD_SAVED_GAME_EVENT, squares);
	}

	loadGameReject = squares => {
		this.state.socket.emit(REJ_LOAD_SAVED_GAME_EVENT, squares);
	}
};
