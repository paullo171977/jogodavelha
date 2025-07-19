let board = [];
let currentPlayerIndex = 0;
let players = [];
let currentPlayers = [];
let moves = 0;
let jogoIniciado = false;
let ultimoJogadorInicial = 0;
let rankingLeader = { name: "", since: "" };

window.addEventListener('load', () => {
    const savedPlayers = localStorage.getItem('jogoVelhaRanking');
    const savedLeader = localStorage.getItem('jogoVelhaLeader');

    if (savedPlayers) {
        players = JSON.parse(savedPlayers);
        players.forEach(p => {
            if (typeof p.wins !== "number") p.wins = 0;
            if (typeof p.draws !== "number") p.draws = 0;
            if (typeof p.losses !== "number") p.losses = 0;
            if (typeof p.points !== "number") p.points = 0;
            if (typeof p.firstScoreDate !== "string") p.firstScoreDate = "";
        });
    }
    if (savedLeader) rankingLeader = JSON.parse(savedLeader);

    updateScoreboard();
    resetBoard();
    updateBoard();
    updateBotoes();
    updateJogadoresAtuais();
});

function updateBotoes() {
    const btnIniciar = document.getElementById("btnIniciar");
    const btnZerar = document.getElementById("btnZerar");
    if (!btnIniciar || !btnZerar) return;
    btnIniciar.disabled = jogoIniciado;
    btnZerar.disabled = jogoIniciado;
}

function salvarRanking() {
    localStorage.setItem('jogoVelhaRanking', JSON.stringify(players));
    localStorage.setItem('jogoVelhaLeader', JSON.stringify(rankingLeader));
}

function recalcularEstatisticas() {
    players.forEach(p => {
        p.points = (p.wins * 3) + (p.draws * 1);
    });
}

function iniciar() {
    const nome1 = prompt("Nome do primeiro jogador:");
    if (!nome1) return;
    const nome2 = prompt("Nome do segundo jogador:");
    if (!nome2) return;

    addOrFindPlayer(nome1);
    addOrFindPlayer(nome2);

    currentPlayers = [findPlayerIndex(nome1), findPlayerIndex(nome2)];
    ultimoJogadorInicial = 0;
    currentPlayerIndex = 0;
    jogoIniciado = true;
    updateBotoes();

    iniciarNovaPartidaMesmos();
    updateJogadoresAtuais();
    updateAviso();
}

function addOrFindPlayer(name) {
    let idx = players.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
    if (idx === -1) {
        players.push({ name: name, wins: 0, draws: 0, losses: 0, points: 0, firstScoreDate: "" });
        salvarRanking();
    }
}

function findPlayerIndex(name) {
    return players.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
}

function resetBoard() {
    board = [["", "", ""], ["", "", ""], ["", "", ""]];
}

function updateBoard() {
    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = "";
    const linhas = ["A", "B", "C"];

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const cell = document.createElement("div");
            cell.className = "cell";

            if (board[i][j] === "") {
                cell.textContent = `${linhas[i]}-${j + 1}`;
                cell.style.color = "rgba(0,0,0,0.3)";
                cell.style.fontSize = "28px";
                cell.style.fontWeight = "bold";
            } else {
                cell.textContent = board[i][j];
                cell.style.fontSize = "72px";
                cell.style.fontWeight = "normal";
                cell.style.color = board[i][j] === "O" ? "#007bff" : "#ff3333";
            }

            cell.onclick = () => jogar(i, j);
            boardDiv.appendChild(cell);
        }
    }
}

function jogar(i, j) {
    if (!jogoIniciado) {
        alert("Clique em Iniciar primeiro!");
        return;
    }
    if (board[i][j] !== "") return;

    board[i][j] = currentPlayerIndex === 0 ? "O" : "X";
    moves++;
    updateBoard();

    if (checkWinner()) {
        const vencedorIdx = currentPlayers[currentPlayerIndex];
        const perdedorIdx = currentPlayers[1 - currentPlayerIndex];

        players[vencedorIdx].wins++;
        players[perdedorIdx].losses++;

        if (!players[vencedorIdx].firstScoreDate) {
            players[vencedorIdx].firstScoreDate = new Date().toLocaleDateString("pt-BR");
        }

        recalcularEstatisticas();
        salvarRanking();

        jogoIniciado = false;
        updateAviso();
        updateBotoes();

        setTimeout(() => {
            alert(players[vencedorIdx].name + " venceu!");
            proximaRodada(true);
        }, 0);

    } else if (moves === 9) {
        players[currentPlayers[0]].draws++;
        players[currentPlayers[1]].draws++;

        recalcularEstatisticas();
        salvarRanking();

        jogoIniciado = false;
        updateAviso();
        updateBotoes();

        setTimeout(() => {
            alert("Empate! Ambos ganharam 1 ponto.");
            ultimoJogadorInicial = 1 - ultimoJogadorInicial;
            iniciarNovaPartidaMesmos();
            updateAviso();
            updateJogadoresAtuais();
        }, 0);

    } else {
        currentPlayerIndex = 1 - currentPlayerIndex;
        updateAviso();
    }

    updateScoreboard();
}

function checkWinner() {
    const b = board;
    for (let i = 0; i < 3; i++) {
        if (b[i][0] && b[i][0] === b[i][1] && b[i][1] === b[i][2]) return true;
        if (b[0][i] && b[0][i] === b[1][i] && b[1][i] === b[2][i]) return true;
    }
    if (b[0][0] && b[0][0] === b[1][1] && b[1][1] === b[2][2]) return true;
    if (b[0][2] && b[0][2] === b[1][1] && b[1][1] === b[2][0]) return true;
    return false;
}

function proximaRodada(venceu) {
    if (venceu) {
        const vencedorIndex = currentPlayers[currentPlayerIndex];
        const vencedorNome = players[vencedorIndex].name;

        const trocar = confirm(vencedorNome + " venceu!\nDeseja trocar o adversário?");
        if (trocar) {
            const novoNome = prompt("Nome do próximo adversário para enfrentar " + vencedorNome + ":");
            if (novoNome && novoNome.trim() !== "") {
                addOrFindPlayer(novoNome);
                currentPlayers = [vencedorIndex, findPlayerIndex(novoNome)];
                jogoIniciado = true;
                updateBotoes();
                iniciarNovaPartidaMesmos();
                updateJogadoresAtuais();
                updateAviso();
                return;
            }
        }

        const continuar = confirm("Deseja jogar mais uma partida com os mesmos jogadores?");
        if (continuar) {
            iniciarNovaPartidaMesmos();
            updateJogadoresAtuais();
            updateAviso();
        } else {
            jogoIniciado = false;
            resetBoard();
            updateBoard();
            document.getElementById("aviso").textContent = "Clique em Iniciar";
            updateJogadoresAtuais();
            updateAviso();
            updateBotoes();
        }
    }
}

function iniciarNovaPartidaMesmos() {
    currentPlayerIndex = ultimoJogadorInicial;
    moves = 0;
    resetBoard();
    updateBoard();
    updateAviso();
    jogoIniciado = true;
    updateBotoes();
}

function updateAviso() {
    const aviso = document.getElementById("aviso");
    if (jogoIniciado) {
        aviso.textContent = "Vez de: " + players[currentPlayers[currentPlayerIndex]].name;
    } else {
        aviso.textContent = "";
    }
}

function updateJogadoresAtuais() {
    const div = document.getElementById("jogadoresAtuais");
    if (currentPlayers.length === 2 && jogoIniciado) {
        const primeiro = players[currentPlayers[ultimoJogadorInicial]].name;
        const segundo = players[currentPlayers[1 - ultimoJogadorInicial]].name;
        div.textContent = `${primeiro}  X  ${segundo}`;
    } else {
        div.textContent = "";
    }
}

function updateScoreboard() {
    const scoreDiv = document.getElementById("scoreboard");
    const leaderDiv = document.getElementById("leader-info");
    if (leaderDiv) leaderDiv.innerHTML = "";
    scoreDiv.innerHTML = "";

    players.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const aGames = (a.wins ?? 0) + (a.draws ?? 0) + (a.losses ?? 0);
        const bGames = (b.wins ?? 0) + (b.draws ?? 0) + (b.losses ?? 0);
        if (aGames !== bGames) return aGames - bGames;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.name.localeCompare(b.name);
    });

    if (players.length > 0) {
        const topScore = players[0].points;
        const empatados = players.filter(p => p.points === topScore);
        if (empatados.length === 1) {
            if (rankingLeader.name !== empatados[0].name) {
                rankingLeader.name = empatados[0].name;
                rankingLeader.since = new Date().toLocaleDateString("pt-BR");
                salvarRanking();
            }
        }
    }

    if (rankingLeader.name && leaderDiv) {
        leaderDiv.innerHTML = `🏅 <strong>${rankingLeader.name}</strong> está em primeiro desde <strong>${rankingLeader.since}</strong>`;
    }

    const table = document.createElement("table");
    table.className = "score-table";
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    ["Jogador", "Vitórias", "Empates", "Derrotas", "Jogos", "Pontos"].forEach(h => {
        const th = document.createElement("th");
        th.textContent = h;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    players.forEach((p, i) => {
        const row = document.createElement("tr");
        if (i === 0) row.classList.add("first-place");
        const games = (p.wins ?? 0) + (p.draws ?? 0) + (p.losses ?? 0);
        [p.name, p.wins ?? 0, p.draws ?? 0, p.losses ?? 0, games, p.points ?? 0].forEach(val => {
            const td = document.createElement("td");
            td.textContent = val;
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    scoreDiv.appendChild(table);
}

function zerarRanking() {
    if (confirm("Tem certeza que deseja zerar o ranking?")) {
        players = [];
        rankingLeader = { name: "", since: "" };
        salvarRanking();
        updateScoreboard();

        currentPlayers = [];
        ultimoJogadorInicial = 0;
        currentPlayerIndex = 0;
        jogoIniciado = false;

        resetBoard();
        updateBoard();
        updateJogadoresAtuais();
        updateAviso();
        updateBotoes();
    }
}
