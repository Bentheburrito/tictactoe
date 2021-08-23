import React from 'react';

import { createGame, deleteGame } from "../graphql/mutations";
import { listGames } from "../graphql/queries";

import { API, graphqlOperation, } from "aws-amplify";

import { SaveGameField, ListGameButton } from './GamePersistence';

import GameSocket from "./GameSocket";

import { Board, calculateWinner } from './Board';
import { NEW_MOVE_EVENT, GAME_MOVE_REFUSAL, NEW_PLAYER_EVENT, PLAY_AGAIN_EVENT, LOAD_GAME_EVENT, REQ_LOAD_SAVED_GAME_EVENT, ACC_LOAD_SAVED_GAME_EVENT, REJ_LOAD_SAVED_GAME_EVENT } from './constants';

export class Game extends React.Component {
	constructor(props) {
		super(props);

		const eventFunctionMap = {
			[NEW_MOVE_EVENT]: this.handleMove.bind(this),
			[GAME_MOVE_REFUSAL]: this.handleBadMove.bind(this),
			[NEW_PLAYER_EVENT]: this.handlePlayer.bind(this),
			[PLAY_AGAIN_EVENT]: this.handlePlayAgainRequest.bind(this),
			[LOAD_GAME_EVENT]: this.loadGame.bind(this),
			[REQ_LOAD_SAVED_GAME_EVENT]: this.handleLoadGameRequest.bind(this),
			[ACC_LOAD_SAVED_GAME_EVENT]: this.handleLoadGameAccept.bind(this),
			[REJ_LOAD_SAVED_GAME_EVENT]: this.handleLoadGameReject.bind(this),
		};

		this.state = {
			mainBoard: new Board({ onClick: i => this.handleClick(i) }),
			squares: Array(9).fill(null),
			xIsNext: true,
			user: { ...props.user, isPlayerX: null },
			opponentName: null,
			gameList: [],
			playAgainRequest: false,
			loadGameRequest: null,
			gameSocket: new GameSocket(props.user.username, (event, data) => this.handleGameEvent(event, data)),
			eventFunctionMap: eventFunctionMap,
		}
		this.handleList();
	}

	handleClick (i) {
		const squares = this.state.squares.slice();
		if (calculateWinner(squares) || squares[i] || this.state.user.isPlayerX !== this.state.xIsNext) {
			return;
		}
		
		this.state.gameSocket.sendMove(i);
		squares[i] = this.state.xIsNext ? 'X' : 'O';
		this.setState({
			...this.state,
			squares,
			xIsNext: !this.state.xIsNext,
		});
	}

	handleGameEvent (event, data) {
		const handler = this.state.eventFunctionMap[event];
		if (handler) {
			handler(data);
		} else {
			console.log('Unknown event:', event);
			console.log('Passed message:', data);
		}
	}

	async handleSave (gameName) {
		
		const input = { name: gameName, squares: this.state.squares, username: this.state.user.username }
		await API.graphql(graphqlOperation(createGame, { input }));
		this.handleList()
	}

	async handleList () {

		const filter = { username: { eq: this.state.user.username } }
		let result = await API.graphql(graphqlOperation(listGames, { filter }));
		console.log(result.data.listGames.items)
		this.setState({
			...this.state,
			gameList: result.data.listGames.items
		})
	}

	handleMove (square) {
		if (this.state.squares[square] !== null) return;
		const squares = this.state.squares.slice();
		squares[square] = this.state.xIsNext ? 'X' : 'O';
		this.setState({
			...this.state,
			squares,
			xIsNext: !this.state.xIsNext,
		});
	}

	handleBadMove (square) {
		console.log(`handleBadMove, square: ${square}`)
		if (this.state.squares[square] === null) return;

		const squares = this.state.squares.slice();
		squares[square] = null;
		this.setState({
			...this.state,
			squares,
			xIsNext: !this.state.xIsNext,
		});
	}

	handlePlayer ({ username, isPlayerX, squares }) {
		this.setState({
			...this.state,
			opponentName: username === this.state.user.username ? this.state.opponentName : username,
			user: { ...this.state.user, isPlayerX: username === this.state.user.username ? isPlayerX : !isPlayerX }
		});
		this.loadGame(squares)
	}

	handlePlayAgainRequest () {
		this.setState({
			...this.state,
			playAgainRequest: true
		});
	}

	handleLoadGameRequest (squares) {
		this.setState({
			...this.state,
			loadGameRequest: squares
		});
	}

	handleLoadGameAccept (squares) {
		this.setState({
			...this.state,
			loadGameRequest: null,
		});
		this.loadGame(squares);
	}

	handleLoadGameReject (squares) {
		this.setState({
			...this.state,
			loadGameRequest: `${this.state.opponentName} rejected your request to load a saved game.`,
		});
	}

	loadGame (squares) {
		const numNulls = squares.reduce((acc, square) => square == null ? acc += 1 : acc, 0);
		this.setState({
			...this.state,
			squares,
			xIsNext: numNulls % 2 === 0 ? false : true, // simplify this
			playAgainRequest: false
		});
	}

	async deleteGame (id) {
		const input = { id }
		await API.graphql(graphqlOperation(deleteGame, { input }));
		this.handleList();
	}

	renderGameList () {
		let games = [];

		for (const { id, name, squares } of this.state.gameList) {

			games.push(
				<div key={id}>
					{name}:
					<button onClick={() => this.state.gameSocket.loadGameRequest(squares)}>Load</button>
					<button onClick={() => this.deleteGame(id)}>Delete</button>
				</div>
			);
		}

		return (<div className="game-list">
			{games}
		</div>)
	}

	render () {
		const winner = calculateWinner(this.state.squares);
		let status;
		let newGameButton;
		let playAgainButton;
		if (winner) {
			status = 'Winner: ' + winner;
			newGameButton = <button onClick={() => this.state.gameSocket.newGame()}>New Game</button>;
			playAgainButton = <button onClick={() => this.state.gameSocket.playAgain()}>Play Again</button>;
		} else {
			const nextPlayerSymbol = this.state.xIsNext ? 'X' : 'O';
			const isNextPlayer = (nextPlayerSymbol === 'X' && this.state.user.isPlayerX) || (nextPlayerSymbol === 'O' && !this.state.user.isPlayerX) 
			const nextPlayer = `${isNextPlayer ? this.state.user.username : this.state.opponentName} (${nextPlayerSymbol})`;
			status = `Next player: ${nextPlayer}`;
		}

		return (
			<div className="game" style={{ justifyContent: "center", width: '100%' }}>
				
				<div className="game-board">
					<div className="opponentName">{this.state.opponentName ? `Playing with ${this.state.opponentName}` : "Waiting for player..."}</div>
					<div className="status">{status}</div>
					{newGameButton}
					{playAgainButton}
					{this.state.playAgainRequest ? <div>{this.state.opponentName} wants to play again</div> : null}
					<Board onClick={i => this.handleClick(i)} squares={this.state.squares} />
					{/* {this.state.mainBoard.render()} */}
				</div>
				<div className="game-info">
					<div className="save-button">
						<SaveGameField onSave={(event) => this.handleSave(event)}/>
					</div>
					<div className="list-button">
						<ListGameButton value="List Games" onClick={() => this.handleList()} />;
					</div>
					<h4>Saved Games:</h4>
					{this.renderGameList()}
				</div>
				<div>
					{Array.isArray(this.state.loadGameRequest) ?
						<div>
							{this.state.opponentName} is requesting to load one of their saved games:
							<Board onClick={() => null} squares={this.state.loadGameRequest} />
							<button onClick={() => this.state.gameSocket.loadGameAccept(this.state.loadGameRequest)}>Accept</button>
							<button onClick={() => {
								this.state.gameSocket.loadGameReject(this.state.loadGameRequest);
								this.setState({...this.state, loadGameRequest: null});
							}}>Reject</button>
						</div>
						: this.state.loadGameRequest
					}
				</div>
			</div>
		);
	}
}