function addMessageChatHistory (username, message) {
	$("#chatroom").append($('<p>').text(message).prepend($('<strong>').text(username+': ')));
}

var urlTokens = document.URL.split("/");
var roomID = urlTokens.pop();
var userType = urlTokens.pop();
var userIsPresenter;

if (userType === "p") 
	userIsPresenter = true;
else
	userIsPresenter = false;

var username = "Anonymous";

$(document).ready(function() {
	var socket = io();

	$("#title").text("Loading room info...");
	
	socket.on("connect", function () {
		if (!userIsPresenter) {
			username = prompt("Enter your name to join the room");
			if (username === null)
				username = "Anonymous";
		}
	});

	socket.emit("req-room-info", {roomID: roomID});

	socket.on("res-room-info", function(roomData) {
		$("#title").text("Welcome to " + roomData.name);
		if (userIsPresenter)
			username = roomData.instructorName;
		socket.emit("add-to-room", {roomID: roomID, username: username, userIsPresenter: userIsPresenter});
	});

	socket.on("update", function (data) {
		$("#attendees").empty();
		for (var i = 0; i < data.length; i++) {

			var user = data[i];
			var htmlStr = "<p>" + user.name + " - " + ((user.isPresenter) ? "presenter" : "attendee");

			if (user.handRaised)
				htmlStr = htmlStr + '<img href="/img/hand.png" height="64" width="64">';

			$("#attendees").append(htmlStr + "</p>");
		}
	});

	socket.on("chat-receive-message", function (data) {
		addMessageChatHistory(data.username, data.message);
	});

	// adding a keypress event handler on chat textbox.
	$("#chat_box").keypress(function (e) {

		// check if user type enter.
		if (event.which == 13) {

			// parsing the room ID.
			var roomID = location.pathname.split("/")[3];

			// getting the message from the text box.
			var data = {
				roomID : roomID,
				username : username, 
				message : $("#chat_box").val()
			};			

			// emmit the message
			socket.emit("chat-send-message", data);

			// upload the message for the user that send the message.
			//addMessageChatHistory(socket.id, data.message);
			
			// cleaning the message text box.
			$("#chat_box").val("");
		}
	});

	$("#raisehand").on("click", function() {
		socket.emit("toggle-hand", {roomID: roomID});
		$(this).toggleClass("hand-raised");
	});
});