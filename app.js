// 1. CONNECT TO THE CLOUD
const ws = new WebSocket('wss://my-party-server-9xm3.onrender.com');

// 2. AUTO-FILL LOGIN MEMORY (CRASH-PROOFED)
window.onload = () => {
    try {
        const savedName = localStorage.getItem("playerName");
        const savedCode = localStorage.getItem("roomCode");
        
        if (savedName && savedCode) {
            document.getElementById('playerName').value = savedName;
            document.getElementById('roomCode').value = savedCode;
        }
    } catch (e) {
        console.log("Browser blocked memory read, but buttons will still work!");
    }
};

// 3. LISTEN FOR GODOT'S WHISPERS
ws.onmessage = (event) => {
    let data;
    try { data = JSON.parse(event.data); } catch (e) { return; }
    
    // When Godot hands us our money from the Bank
    if (data.action === "profile_loaded") {
        document.getElementById('bankText').innerText = "Bank: $" + data.currency;
        document.getElementById('betSlider').max = data.currency;
        
        const playerName = localStorage.getItem("playerName");
        document.getElementById('statusText').innerText = "Welcome, " + playerName + "!";
        
        // Swap to the Betting screen
        document.getElementById('login').style.display = 'none';
        document.getElementById('bettingScreen').style.display = 'block';
    }
};

// 4. JOIN THE GAME (BULLETPROOF VERSION)
function joinGame() {
    const nameInput = document.getElementById('playerName').value;
    const codeInput = document.getElementById('roomCode').value.toUpperCase();
    
    if (nameInput && codeInput) {
        // Safety Check: Is the server actually awake yet?
        if (ws.readyState !== WebSocket.OPEN) {
            alert("Still connecting to the cloud... please try again in 2 seconds!");
            return; 
        }

        // Safety Check: Save memory (Wrapped in try/catch for strict private browsers)
        try {
            localStorage.setItem("playerName", nameInput);
            localStorage.setItem("roomCode", codeInput);
        } catch (e) {
            console.log("Private browsing blocking save.");
        }
        
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

// 5. BETTING LOGIC

// Updates the giant text number as you drag the slider
function updateBetDisplay() {
    const sliderValue = document.getElementById('betSlider').value;
    document.getElementById('betDisplay').innerText = "$" + sliderValue;
}

// Sends the bet to Godot and transitions to the Waiting screen
function placeBet() {
    const betAmount = document.getElementById('betSlider').value;
    const myName = localStorage.getItem("playerName");
    
    // Send the name AND the amount
    ws.send(JSON.stringify({
        action: "button_press",   // <--- THIS WAS THE BUG! Change this back to button_press!
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
