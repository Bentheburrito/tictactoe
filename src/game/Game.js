import React from 'react';

import { Board } from './Board';

export class Game extends React.Component {
	constructor(props) {
		super(props);
		this.state = { user: props.user }
	}

	render () {
		return (
			<div className="game" style={{justifyContent: "center"}}>
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