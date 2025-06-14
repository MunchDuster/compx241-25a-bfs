// this script handles all of the pure User related functions and data
// there should be no socket handling here

const users = new Map();
let userNum = 0;

function User(socketId) {
    this.socketId = socketId;
    this.num = userNum++;
    this.name = null;
    this.gameId = null;
    this.isFinding = false;

    this.delete = function() {
        users.delete(socketId);
    };
    this.joinGame = function(gameId) {
        this.gameId = gameId;
        isFinding = false;
    };
    this.leaveGame = function() {
        console.log(`${this.name} leaving game ${this.gameId}.`);
        if (this.gameId == null) {
            console.log('error: trying to remove user ' + user.name + ':' + user.socketId + ' from game, user is not in game.');
            return;
        }
        this.gameId = null;
        // Player might want to go back to finding, or to main menu Client should decide
    };
    this.toString = function() {
        return (this.name ?? '[no_username]') + '@' + this.socketId;
    };

    users.set(socketId, this);
}

User.isValidName = function(username) {
    return typeof(username) == 'string' &&              // Ensure input is string type
        new RegExp('^[a-zA-Z]+$').test(username) &&     // Only letters allowed
        username.length > 2 &&                          // Minimum 3 characters
        username.length < 17;                           // Maximum 16 characters
}
User.getIdByName = function(name) {
    for (const [id, userEntry] of users.entries()) {
        if (userEntry.name === name) {
            return id;
        }
    }
    return null; // not found
}
User.getByName = function(name) {
    for (const [id, userEntry] of users.entries()) {
        if (userEntry.name === name) {
            return userEntry;
        }
    }
    return null; // not found
}
User.getById = function(id) {
    return users.get(id);
}
User.getAllFinding = function() {
    const findingUsers = [];
    for (const user of users.values()) {
        if (user.isFinding) {
            findingUsers.push(user.name);
        }
    }
    return findingUsers;
}

module.exports = User;