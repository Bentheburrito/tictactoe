import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

import { Game } from './game/Game';

import { AmplifyAuthenticator, AmplifySignUp, AmplifySignOut } from '@aws-amplify/ui-react';

import Amplify, { Auth, Hub } from "aws-amplify";
import awsExports from "./aws-exports";
Amplify.configure({
	...awsExports,
	Analytics: { 
		disabled: true
	}
})

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
				<header className="container">
					<h1>Hello {user.username}</h1>
					<div style={{maxWidth: '40px'}}><AmplifySignOut /></div>
				</header>
				<Game user={user} />
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
				{
					type: "name",
					label: "Name",
					placeholder: "Enter your name"
				},
				{
					type: "password",
					label: "Password",
					placeholder: "Enter a strong password"
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
