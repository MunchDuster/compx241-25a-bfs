const games = new Map();

function Game(user1, user2) {
    // keep track of game by usernames
    // to allow for later quick-connect feature
    this.id = `game:${user1.name}-${user2.name}`;
    this.user1SocketId = user1.socketId;
    this.user2SocketId = user2.socketId;
    this.user1Board = {
        boats: []
    };
    this.delete = function() {
        games.delete(this.id);
    };
    this.userDisconnected = function(username, socketId) {
        console.log(`${username} disconnecting from game ${this.id}.`);

        // LATER: give 5-30s for user to reconnect incase accidental disconnect
        this.delete();
    };
    this.getOtherSocketId = function (user) {
        if (user.socketId == this.user1SocketId) return this.user2SocketId;
        if (user.socketId == this.user2SocketId) return this.user1SocketId;
        console.log('error: socket not in game!');
        console.trace();
        return null;
    };
    this.onPlacementSet

    console.log(`Starting game ${this.id} between ${user1.name} and ${user2.name}`);
    games.set(this.id, this);
}

Game.getById = function(id) {
    return games.get(id);
}

module.exports = Game;