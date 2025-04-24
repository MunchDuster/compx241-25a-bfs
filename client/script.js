const socket = io();
const startmenu = document.getElementById('start-menu');
const findmenu = document.getElementById('find-menu');
const findListContainer = document.getElementById('find-list');
let username = null;

socket.on('connect', function() {
    console.log('connected');
});

function find() {
    username = prompt('enter user name:');
    socket.emit('find', username);
    startmenu.classList.add('hidden');
    findmenu.classList.remove('hidden');
}
socket.on('error', (message) => {
    alert(message);
})
socket.on('find-results', (usersFinding) => {
    console.log('find results are: ', usersFinding);
    findListContainer.innerHTML = ''; // clears container
    for (let findUsername of usersFinding) {
        if (findUsername == username) { // dont show self
            continue;
        }
        const div = document.createElement('div');
        div.innerText = findUsername;
        div.id = findUsername + '-list-item';
        div.classList.add('find-result');
        findListContainer.appendChild(div);

        const requestButton = document.createElement('button');
        requestButton.classList.add('request-game-button');
        requestButton.innerText = 'Request';
        requestButton.addEventListener('click', () => {
            console.log('requesting game with ' + findUsername);
            socket.emit('request-game', findUsername);
        });
        div.appendChild(requestButton);
    }
});
socket.on('requested-game', (requesterUsername) => {
    const listItem = document.getElementById(requesterUsername + '-list-item');
    if (!listItem) {
        alert('requested game from ' + requesterUsername + ', user is not in requester list, try refreshing?');
        return;
    }

    const alreadyAskedJoin = listItem.getAttribute('has-requested-join');
    if (alreadyAskedJoin) {
        // TODO: play some ping sound/animation to show re-asking join
        return;
    }

    listItem.setAttribute('has-requested-join', true);

    const joinButton = document.createElement('button');
    joinButton.innerText = 'Join';
    joinButton.classList.add('join-button');
    joinButton.addEventListener('click', () => {
        socket.emit('join', requesterUsername);
    });
    listItem.appendChild(joinButton);
});

socket.on('disconnect', function() {
	console.log('disconnected');
});