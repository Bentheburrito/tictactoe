import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

import { AmplifyAuthenticator, AmplifySignUp, AmplifySignOut } from '@aws-amplify/ui-react';
import { createGame, deleteGame } from "./graphql/mutations";
import { listGames } from "./graphql/queries";

import Amplify, { API, graphqlOperation, Auth, Hub } from "aws-amplify";
import awsExports from "./aws-exports";
Amplify.configure({
	...awsExports,
	Analytics: { 
		disabled: true
	}
})


function Square(props) {
	return (
	  <button className="square" onClick={props.onClick}>
		{props.value}
	  </button>
	);
}


class SaveGameField extends React.Component {
	constructor(props) {
		super(props);
		this.state = {value: '', onSave: props.onSave};
		this.handleChange = this.handleChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}
	
	handleChange (event) {
		this.setState({ value: event.target.value });
	}
	  
	handleSubmit (event) {
		event.preventDefault();
		this.state.onSave(this.state.value);
		
		this.setState({
			...this.state,
			value: ''
		});
	}

	render() {
		return (
			<form onSubmit={this.handleSubmit}>
				<label type="reset">
					<input id="savegame" type="text" onChange={this.handleChange} value={this.state.value} placeholder="New Game" />
				</label>
				<input type="submit" value="Save Game" />
			</form>
		)
	};
}

function ListGameButton(props) {
	return (
	  <button className="list" onClick={props.onClick}>
		{props.value}
	  </button>
	);
}

class Board extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			squares: Array(9).fill(null),
			xIsNext: true,
			gameList: [],
			user: props.user
		};
	}

	handleClick (i) {
		const squares = this.state.squares.slice();
		if (calculateWinner(squares) || squares[i]) {
			return;
		}
		
		squares[i] = this.state.xIsNext ? 'X' : 'O';
		this.setState({
			squares: squares,
			xIsNext: !this.state.xIsNext,
			gameList: this.state.gameList,
			user: this.state.user
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

	loadGame (squares) {
		const numNulls = squares.reduce((acc, square) => square == null ? acc += 1 : acc, 0);
		this.setState({
			...this.state,
			xIsNext: numNulls % 2 === 0 ? false : true,
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
			status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
		}

		return (
			<div>
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
				<h4>Saved Games (Click 'List Games' above to fetch your saved games):</h4>
				{this.renderGameList()}
			</div>
		);
	}
}

class Game extends React.Component {
	constructor(props) {
		super(props);
		this.state = { user: props.user }
	}

	render () {
		return (
			<div className="game">
				<div className="game-board">
					<Board user={this.state.user} />
				</div>
				<div className="game-info">
					<div>{/* status */}</div>
					<ol>{/* TODO */}</ol>
				</div>
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

// ========================================

function AuthGame() {
	const [user, updateUser] = React.useState(null);
	React.useEffect(() => {
	  Auth.currentAuthenticatedUser()
		.then(user => updateUser(user))
		.catch(() => console.log('No signed in user.'));
	  Hub.listen('auth', data => {
		switch (data.payload.event) {
		  case 'signIn':
			return updateUser(data.payload.data);
		  case 'signOut':
				return updateUser(null);
			default:
				break;
		}
	  });
	}, [])
	if (user) {
	  return (
		<div>
			  <h1>Hello {user.username}</h1>
			  <Game user={user}/>
		  <AmplifySignOut />
		</div>
	  )
	}
	return (
	  <div style={{ display: 'flex', justifyContent: 'center' }}>
		<AmplifyAuthenticator>
		  <AmplifySignUp
			slot="sign-up"
			formFields={[
				{ type: "username" },
				{ type: "name" },
			  {
				type: "password",
				label: "Password",
				placeholder: "custom password placeholder"
			  },
			  { type: "email" }
			]} 
		  />
		</AmplifyAuthenticator>
	  </div>
	);
  }

ReactDOM.render(
	<AuthGame/>,
	document.getElementById('root')
);
