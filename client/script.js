const socket = io();

socket.on('connect', function() {
    console.log('connected');
});

socket.on('disconnect', function() {
	console.log('disconnected');
});