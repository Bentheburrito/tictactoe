import React from 'react';

export class SaveGameField extends React.Component {
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


export function ListGameButton(props) {
	return (
	  <button className="list" onClick={props.onClick}>
		{props.value}
	  </button>
	);
}