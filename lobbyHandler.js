// should not contain any socket events handling, make callbacks for socketHandler to do that

const Game = require('./game.js');
const User = require('./user.js');

function LobbyHandler(user, logError, onJoinedLobby, onGameRequested, onJoinGame) {
    this.joinLobby = (newUsername, callback) => {
        // Check if username is valid and not already taken
        if (!User.isValidName(newUsername, logError)) {
            logError('Invalid username. Must be 3-16 letters with no spaces.');
            callback({success: false});
            return;
        }

        // // Check for duplicate usernames
        // if (User.getIdByName(newUsername) != null) {
        //     logError('Username already taken. Please choose another.');
        //     callback({success: false});
        //     return;
        // }
        // Check for duplicate usernames
        if(User.getAllFinding().includes(newUsername)) {
            logError('Username already taken. Please choose another.');
            callback({success: false});
            return;
        }
        

        // Update user state to indicate they are searching for a game
        user.name = newUsername;
        user.isFinding = true;
        console.log(`${user.toString()} is finding.`);
        callback({success: true});

        // Add user to relevant rooms
        onJoinedLobby()
    };
    this.rejoinLobby = (username, callback) => {
        // Update user state to indicate they are searching for a game
        user.name = username;
        user.isFinding = true;
        console.log(`${user.toString()} is finding.`);
        callback({success: true});

        // Add user to relevant rooms
        onJoinedLobby()
    }
    this.requestGame = (requesteeUsername) => {
        console.log(`${user.name} requesting game with ${requesteeUsername}`);

        let requesteeSocketId = User.getIdByName(requesteeUsername);

        // Check if the requestee is valid and available for a game
        if (!requesteeSocketId) {
            logError(`User '${requesteeUsername}' not found or is not available.`);
            return;
        }

        onGameRequested(requesteeSocketId);
    };
    this.joinGame = (requesterUsername) => {
        // Get the user who reqeusted the game
        let requesterUser = User.getByName(requesterUsername);

        // Validate both players are still available and finding
        if (!user.isFinding || !requesterUser?.isFinding) {
            logError(`User '${requesteeUsername}' does not exist or is not finding a game.`);
            return;
        }

        const game = new Game(user, requesterUser, logError);

        // tell the users
        user.joinGame(game.id);
        requesterUser.joinGame(game.id);

        // tell the socketHandlers
        onJoinGame(requesterUser, game, false);
    };
}

module.exports = LobbyHandler;
