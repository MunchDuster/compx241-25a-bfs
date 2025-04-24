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
        requestButton.addEventListener('onclick', () => {
            socket.emit('request-game', findUsername);
        });
        div.appendChild(requestButton);
    }
});

socket.on('disconnect', function() {
	console.log('disconnected');
});