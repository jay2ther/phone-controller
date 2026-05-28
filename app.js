// Connect to the Middleman running locally on your PC
const ws = new WebSocket('wss://my-party-server-9xm3.onrender.com');

// NEW: The function that runs when they tap JOIN GAME
function joinGame() {
    const nameInput = document.getElementById('playerName').value;
    const codeInput = document.getElementById('roomCode').value.toUpperCase();
    
    if (nameInput && codeInput) {
        // Send the name and code to the cloud
        ws.send(JSON.stringify({
            action: "join_room",
            room_code: codeInput,
            name: nameInput
        }));
        
        // Hide the login screen, show the buttons
        document.getElementById('login').style.display = 'none';
        document.getElementById('gameplay').style.display = 'block';
        document.getElementById('statusText').innerText = "Welcome, " + nameInput + "!";
    } else {
        alert("Please enter a name and room code!");
    }
}

// Keep your existing sendCommand(cmd) function down here...
function sendCommand(cmd) {
    ws.send(JSON.stringify({
        action: "button_press",
        payload: { action: cmd }
    }));
}

// When we successfully connect to the server...
ws.onopen = () => {
    console.log("Connected to the Traffic Cop!");
};

// When the server talks back to us...
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("Server says:", data);

    if (data.action === "joined") {
        // Success! Hide the login screen, show the big red button
        document.getElementById("setup").style.display = "none";
        document.getElementById("gameplay").style.display = "block";
    } 
    else if (data.action === "error") {
        // The server rejected us (e.g., wrong code)
        alert("Error: " + data.message); 
    }
};

// Triggered by the CONNECT button
function joinRoom() {
    const code = document.getElementById("roomCode").value;
    const name = document.getElementById("playerName").value;

    // Send a JSON text envelope to the server asking to join
    ws.send(JSON.stringify({
        action: "join_room",
        room_code: code,
        name: name
    }));
}

// Send whatever command the button triggers
function sendCommand(cmd) {
    ws.send(JSON.stringify({
        action: "button_press",
        payload: { action: cmd }
    }));
}
