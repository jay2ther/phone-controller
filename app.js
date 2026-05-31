let ws;
let mySessionName = "";
let myRoomCode = "";
let pingInterval;

function connectToCloud() {
    ws = new WebSocket('wss://my-party-server-9xm3.onrender.com');

    ws.onopen = () => {
        console.log("Connected to cloud!");
        const dcScreen = document.getElementById('disconnectScreen');
        if (dcScreen) dcScreen.style.display = 'none';

        clearInterval(pingInterval);
        pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ action: "ping" }));
            }
        }, 30000);

        if (mySessionName && myRoomCode) {
            ws.send(JSON.stringify({ action: "join_room", room_code: myRoomCode, name: mySessionName }));
            if (mySessionName === "DEALER") {
                document.getElementById('login').style.display = 'none';
                document.getElementById('hostScreen').style.display = 'block';
            }
        }
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
            
            if (data.current_phase === "LOBBY") {
                document.getElementById('waitingContent').innerHTML = "<h2>Connected!</h2><p style='font-size: 20px;'>Waiting for the Dealer to start the betting phase...</p>";
            } else if (data.current_phase === "BETTING") {
                document.getElementById('waitingScreen').style.display = 'none';
                document.getElementById('bettingScreen').style.display = 'block';
            } else {
                document.getElementById('waitingContent').innerHTML = "<h2 style='color:#f44336;'>Round in Progress!</h2><p style='font-size: 20px;'>You are spectating. You will automatically join the next round!</p>";
            }
        }
        
        else if (data.action === "update_bank") {
            document.getElementById('bankText').innerText = "Bank: $" + data.currency;
            document.getElementById('betSlider').max = data.currency;
            if (parseInt(document.getElementById('betSlider').value) > data.currency) {
                document.getElementById('betSlider').value = data.currency;
                updateBetDisplay();
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

        // --- NEW: CATCH ANTI-CHEAT LOCK LABELS FROM GODOT ---
        else if (data.action === "hand_locked") {
            document.getElementById('bettingScreen').style.display = 'none';
            document.getElementById('actionScreen').style.display = 'none';
            document.getElementById('waitingScreen').style.display = 'block';
            document.getElementById('waitingContent').innerHTML = 
                "<h2 style='color:#FF9800;'>HAND LOCKED OVER!</h2><p style='font-size: 20px;'>Your previous cards and bet of <b>$" + data.bet + "</b> are locked into this round because you were skipped!</p>";
        }
        
        else if (data.action === "your_turn") {
            document.getElementById('waitingScreen').style.display = 'none';
            document.getElementById('actionScreen').style.display = 'block';
        }
        else if (data.action === "wait_turn") {
            document.getElementById('actionScreen').style.display = 'none';
            document.getElementById('waitingScreen').style.display = 'block';
            document.getElementById('waitingContent').innerHTML = "<h2 style='color:#666;'>Waiting...</h2><p style='font-size:20px;'>" + data.active_player + " is making a move.</p>";
        }
    };

    ws.onclose = () => {
        console.log("Connection lost. Reconnecting...");
        clearInterval(pingInterval);
        const screens = ['login', 'bettingScreen', 'waitingScreen', 'actionScreen', 'hostScreen'];
        screens.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
        const dcScreen = document.getElementById('disconnectScreen');
        if (dcScreen) dcScreen.style.display = 'block';
        setTimeout(connectToCloud, 3000);
    };

    ws.onerror = () => { ws.close(); };
}

connectToCloud();

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

function joinGame() {
    const nameInput = document.getElementById('playerName').value;
    const codeInput = document.getElementById('roomCode').value.toUpperCase();
    
    if (nameInput && codeInput) {
        if (ws.readyState !== WebSocket.OPEN) { alert("Connecting... try again in 2 seconds!"); return; }
        mySessionName = nameInput;
        myRoomCode = codeInput;
        try {
            localStorage.setItem("playerName", nameInput);
            localStorage.setItem("roomCode", codeInput);
        } catch (e) {}
        ws.send(JSON.stringify({ action: "join_room", room_code: codeInput, name: nameInput }));
        if (nameInput === "DEALER") {
            document.getElementById('login').style.display = 'none';
            document.getElementById('hostScreen').style.display = 'block';
        }
    } else { alert("Please enter a name and room code!"); }
}

function updateBetDisplay() {
    const sliderValue = document.getElementById('betSlider').value;
    document.getElementById('betDisplay').innerText = "$" + sliderValue;
}

function placeBet() {
    const betAmount = document.getElementById('betSlider').value;
    ws.send(JSON.stringify({ action: "button_press", payload: { action: "place_bet", amount: parseInt(betAmount), name: mySessionName } }));
    document.getElementById('waitingContent').innerHTML = "<h2>Bet Locked!</h2><p style='font-size: 20px;'>Look at the TV, waiting for Dealer to deal...</p>";
    document.getElementById('bettingScreen').style.display = 'none';
    document.getElementById('waitingScreen').style.display = 'block';
}

function sendAction(choice) { ws.send(JSON.stringify({ action: "button_press", payload: { action: choice, name: mySessionName } })); }
function changePhase(phase) { ws.send(JSON.stringify({ action: "host_command", payload: { action: "change_phase", phase: phase } })); }
function skipTurn() { ws.send(JSON.stringify({ action: "host_command", payload: { action: "skip_turn" } })); }

function setBalance() {
    const target = document.getElementById('targetPlayer').value;
    const amount = document.getElementById('targetAmount').value;
    if (!target || !amount) { alert("Please enter a name and amount!"); return; }
    ws.send(JSON.stringify({ action: "host_command", payload: { action: "set_balance", target_player: target, amount: parseInt(amount) } }));
    document.getElementById('targetPlayer').value = "";
    document.getElementById('targetAmount').value = "";
    alert("Sent $" + amount + " to " + target + "!");
}

// --- NEW: SEND MERCY ACTIONS PACKETS TO GODOT ---
function grantMercy() {
    const target = document.getElementById('mercyPlayer').value;
    if (!target) { alert("Please enter a player name!"); return; }
    ws.send(JSON.stringify({ action: "host_command", payload: { action: "grant_mercy", target_player: target } }));
    document.getElementById('mercyPlayer').value = "";
    alert("Mercy extended to " + target + "! Hand wiped clean.");
}