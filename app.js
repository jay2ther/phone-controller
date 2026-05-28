// Connect to the Middleman running locally on your PC
const ws = new WebSocket('wss://my-party-server-9xm3.onrender.com');

// NEW: When the page loads, check if they were already playing
window.onload = () => {
    const savedName = sessionStorage.getItem("playerName");
    const savedCode = sessionStorage.getItem("roomCode");
    
    // If memory exists, auto-fill the boxes!
    if (savedName && savedCode) {
        document.getElementById('playerName').value = savedName;
        document.getElementById('roomCode').value = savedCode;
    }
};

// NEW: The function that runs when they tap JOIN GAME
function joinGame() {
    const nameInput = document.getElementById('playerName').value;
    const codeInput = document.getElementById('roomCode').value.toUpperCase();
    
    if (nameInput && codeInput) {
        // NEW: Save their info into the browser's session memory
        sessionStorage.setItem("playerName", nameInput);
        sessionStorage.setItem("roomCode", codeInput);
        
        ws.send(JSON.stringify({
            action: "join_room",
            room_code: codeInput,
            name: nameInput
        }));
        
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
