const games = new Map();
let gameCount = 0;

function Game(user1, user2) {
    this.id = gameCount++;
    // keep track of game by usernames
    // to allow for later quick-connect feature
    this.name = `game:${user1.name}-${user2.name}`;
    this.user1SocketId = user1.socketId;
    this.user2SocketId = user2.socketId;
    this.user1Board = {
        boats: []
    };
    this.delete = function() {
        games.delete(this.id);
    };
    this.userDisconnected = function(username, socketId) {
        console.log(`${username} disconnecting from game ${gameRoom}.`);

        // LATER: give 5-30s for user to reconnect incase accidental disconnect
        this.delete();
    };
    this.onPlacementSet

    console.log(`Starting game ${this.id} between ${user1.name} and ${user2.name}`);
    games.set(this.id, this);
}

module.exports = Game;