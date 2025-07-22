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
let linhaVencedora = null;

function botFacil() {
    let livres = [];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[i][j] === "") {
                livres.push({ i, j });
            }
        }
    }

    if (livres.length > 0) {
        const escolha = livres[Math.floor(Math.random() * livres.length)];

        jogar(escolha.i, escolha.j);
    }
}

function botMedio() {
    const botSimbolo = currentPlayers[1] !== undefined ? (currentPlayerIndex === 1 ? "X" : "O") : "X";
    const humanoSimbolo = botSimbolo === "X" ? "O" : "X";

    let jogada = podeGanhar(board, botSimbolo);
    if (jogada) {
        jogar(jogada.i, jogada.j);
        return;
    }

    jogada = podeGanhar(board, humanoSimbolo);
    if (jogada) {
        jogar(jogada.i, jogada.j);
        return;
    }

    botFacil();
}


function botDificil() {
    const botSimbolo = currentPlayers[1] !== undefined ? players[currentPlayers[1]].simbolo || "X" : "X";
    const humanoSimbolo = currentPlayers[0] !== undefined ? players[currentPlayers[0]].simbolo || "O" : "O";

    let jogada = podeGanhar(board, botSimbolo);
    if (jogada) {
        jogar(jogada.i, jogada.j);
        return;
    }


    jogada = podeGanhar(board, humanoSimbolo);
    if (jogada) {
        jogar(jogada.i, jogada.j);
        return;
    }

    const cantos = [{ i: 0, j: 0 }, { i: 0, j: 2 }, { i: 2, j: 0 }, { i: 2, j: 2 }];
    for (const pos of cantos) {
        if (board[pos.i][pos.j] === "") {
            jogar(pos.i, pos.j);
            return;
        }
    }

    if (board[1][1] === "") {
        jogar(1, 1);
        return;
    }


    const laterais = [{ i: 0, j: 1 }, { i: 1, j: 0 }, { i: 1, j: 2 }, { i: 2, j: 1 }];
    for (const pos of laterais) {
        if (board[pos.i][pos.j] === "") {
            jogar(pos.i, pos.j);
            return;
        }
    }

    botFacil();
}


function podeGanhar(board, simbolo) {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[i][j] === "") {
                board[i][j] = simbolo;
                if (checkWinner()) {
                    board[i][j] = "";
                    return { i, j };
                }
                board[i][j] = "";
            }
        }
    }
    return null;
}


function selecionarDificuldade() {
    const select = document.getElementById('dificuldades');
    const botao = document.getElementById('btnBot');

    if (select.value === "") {
        botao.textContent = "Bot (desativado)";
        botao.disabled = true;
    } else {
        botao.textContent = `Dificuldade: ${select.value}`;
        botao.disabled = false;
    }
}

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

    selecionarDificuldade();
});

function updateBotoes() {
    const btnIniciar = document.getElementById("btnIniciar");
    const btnZerar = document.getElementById("btnZerar");
    const btndificuldade = document.getElementById("dificuldades");
    if (!btnIniciar || !btnZerar || !btndificuldade) return;
    btnIniciar.disabled = jogoIniciado;
    btnZerar.disabled = jogoIniciado;
    btndificuldade.disabled = jogoIniciado;
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

    const dificuldade = document.getElementById('dificuldades').value;
    let nome2;

    if (dificuldade !== "") {
        switch (dificuldade) {
            case "Fácil":
                nome2 = "Bot Fácil";
                break;
            case "Médio":
                nome2 = "Bot Médio";
                break;
            case "Difícil":
                nome2 = "Bot Difícil";
                break;
            default:
                nome2 = "Bot";
        }
    } else {
        nome2 = prompt("Nome do segundo jogador:");
        if (!nome2) return;
    }

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

                if (linhaVencedora && linhaVencedora.some(pos => pos.i === i && pos.j === j)) {
                    cell.classList.add("flipped");
                    cell.classList.add("vencedora");
                } else {
                    cell.classList.add("flipped");
                }
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

    board[i][j] = currentPlayerIndex === 0 ? "O" : "X";
    moves++;

    updateBoard();

    linhaVencedora = checkWinner();

    if (linhaVencedora) {

        const [a, b, c] = linhaVencedora;
        if (a.i === b.i && b.i === c.i) {
            desenharLinhaRisco('horizontal', a.i);
        } else if (a.j === b.j && b.j === c.j) {
            desenharLinhaRisco('vertical', a.j);
        } else if (a.i === 0 && a.j === 0 && c.i === 2 && c.j === 2) {
            desenharLinhaRisco('diagonal-principal');
        } else {
            desenharLinhaRisco('diagonal-secundaria');
        }

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
            linhaVencedora = null;

            document.getElementById('linha-risco').style.display = 'none';
        }, 0);

    } else if (moves === 9) {
        players[currentPlayers[0]].draws++;
        players[currentPlayers[1]].draws++;

        recalcularEstatisticas();
        salvarRanking();

        jogoIniciado = false;
        updateAviso();
        updateBotoes();

        linhaVencedora = null;
        document.getElementById('linha-risco').style.display = 'none';

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

        linhaVencedora = null;
        document.getElementById('linha-risco').style.display = 'none';

        const dificuldade = document.getElementById('dificuldades').value;
        if (jogoIniciado && currentPlayerIndex === 1) {
            switch (dificuldade) {
                case "Fácil":
                    setTimeout(botFacil, 300);
                    break;
                case "Médio":
                    setTimeout(botMedio, 300);
                    break;
                case "Difícil":
                    setTimeout(botDificil, 300);
                    break;
            }
        }
    }

    updateScoreboard();
}


function mostrarLinhaVencedora() {
    const linhaRisco = document.getElementById('linha-risco');
    if (!linhaVencedora) {
        linhaRisco.style.display = 'none';
        return;
    }

    linhaRisco.style.display = 'block';

    const tamanhoCelula = 100;
    const pos0 = linhaVencedora[0];
    const pos2 = linhaVencedora[2];

    const x1 = pos0.j * tamanhoCelula + tamanhoCelula / 2;
    const y1 = pos0.i * tamanhoCelula + tamanhoCelula / 2;

    const x2 = pos2.j * tamanhoCelula + tamanhoCelula / 2;
    const y2 = pos2.i * tamanhoCelula + tamanhoCelula / 2;

    const comprimento = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

    const angulo = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

    linhaRisco.style.width = comprimento + 'px';
    linhaRisco.style.top = y1 + 'px';
    linhaRisco.style.left = x1 + 'px';
    linhaRisco.style.transform = `rotate(${angulo}deg)`;
}

function checkWinner() {
    const b = board;

    for (let i = 0; i < 3; i++) {
        if (b[i][0] && b[i][0] === b[i][1] && b[i][1] === b[i][2]) {
            return [{ i, j: 0 }, { i, j: 1 }, { i, j: 2 }];
        }
    }
    for (let j = 0; j < 3; j++) {
        if (b[0][j] && b[0][j] === b[1][j] && b[1][j] === b[2][j]) {
            return [{ i: 0, j }, { i: 1, j }, { i: 2, j }];
        }
    }
    if (b[0][0] && b[0][0] === b[1][1] && b[1][1] === b[2][2]) {
        return [{ i: 0, j: 0 }, { i: 1, j: 1 }, { i: 2, j: 2 }];
    }
    if (b[0][2] && b[0][2] === b[1][1] && b[1][1] === b[2][0]) {
        return [{ i: 0, j: 2 }, { i: 1, j: 1 }, { i: 2, j: 0 }];
    }

    return null;
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

    const dificuldade = document.getElementById('dificuldades').value;
    if (currentPlayerIndex === 1 && dificuldade !== "") {
        switch (dificuldade) {
            case "Fácil":
                setTimeout(botFacil, 300);
                break;
            case "Médio":
                setTimeout(botMedio, 300);
                break;
            case "Difícil":
                setTimeout(botDificil, 300);
                break;
        }
    }
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

function desenharLinhaRisco(tipo, indice) {
    const linha = document.getElementById('linha-risco');
    const board = document.getElementById('board');
    const boardRect = board.getBoundingClientRect();
    const cellSize = boardRect.width / 3;

    const ajusteX = 5;
    const ajusteY = 0;

    linha.style.display = 'block';
    linha.style.transformOrigin = 'left top';
    linha.style.transform = 'none';
    linha.style.width = `${boardRect.width}px`;

    let x = 0;
    let y = 0;
    let angle = 0;

    if (tipo === 'horizontal') {
        y = (indice + 0.5) * cellSize;
        x = 0;
        angle = 0;
    } else if (tipo === 'vertical') {
        x = (indice + 0.5) * cellSize;
        y = 0;
        angle = 90;
    } else if (tipo === 'diagonal-principal') {
        x = 0;
        y = 0;
        angle = 45;
        linha.style.width = `${Math.sqrt(2) * boardRect.width}px`;
    } else if (tipo === 'diagonal-secundaria') {
        x = boardRect.width;
        y = 0;
        angle = -45;
        linha.style.width = `${Math.sqrt(2) * boardRect.width}px`;
        linha.style.transformOrigin = 'right top';
    }


    linha.style.top = `${y + ajusteY}px`;
    linha.style.left = `${x + ajusteX}px`;
    linha.style.transform = `rotate(${angle}deg)`;
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

