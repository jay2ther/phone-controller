// Make sure this is your actual Render URL!
const ws = new WebSocket('wss://my-party-server-9xm3.onrender.com');

// --- 1. AUTO-FILL LOGIN MEMORY ---
window.onload = () => {
    const savedName = localStorage.getItem("playerName");
    const savedCode = localStorage.getItem("roomCode");
    
    // If they have played before, fill the text boxes for them
    if (savedName && savedCode) {
        document.getElementById('playerName').value = savedName;
        document.getElementById('roomCode').value = savedCode;
    }
};

// --- 2. LISTEN FOR GODOT'S WHISPERS ---
ws.onmessage = (event) => {
    let data;
    try { data = JSON.parse(event.data); } catch (e) { return; }
    
    // When Godot hands us our money from the Bank
    if (data.action === "profile_loaded") {
        // Update the Bank text
        document.getElementById('bankText').innerText = "Bank: $" + data.currency;
        
        // Restrict the slider so they can't bet more than they have
        document.getElementById('betSlider').max = data.currency;
        
        // Welcome them by name
        const playerName = localStorage.getItem("playerName");
        document.getElementById('statusText').innerText = "Welcome, " + playerName + "!";
        
        // Swap from the Login screen to the Betting screen
        document.getElementById('login').style.display = 'none';
        document.getElementById('bettingScreen').style.display = 'block';
    }
};

// --- 3. JOIN THE GAME ---
function joinGame() {
    const nameInput = document.getElementById('playerName').value;
    const codeInput = document.getElementById('roomCode').value.toUpperCase();
    
    if (nameInput && codeInput) {
        // Save their info into the browser's permanent memory
        localStorage.setItem("playerName", nameInput);
        localStorage.setItem("roomCode", codeInput);
        
        // Send the join request to the cloud
        ws.send(JSON.stringify({
            action: "join_room",
            room_code: codeInput,
            name: nameInput
        }));
        
    } else {
        alert("Please enter a name and room code!");
    }
}

// --- 4. BETTING LOGIC ---

// Updates the giant text number as you drag the slider
function updateBetDisplay() {
    const sliderValue = document.getElementById('betSlider').value;
    document.getElementById('betDisplay').innerText = "$" + sliderValue;
}

// Sends the bet to Godot and transitions to the Waiting screen
function placeBet() {
    const betAmount = document.getElementById('betSlider').value;
    const myName = localStorage.getItem("playerName"); // NEW: Grab their name!
    
    // Send the name AND the amount
    ws.send(JSON.stringify({
        action: "player_input",
        payload: { 
            action: "place_bet", 
            amount: parseInt(betAmount),
            name: myName
        }
    }));
    
    // Hide the slider, show the waiting message
    document.getElementById('bettingScreen').style.display = 'none';
    document.getElementById('waitingScreen').style.display = 'block';
}
