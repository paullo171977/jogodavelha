let board = [];
let currentPlayerIndex = 0;
let players = [];
let currentPlayers = [];
let moves = 0;
let jogoIniciado = false;
let ultimoJogadorInicial = 0;
let rankingLeader = { name: "", since: "" };
let rankingInterval = null;
let rankingScrollOffset = 0;
let scrollOffset = 0;
let scrollPaused = false;
let scrollSpeed = 0.8;
let visibleRows = 5;
let rowHeight = 35;
let pauseTime = 5000;
let scrollAnimationFrame;

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

            const inner = document.createElement("div");
            inner.className = "cell-inner";

            const front = document.createElement("div");
            front.className = "cell-front";
            front.textContent = `${linhas[i]}-${j + 1}`;

            const back = document.createElement("div");
            back.className = "cell-back";
            if (board[i][j] !== "") {
                back.textContent = board[i][j];
                back.style.color = board[i][j] === "O" ? "#007bff" : "#ff3333";
                cell.classList.add("flipped");
            }

            inner.appendChild(front);
            inner.appendChild(back);
            cell.appendChild(inner);

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

    // marca no board lógico
    board[i][j] = currentPlayerIndex === 0 ? "O" : "X";
    moves++;

    // atualiza apenas a célula clicada com efeito de flip
    const index = i * 3 + j;
    const cell = document.querySelectorAll('.cell')[index];
    const back = cell.querySelector('.cell-back');
    back.textContent = board[i][j];
    back.style.color = board[i][j] === "O" ? "#007bff" : "#ff3333";
    cell.classList.add('flipped');

    // checa vencedor
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
    const table = document.getElementById('ranking-table');
    if (!table) return;

    table.innerHTML = '';

    const isMobile = window.innerWidth <= 480;

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');

    if (isMobile) {
        ['Pos', 'Jog', 'V', 'E', 'D', 'J', 'Pts'].forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            headRow.appendChild(th);
        });
    } else {
        ['Posição', 'Jogador', 'Vitórias', 'Empates', 'Derrotas', 'Jogos', 'Pontos'].forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            headRow.appendChild(th);
        });
    }

    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    players.forEach((p, idx) => {
        const row = document.createElement('tr');
        if (idx === 0) row.classList.add('first-place');

        const games = (p.wins ?? 0) + (p.draws ?? 0) + (p.losses ?? 0);
        const pos = (idx + 1) + 'º';

        [pos, p.name, p.wins ?? 0, p.draws ?? 0, p.losses ?? 0, games, p.points ?? 0].forEach(val => {
            const td = document.createElement('td');
            td.textContent = val;
            row.appendChild(td);
        });

        tbody.appendChild(row);
    });

    table.appendChild(tbody);

    if (rankingInterval) clearInterval(rankingInterval);
    rankingScrollOffset = 0;
    tbody.style.transition = 'none';
    tbody.style.transform = `translateY(0px)`;

    iniciarScrollVertical();
}



function iniciarScrollVertical() {
    const tbody = document.querySelector('#ranking-table tbody');
    if (!tbody) return;


    if (scrollAnimationFrame) {
        cancelAnimationFrame(scrollAnimationFrame);
        scrollAnimationFrame = null;
    }

    scrollOffset = 0;
    scrollPaused = false;
    tbody.style.transition = 'none';
    tbody.style.transform = `translateY(0px)`;

    const rows = Array.from(tbody.querySelectorAll('tr'));

    if (rows.length <= visibleRows) {
        return;
    }

    while (tbody.children.length > rows.length) {
        tbody.removeChild(tbody.lastChild);
    }

    rows.forEach(row => {
        const clone = row.cloneNode(true);
        tbody.appendChild(clone);
    });

    const totalHeight = rows.length * rowHeight;


    function animateScroll() {
        if (!scrollPaused) {
            scrollOffset += scrollSpeed;
            tbody.style.transform = `translateY(-${scrollOffset}px)`;

            if (scrollOffset >= totalHeight) {
                scrollOffset = 0;
                tbody.style.transform = `translateY(0px)`;

                scrollPaused = true;
                setTimeout(() => {
                    scrollPaused = false;
                }, pauseTime);
            }
        }
        scrollAnimationFrame = requestAnimationFrame(animateScroll);
    }

    animateScroll();
}



function zerarRanking() {
    if (confirm("Tem certeza que deseja zerar TODO o ranking (jogadores e pontos)?")) {
        players = [];

        rankingLeader = { name: "", since: "" };

        salvarRanking();

        updateScoreboard();
        resetBoard();
        updateBoard();
        updateJogadoresAtuais();
        updateAviso();
        updateBotoes();
    }
}

