const ws = new WebSocket('wss://my-party-server-9xm3.onrender.com');

// --- NEW: THE TAB'S PERSONAL MEMORY ---
// This variable stays trapped inside this specific tab!
let mySessionName = ""; 
// --------------------------------------

window.onload = () => {
    try {
        const savedName = localStorage.getItem("playerName");
        const savedCode = localStorage.getItem("roomCode");
        if (savedName && savedCode) {
            document.getElementById('playerName').value = savedName;
            document.getElementById('roomCode').value = savedCode;
        }
    } catch (e) {}
};

ws.onmessage = (event) => {
    let data;
    try { data = JSON.parse(event.data); } catch (e) { return; }
    
if (data.action === "profile_loaded") {
        document.getElementById('bankText').innerText = "Bank: $" + data.currency;
        document.getElementById('betSlider').max = data.currency;
        
        document.getElementById('statusText').innerText = "Welcome, " + mySessionName + "!";
        
        document.getElementById('login').style.display = 'none';
        document.getElementById('bettingScreen').style.display = 'none';
        document.getElementById('actionScreen').style.display = 'none';
        document.getElementById('waitingScreen').style.display = 'block';
        
        // NEW: Tell them if they missed the boat!
        if (data.current_phase === "LOBBY") {
            document.getElementById('waitingContent').innerHTML = 
                "<h2>Connected!</h2><p style='font-size: 20px;'>Waiting for the Dealer to start the betting phase...</p>";
        } else {
            document.getElementById('waitingContent').innerHTML = 
                "<h2 style='color:#f44336;'>Round in Progress!</h2><p style='font-size: 20px;'>You are spectating. You will automatically join the next round!</p>";
        }
    }
    
    else if (data.action === "phase_changed") {
        if (data.phase === "BETTING") {
            document.getElementById('betSlider').value = 10;
            document.getElementById('betDisplay').innerText = "$10";
            
            document.getElementById('waitingScreen').style.display = 'none';
            document.getElementById('actionScreen').style.display = 'none';
            document.getElementById('bettingScreen').style.display = 'block';
        }
    }
    
    else if (data.action === "your_turn") {
        document.getElementById('waitingScreen').style.display = 'none';
        document.getElementById('actionScreen').style.display = 'block';
    }
    
    else if (data.action === "wait_turn") {
        document.getElementById('actionScreen').style.display = 'none';
        document.getElementById('waitingScreen').style.display = 'block';
        document.getElementById('waitingContent').innerHTML = 
            "<h2 style='color:#666;'>Waiting...</h2><p style='font-size:20px;'>" + data.active_player + " is making a move.</p>";
    }
};

function joinGame() {
    const nameInput = document.getElementById('playerName').value;
    const codeInput = document.getElementById('roomCode').value.toUpperCase();
    
    if (nameInput && codeInput) {
        if (ws.readyState !== WebSocket.OPEN) {
            alert("Still connecting to the cloud... please try again in 2 seconds!");
            return; 
        }
        
        // --- NEW: SAVE TO TAB MEMORY ---
        mySessionName = nameInput;
        
        try {
            localStorage.setItem("playerName", nameInput);
            localStorage.setItem("roomCode", codeInput);
        } catch (e) {}
        
        ws.send(JSON.stringify({
            action: "join_room",
            room_code: codeInput,
            name: nameInput
        }));
        
        if (nameInput === "DEALER") {
            document.getElementById('login').style.display = 'none';
            document.getElementById('hostScreen').style.display = 'block';
        }
    } else {
        alert("Please enter a name and room code!");
    }
}

function updateBetDisplay() {
    const sliderValue = document.getElementById('betSlider').value;
    document.getElementById('betDisplay').innerText = "$" + sliderValue;
}

function placeBet() {
    const betAmount = document.getElementById('betSlider').value;
    
    ws.send(JSON.stringify({
        action: "button_press",
        payload: { 
            action: "place_bet", 
            amount: parseInt(betAmount),
            name: mySessionName // <-- Uses the tab's memory!
        }
    }));
    
    document.getElementById('waitingContent').innerHTML = 
        "<h2>Bet Locked!</h2><p style='font-size: 20px;'>Look at the TV, waiting for Dealer to deal...</p>";
        
    document.getElementById('bettingScreen').style.display = 'none';
    document.getElementById('waitingScreen').style.display = 'block';
}

function sendAction(choice) {
    ws.send(JSON.stringify({
        action: "button_press",
        payload: { 
            action: choice, 
            name: mySessionName // <-- Uses the tab's memory!
        }
    }));
}

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
    document.getElementById('targetPlayer').value = "";
    document.getElementById('targetAmount').value = "";
    alert("Sent $" + amount + " to " + target + "!");
}
