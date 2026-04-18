const canvas = document.getElementById('canvasJogo');
const ctx = canvas.getContext('2d');
const displayFase = document.getElementById('faseAtual');
const displayScore = document.getElementById('score');
const w = canvas.width, h = canvas.height;

// --- SISTEMA DE PONTOS E TEMPO ---
let pontuacaoTotal = 0;
let tempoInicioFase = Date.now();

// --- CONFIGURAÇÃO DO JOGADOR (HOMEM-ARANHA) ---
const jogador = {
    x: 50, y: 700, largura: 30, altura: 42, 
    velX: 0, velY: 0, velocidade: 8, gravidade: 0.75, forcaPulo: -16, 
    pulosMaximos: 2, pulosRestantes: 2,
    corCorpo: "#E23636", corSecundaria: "#5048E5",
    squashX: 1, squashY: 1, anim: 0, timerTeia: 0
};

let faseIndice = 0;
let teclas = {};
let prediosFundo = [];
let prediosFrente = [];
let inimigosAtuais = [];

// --- CENÁRIO: CIDADE DENSA ---
function gerarCenario() {
    prediosFundo = []; prediosFrente = [];
    for (let i = 0; i < 40; i++) {
        prediosFundo.push({ x: i * 40 + Math.random() * 25, largura: 40 + Math.random() * 60, altura: 150 + Math.random() * 400 });
    }
    for (let i = 0; i < 25; i++) {
        let largura = 80 + Math.random() * 100;
        let altura = 150 + Math.random() * 500;
        let janelas = [];
        for (let y = h - altura + 25; y < h - 25; y += 35) {
            for (let x = 15; x < largura - 20; x += 25) {
                if (Math.random() > 0.4) janelas.push({x, y, on: Math.random() > 0.3});
            }
        }
        prediosFrente.push({ x: i * 120 + Math.random() * 50, largura, altura, janelas });
    }
}

// --- DESENHO DO HOMEM-ARANHA ---
function desenharAranha() {
    jogador.anim += 0.1;
    jogador.squashX += (1 - jogador.squashX) * 0.15;
    jogador.squashY += (1 - jogador.squashY) * 0.15;

    ctx.save();
    ctx.translate(jogador.x + jogador.largura / 2, jogador.y + jogador.altura);
    
    if (jogador.timerTeia > 0) {
        ctx.strokeStyle = "rgba(255, 255, 255, " + (jogador.timerTeia / 15) + ")";
        ctx.lineWidth = 3; ctx.setLineDash([5, 3]);
        ctx.beginPath(); ctx.moveTo(0, -35); ctx.lineTo(0, -h); ctx.stroke();
        jogador.timerTeia--;
    }

    ctx.scale(jogador.squashX, jogador.squashY);
    ctx.fillStyle = jogador.corSecundaria; ctx.fillRect(-12, -15, 24, 15); 
    ctx.fillStyle = jogador.corCorpo; ctx.fillRect(-12, -32, 24, 17); 

    // ARANHA NO PEITO
    ctx.fillStyle = "black"; ctx.beginPath();
    ctx.arc(0, -25, 1.8, 0, 7); ctx.arc(0, -23, 2.2, 0, 7); ctx.fill();
    ctx.strokeStyle = "black"; ctx.lineWidth = 0.8;
    [-1, 1].forEach(s => {
        for(let i=0; i<4; i++) {
            ctx.beginPath(); ctx.moveTo(0, -24); 
            ctx.lineTo(s * 8, -28 + (i * 3)); ctx.stroke();
        }
    });

    ctx.fillStyle = jogador.corCorpo; ctx.beginPath(); ctx.ellipse(0, -40, 12, 14, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "white"; ctx.strokeStyle = "black";
    [-1, 1].forEach(s => {
        ctx.beginPath(); ctx.moveTo(s*9, -42); ctx.quadraticCurveTo(s*10, -34, s*2, -37); ctx.lineTo(s*2, -44);
        ctx.closePath(); ctx.fill(); ctx.stroke();
    });
    ctx.restore();
}

// --- DESENHO DO CORINGA ---
function desenharCoringa(ini) {
    ini.anim += 0.08;
    const sX = Math.sin(ini.anim * 1.5) * 1.5;
    const sY = Math.sin(ini.anim) * 1;
    ctx.save();
    ctx.translate(ini.x + ini.largura / 2, ini.y + ini.altura);
    ctx.fillStyle = "#4B0082"; ctx.fillRect(-15+sX, -42+sY, 30, 27);
    ctx.fillStyle = "#EAEAEA"; ctx.beginPath(); ctx.ellipse(sX, -48+sY, 13, 16, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#008000"; ctx.beginPath(); ctx.moveTo(-15+sX, -50); ctx.lineTo(0, -68); ctx.lineTo(15+sX, -50); ctx.fill();
    ctx.strokeStyle = "#960000"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(sX, -43+sY, 9, 0, Math.PI); ctx.stroke();
    ctx.restore();
}

// --- LOGICA DAS FASES ---
function gerarFases() {
    let f = [];
    for (let i = 0; i < 30; i++) {
        let p = [{ x: 0, y: h - 80, largura: 350, altura: 80 }];
        if (i % 2 === 0) p.push({ x: 400, y: h - 250, largura: 300, altura: 30 }, { x: 900, y: h - 450, largura: 250, altura: 30 });
        else p.push({ x: 800, y: h - 220, largura: 300, altura: 30 }, { x: 300, y: h - 450, largura: 300, altura: 30 });
        f.push({ plataformas: p, objetivo: { x: 1250, y: h - 650 } });
    }
    return f;
}
const fases = gerarFases();

// --- CALCULO DE PONTUAÇÃO ---
function calcularPontos() {
    let tempoGasto = (Date.now() - tempoInicioFase) / 1000;
    let bonusTempo = Math.max(0, Math.floor(500 - (tempoGasto * 12)));
    pontuacaoTotal += 500 + bonusTempo; // 500 base + bônus de velocidade
    displayScore.innerText = pontuacaoTotal;
}

// --- ATUALIZAÇÃO DO JOGO ---
function atualizar() {
    if (teclas['KeyA']) jogador.velX = -jogador.velocidade;
    else if (teclas['KeyD']) jogador.velX = jogador.velocidade;
    else jogador.velX *= 0.85;

    jogador.velY += jogador.gravidade;
    jogador.x += jogador.velX; jogador.y += jogador.velY;

    fases[faseIndice].plataformas.forEach(p => {
        if (jogador.x < p.x + p.largura && jogador.x + jogador.largura > p.x &&
            jogador.y + jogador.altura > p.y && jogador.y + jogador.altura < p.y + p.altura + jogador.velY) {
            if (jogador.velY > 0) { jogador.velY = 0; jogador.y = p.y - jogador.altura; jogador.pulosRestantes = jogador.pulosMaximos; }
        }
    });

    inimigosAtuais.forEach(ini => {
        ini.x += ini.velocidade;
        if (Math.abs(ini.x - ini.originalX) > ini.range) ini.velocidade *= -1;
        if (jogador.x < ini.x + ini.largura && jogador.x + jogador.largura > ini.x &&
            jogador.y < ini.y + ini.altura && jogador.y + jogador.altura > ini.y) {
            pontuacaoTotal = Math.max(0, pontuacaoTotal - 100); // Perde 100 pontos ao morrer
            displayScore.innerText = pontuacaoTotal;
            resetar();
        }
    });

    if (Math.hypot(jogador.x - fases[faseIndice].objetivo.x, jogador.y - fases[faseIndice].objetivo.y) < 60) {
        calcularPontos(); 
        proxima();
    }
    if (jogador.y > h) resetar();
}

function resetar() {
    jogador.x = 80; jogador.y = h - 220; jogador.velX = 0; jogador.velY = 0;
    inimigosAtuais = [];
    let qtd = 1 + Math.floor(faseIndice / 4); // Mais inimigos a cada 4 fases
    for(let i=0; i<qtd; i++) {
        let px = 400 + (i * 350);
        inimigosAtuais.push({ 
            x: px, y: h - (260 + (i*50)), largura: 35, altura: 55, 
            velocidade: 4 + Math.random()*2, range: 150, originalX: px, 
            anim: Math.random()*10 
        });
    }
    tempoInicioFase = Date.now();
    gerarCenario();
}

function proxima() {
    if (faseIndice < 29) { faseIndice++; displayFase.innerText = faseIndice + 1; resetar(); }
    else alert("GOTHAM ESTÁ SALVA! Score Final: " + pontuacaoTotal);
}

function acaoPulo() {
    if (jogador.pulosRestantes > 0) {
        jogador.velY = jogador.forcaPulo; jogador.pulosRestantes--;
        jogador.timerTeia = 15; jogador.squashX = 0.6; jogador.squashY = 1.4;
    }
}

// --- CONTROLES (TECLADO + MOBILE) ---
window.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') teclas['KeyA'] = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') teclas['KeyD'] = true;
    if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) acaoPulo();
});
window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') teclas['KeyA'] = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') teclas['KeyD'] = false;
});

const setupBtn = (id, cin, cout) => {
    const el = document.getElementById(id);
    if(!el) return;
    const start = (e) => { e.preventDefault(); cin(); };
    const end = (e) => { e.preventDefault(); if(cout) cout(); };
    el.addEventListener('touchstart', start, {passive: false});
    el.addEventListener('touchend', end, {passive: false});
    el.addEventListener('mousedown', start);
    el.addEventListener('mouseup', end);
};

setupBtn('btnLeft', () => teclas['KeyA'] = true, () => teclas['KeyA'] = false);
setupBtn('btnRight', () => teclas['KeyD'] = true, () => teclas['KeyD'] = false);
setupBtn('btnAction', () => acaoPulo(), null);

// --- LOOP PRINCIPAL ---
function desenhar() {
    ctx.fillStyle = "#020205"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#06060c"; prediosFundo.forEach(p => ctx.fillRect(p.x, h - p.altura, p.largura, p.altura));
    prediosFrente.forEach(p => {
        ctx.fillStyle = "#0d0d1a"; ctx.fillRect(p.x, h - p.altura, p.largura, p.altura);
        p.janelas.forEach(j => { ctx.fillStyle = j.on ? "rgba(255,255,180,0.15)" : "#050505"; ctx.fillRect(p.x+j.x, j.y, 6, 10); });
    });
    fases[faseIndice].plataformas.forEach(p => {
        ctx.fillStyle = "#111"; ctx.fillRect(p.x, p.y, p.largura, p.altura);
        ctx.fillStyle = "#E23636"; ctx.fillRect(p.x, p.y, p.largura, 4);
    });
    let obj = fases[faseIndice].objetivo;
    ctx.fillStyle = "gold"; ctx.shadowBlur = 20; ctx.shadowColor = "gold";
    ctx.beginPath(); ctx.arc(obj.x, obj.y, 30, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    
    inimigosAtuais.forEach(ini => desenharCoringa(ini));
    desenharAranha();
    atualizar();
    requestAnimationFrame(desenhar);
}

resetar();
desenhar();