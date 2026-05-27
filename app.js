// Connect to the Middleman running locally on your PC
const ws = new WebSocket('wss://my-party-server-9xm3.onrender.com');

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

// Triggered by the BUZZ button
function sendPing() {
    ws.send(JSON.stringify({
        action: "button_press",
        payload: { action: "ping" }
    }));
}
