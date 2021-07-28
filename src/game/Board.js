import React from 'react';

import { createGame, deleteGame } from "../graphql/mutations";
import { listGames } from "../graphql/queries";

import { API, graphqlOperation, } from "aws-amplify";

import { SaveGameField, ListGameButton } from './GamePersistence';
import GameSocket from "./GameSocket";

function Square (props) {
	return (
	  <button className="square" onClick={props.onClick}>
		{props.value}
	  </button>
	);
}

export class Board extends React.Component {
	constructor(props) {
		super(props);
		
		this.state = {
			squares: Array(9).fill(null),
			xIsNext: true,
			user: { ...props.user, isPlayerX: null },
			opponentName: null,
			gameList: [],
			gameSocket: new GameSocket(props.user.username, (square) => this.handleMove(square), (player) => this.handlePlayer(player), (square) => this.handleBadMove(square))
		};
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
			squares: squares,
			xIsNext: !this.state.xIsNext,
		});
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
		console.log(`handleMove, square: ${square}`)
		console.log(square)
		if (this.state.squares[square] !== null) return;
		const squares = this.state.squares.slice();
		squares[square] = this.state.xIsNext ? 'X' : 'O';
		this.setState({
			...this.state,
			squares: squares,
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
			squares: squares,
			xIsNext: !this.state.xIsNext,
		});
	}

	handlePlayer ({ username, isPlayerX, squares }) {
		console.log("handlePlayer, username: " + username + " isPlayerX: " + isPlayerX + " squares: ");
		console.log(squares)
		this.setState({
			...this.state,
			opponentName: username === this.state.user.username ? this.state.opponentName : username,
			user: { ...this.state.user, isPlayerX: username === this.state.user.username ? isPlayerX : !isPlayerX }
		});
		this.loadGame(squares)
	}

	loadGame (squares) {
		const numNulls = squares.reduce((acc, square) => square == null ? acc += 1 : acc, 0);
		this.setState({
			...this.state,
			xIsNext: numNulls % 2 === 0 ? false : true, // simplify this
			squares: squares
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
					<button onClick={() => this.loadGame(squares)}>Load</button>
					<button onClick={() => this.deleteGame(id)}>Delete</button>
				</div>
			);
		}

		return (<div className="game-list">
			{games}
		</div>)
	}
	
	renderSquare (i) {
		return <Square value={this.state.squares[i]} onClick={() => this.handleClick(i)} />;
	}

	render () {
		const winner = calculateWinner(this.state.squares);
		let status;
		if (winner) {
			status = 'Winner: ' + winner;
		} else {
			const nextPlayerSymbol = this.state.xIsNext ? 'X' : 'O';
			const isNextPlayer = (nextPlayerSymbol === 'X' && this.state.user.isPlayerX) || (nextPlayerSymbol === 'O' && !this.state.user.isPlayerX) 
			const nextPlayer = `${isNextPlayer ? this.state.user.username : this.state.opponentName} (${nextPlayerSymbol})`;
			status = `Next player: ${nextPlayer}`;
		}

		return (
			<div>
				<div className="opponentName">{this.state.opponentName ? `Playing with ${this.state.opponentName}` : "Waiting for player..."}</div>
				<div className="status">{status}</div>
				<div className="board-row">
					{this.renderSquare(0)}
					{this.renderSquare(1)}
					{this.renderSquare(2)}
				</div>
				<div className="board-row">
					{this.renderSquare(3)}
					{this.renderSquare(4)}
					{this.renderSquare(5)}
				</div>
				<div className="board-row">
					{this.renderSquare(6)}
					{this.renderSquare(7)}
					{this.renderSquare(8)}
				</div>
				<div className="save-button">
					<SaveGameField onSave={(event) => this.handleSave(event)}/>
				</div>
				<div className="list-button">
					<ListGameButton value="List Games" onClick={() => this.handleList()} />;
				</div>
				<h4>Saved Games:</h4>
				{this.renderGameList()}
			</div>
		);
	}
}

function calculateWinner(squares) {
	const lines = [
		[0, 1, 2],
		[3, 4, 5],
		[6, 7, 8],
		[0, 3, 6],
		[1, 4, 7],
		[2, 5, 8],
		[0, 4, 8],
		[2, 4, 6],
	];
	let isDraw = 'Draw';
	for (let i = 0; i < lines.length; i++) {
		const [a, b, c] = lines[i];
		
		if ([squares[a], squares[b], squares[c]].includes(null)) isDraw = null;

		if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
			return squares[a];
		}
	}
	return isDraw;
}