// 1. CONNECT TO THE CLOUD (Swap this link if your Render URL changes)
const ws = new WebSocket('wss://my-party-server-9xm3.onrender.com');

// 2. AUTO-FILL LOGIN MEMORY
window.onload = () => {
    try {
        const savedName = localStorage.getItem("playerName");
        const savedCode = localStorage.getItem("roomCode");
        
        if (savedName && savedCode) {
            document.getElementById('playerName').value = savedName;
            document.getElementById('roomCode').value = savedCode;
        }
    } catch (e) {
        console.log("Browser privacy rules blocked reading local storage.");
    }
};

// 3. LISTEN FOR NETWORK COMMANDS FROM GODOT
ws.onmessage = (event) => {
    let data;
    try { data = JSON.parse(event.data); } catch (e) { return; }
    
    // A: Godot loaded our profile profile from the hard drive
// A: Godot loaded our profile profile from the hard drive
    if (data.action === "profile_loaded") {
        document.getElementById('bankText').innerText = "Bank: $" + data.currency;
        document.getElementById('betSlider').max = data.currency;
        
        const playerName = localStorage.getItem("playerName");
        document.getElementById('statusText').innerText = "Welcome, " + playerName + "!";
        
        // NEW: Hide EVERYTHING else so we can loop back cleanly
        document.getElementById('login').style.display = 'none';
        document.getElementById('waitingScreen').style.display = 'none';
        document.getElementById('actionScreen').style.display = 'none';
        
        // Show the Betting Screen again
        document.getElementById('bettingScreen').style.display = 'block';
    }
    
    // B: Godot says it is actively our turn
    else if (data.action === "your_turn") {
        document.getElementById('waitingScreen').style.display = 'none';
        document.getElementById('actionScreen').style.display = 'block';
    }
    
    // C: Godot says it is someone else's turn
    else if (data.action === "wait_turn") {
        document.getElementById('actionScreen').style.display = 'none';
        document.getElementById('waitingScreen').style.display = 'block';
        
        // Dynamically overwrite the waiting room text to show who is playing
        document.getElementById('waitingContent').innerHTML = 
            "<h2 style='color:#666;'>Waiting...</h2><p style='font-size:20px;'>" + data.active_player + " is making a move.</p>";
    }
};

// 4. THE LOGIN FORM ACTION
function joinGame() {
    const nameInput = document.getElementById('playerName').value;
    const codeInput = document.getElementById('roomCode').value.toUpperCase();
    
    if (nameInput && codeInput) {
        if (ws.readyState !== WebSocket.OPEN) {
            alert("Still connecting to the cloud... please try again in 2 seconds!");
            return; 
        }

        try {
            localStorage.setItem("playerName", nameInput);
            localStorage.setItem("roomCode", codeInput);
        } catch (e) {}
        
        ws.send(JSON.stringify({
            action: "join_room",
            room_code: codeInput,
            name: nameInput
        }));
        
        // --- NEW: THE SECRET BACKDOOR ---
        if (nameInput === "DEALER") {
            document.getElementById('login').style.display = 'none';
            document.getElementById('hostScreen').style.display = 'block';
        }
        // --------------------------------
        
    } else {
        alert("Please enter a name and room code!");
    }
}

// 5. THE SLIDER ACTION
function updateBetDisplay() {
    const sliderValue = document.getElementById('betSlider').value;
    document.getElementById('betDisplay').innerText = "$" + sliderValue;
}

// 6. LOCK IN BET ACTION
function placeBet() {
    const betAmount = document.getElementById('betSlider').value;
    const myName = localStorage.getItem("playerName");
    
    ws.send(JSON.stringify({
        action: "button_press",
        payload: { 
            action: "place_bet", 
            amount: parseInt(betAmount),
            name: myName
        }
    }));
    
    // Reset waiting text back to default layout before screen swap
    document.getElementById('waitingContent').innerHTML = 
        "<h2>Bet Locked!</h2><p style='font-size: 20px;'>Look at the TV, waiting for others...</p>";
        
    document.getElementById('bettingScreen').style.display = 'none';
    document.getElementById('waitingScreen').style.display = 'block';
}

// 7. HIT / STAND MOVES ACTION
function sendAction(choice) {
    const myName = localStorage.getItem("playerName");
    
    ws.send(JSON.stringify({
        action: "button_press",
        payload: { 
            action: choice, 
            name: myName 
        }
    }));
}

// --- 8. HOST DASHBOARD CONTROLS ---
function changePhase(phase) {
    ws.send(JSON.stringify({
        action: "host_command",
        payload: { action: "change_phase", phase: phase }
    }));
}

function setBalance() {
    const target = document.getElementById('targetPlayer').value;
    const amount = document.getElementById('targetAmount').value;
    
    if (!target || !amount) {
        alert("Please enter a name and amount!");
        return;
    }
    
    ws.send(JSON.stringify({
        action: "host_command",
        payload: {
            action: "set_balance",
            target_player: target,
            amount: parseInt(amount)
        }
    }));
    
    // Clear the inputs and confirm!
    document.getElementById('targetPlayer').value = "";
    document.getElementById('targetAmount').value = "";
    alert("Sent $" + amount + " to " + target + "!");
}
