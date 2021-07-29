import { io } from "socket.io-client";

const SOCKET_SERVER_URL = "http://192.168.1.44:4000";
const NEW_MOVE_EVENT = "newGameMove"; // Name of the event
const GAME_MOVE_REFUSAL = "badGameMove";
const NEW_PLAYER_EVENT = "newPlayer";
const PLAY_AGAIN_EVENT = "playAgain";
const NEW_GAME_EVENT = "newGame";
const LOAD_GAME_EVENT = "loadGame";

export default class GameSocket {
	constructor(username, onNewMoveCallback, onNewPlayerCallback, onBadMoveCallback, onLoadGameCallback, onPlayAgainCallback) {

		// Creates a WebSocket connection
		const socket = io(SOCKET_SERVER_URL, {
			query: { username },
			reconnectionDelayMax: 10000
		});

		this.state = {
			socket: socket
		}

		// Listens for incoming game moves
		socket.on(NEW_MOVE_EVENT, square => onNewMoveCallback(square));
		socket.on(NEW_PLAYER_EVENT, player => onNewPlayerCallback(player));
		socket.on(GAME_MOVE_REFUSAL, badMove => onBadMoveCallback(badMove));
		socket.on(LOAD_GAME_EVENT, squares => onLoadGameCallback(squares));
		socket.on(PLAY_AGAIN_EVENT, () => onPlayAgainCallback());
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
