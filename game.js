const canvas = document.getElementById("jogo");
const ctx = canvas.getContext("2d");
const lvlDisplay = document.getElementById("lvl");
const vidasDisplay = document.getElementById("vidas");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

let nivelAtual = 0;
const gravidade = 1;
const controles = { esquerda: false, direita: false };
let frameCount = 0;
let particulas = [];
let inimigos = [];
let transicaoOpacity  = 1;
let vidas = 5;

const jogador = {
    x: 50, y: 0, largura: 25, altura: 40,
    velX: 0, velY: 0, velocidade: 8, forcaPulo: -19, noChao: false,
    brilho: 1,
    reset() { 
        this.x = 50; 
        this.y = fases[nivelAtual].plataformas[0].y - this.altura; 
        this.velX = 0; 
        this.velY = 0; 
        this.noChao = true;
        transicaoOpacity = 0.5;
    }
};

const objetivo = { x: 0, y: 0, largura: 40, altura: 60, cor: "#760dcc" };

// --- DEFINIÇÃO DAS FASES ---
const fases = [
    { // Fase 1
        plataformas: [
            { x: 0, y: canvas.height - 50, largura: 500, altura: 50 },
            { x: 450, y: canvas.height - 150, largura: 150, altura: 20 },
            { x: 200, y: canvas.height - 280, largura: 150, altura: 20 }
        ],
        objetivo: { x: 220, y: canvas.height - 340 }
    },
    { // Fase 2
        plataformas: [
            { x: 0, y: canvas.height - 50, largura: 200, altura: 50 },
            { x: 250, y: canvas.height - 120, largura: 100, altura: 20 },
            { x: 450, y: canvas.height - 220, largura: 100, altura: 20 },
            { x: 250, y: canvas.height - 320, largura: 100, altura: 20 },
            { x: 50, y: canvas.height - 400, largura: 100, altura: 20 }
        ],
        objetivo: { x: 70, y: canvas.height - 460 }
    },
    { // Fase 3
        plataformas: [
            { x: 0, y: canvas.height - 50, largura: 150, altura: 50 },
            { x: 200, y: canvas.height - 150, largura: 100, altura: 20 },
            { x: 350, y: canvas.height - 250, largura: 100, altura: 20 },
            { x: 500, y: canvas.height - 350, largura: 100, altura: 20 },
            { x: 650, y: canvas.height - 450, largura: 150, altura: 20 }
        ],
        objetivo: { x: 700, y: canvas.height - 510 }
    },
    { // Fase 4
        plataformas: [
            { x: 0, y: canvas.height - 50, largura: 120, altura: 50 },
            { x: 180, y: canvas.height - 120, largura: 100, altura: 20 },
            { x: 300, y: canvas.height - 200, largura: 100, altura: 20 },
            { x: 420, y: canvas.height - 280, largura: 100, altura: 20 },
            { x: 540, y: canvas.height - 360, largura: 100, altura: 20 },
            { x: 660, y: canvas.height - 440, largura: 80, altura: 20 }
        ],
        objetivo: { x: 720, y: canvas.height - 500 }
    },
    { // Fase 5
        plataformas: [
            { x: 0, y: canvas.height - 50, largura: 80, altura: 50 },
            { x: 120, y: canvas.height - 120, largura: 50, altura: 20 },
            { x: 220, y: canvas.height - 200, largura: 50, altura: 20 },
            { x: 320, y: canvas.height - 280, largura: 50, altura: 20 },
            { x: 420, y: canvas.height - 360, largura: 50, altura: 20 },
            { x: 520, y: canvas.height - 440, largura: 50, altura: 20 },
            { x: 620, y: canvas.height - 520, largura: 70, altura: 20 }
        ],
        objetivo: { x: 670, y: canvas.height - 580 }
    },
    { // Fase 6
        plataformas: [
            { x: 0, y: canvas.height - 50, largura: 60, altura: 50 },
            { x: 100, y: canvas.height - 130, largura: 50, altura: 20 },
            { x: 200, y: canvas.height - 210, largura: 50, altura: 20 },
            { x: 300, y: canvas.height - 290, largura: 50, altura: 20 },
            { x: 400, y: canvas.height - 370, largura: 50, altura: 20 },
            { x: 500, y: canvas.height - 450, largura: 50, altura: 20 },
            { x: 600, y: canvas.height - 530, largura: 50, altura: 20 },
            { x: 700, y: canvas.height - 610, largura: 60, altura: 20 }
        ],
        objetivo: { x: 740, y: canvas.height - 670 }
    },
    { // Fase 7
        plataformas: [
            { x: 0, y: canvas.height - 50, largura: 50, altura: 50 },
            { x: 80, y: canvas.height - 120, largura: 40, altura: 20 },
            { x: 160, y: canvas.height - 200, largura: 40, altura: 20 },
            { x: 240, y: canvas.height - 280, largura: 40, altura: 20 },
            { x: 320, y: canvas.height - 360, largura: 40, altura: 20 },
            { x: 400, y: canvas.height - 440, largura: 40, altura: 20 },
            { x: 480, y: canvas.height - 520, largura: 40, altura: 20 },
            { x: 560, y: canvas.height - 600, largura: 40, altura: 20 },
            { x: 640, y: canvas.height - 680, largura: 50, altura: 20 }
        ],
        objetivo: { x: 670, y: canvas.height - 740 }
    }
];

const inimigosFase = [
    [
        { x: 470, y: canvas.height - 190, largura: 20, altura: 25, velocidade:1, cor: '#e74c3c', alerta: 0 }
    ],
    [
        { x: 270, y: canvas.height - 160, largura: 20, altura: 25, velocidade: 1.2, cor: '#e74c3c', alerta: 0 }
    ],
    [
        { x: 360, y: canvas.height - 290, largura: 20, altura: 25, velocidade: 1.4, cor: '#e74c3c', alerta: 0 }
    ],
    [
        { x: 430, y: canvas.height - 310, largura: 20, altura: 25, velocidade: 1.4, cor: '#e74c3c', alerta: 0 }
    ],
    [
        { x: 180, y: canvas.height - 160, largura: 20, altura: 25, velocidade: 1.6, cor: '#e74c3c', alerta: 0 }
    ],
    [
        { x: 240, y: canvas.height - 230, largura: 20, altura: 25, velocidade: 1.8, cor: '#e74c3c', alerta: 0 }
    ],
    [
        { x: 420, y: canvas.height - 520, largura: 20, altura: 25, velocidade: 1, cor: '#e74c3c', alerta: 0  }
    ]
];

function carregarFase(n) {
    if(n >= fases.length) {
        alert("Você venceu todas as fases!");
        nivelAtual = 0;
        n = 0;
    }
    const fase = fases[n];
    objetivo.x = fase.objetivo.x;
    objetivo.y = fase.objetivo.y;
    lvlDisplay.innerText = n + 1;
    jogador.reset();
    inimigos = (inimigosFase[n] || []).map(criarInimigo);
    atualizarVidas();
}

// --- CONTROLES ---
function addCtrl(id, acao) {
    const el = document.getElementById(id);
    if(!el) return;
    const on = (e) => { e.preventDefault(); e.stopPropagation(); if(acao==='pulo') pular(); else controles[acao]=true; };
    el.addEventListener('touchstart', on, false); 
    el.addEventListener('mousedown', on, false);
}
document.addEventListener('touchend', (e) => { controles.esquerda = false; controles.direita = false; }, false);
document.addEventListener('mouseup', (e) => { controles.esquerda = false; controles.direita = false; }, false);
addCtrl('btnEsq', 'esquerda'); addCtrl('btnDir', 'direita'); addCtrl('btnPulo', 'pulo');

// Controles de teclado para PC
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') controles.esquerda = true;
    if (e.key === 'ArrowRight') controles.direita = true;
    if (e.key === ' ') { e.preventDefault(); pular(); }
});
document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') controles.esquerda = false;
    if (e.key === 'ArrowRight') controles.direita = false;
});

function pular() { if(jogador.noChao) { jogador.velY = jogador.forcaPulo; jogador.noChao = false; for(let i=0;i<8;i++) criarParticula(jogador.x+jogador.largura/2, jogador.y+jogador.altura, Math.cos(i*Math.PI/4)*2, Math.sin(i*Math.PI/4)*2, 'rgba(0, 255, 136, 0.6)'); } }

function criarParticula(x, y, vx, vy, cor) { particulas.push({x, y, vx, vy, cor, vida: 30, tamanho: 4}); }

function atualizarVidas() {
    if (vidasDisplay) vidasDisplay.innerText = vidas;
}

function perderVida() {
    vidas = Math.max(0, vidas - 1);
    atualizarVidas();
    transicaoOpacity = 1;
    if (vidas === 0) {
        alert('Game Over! Reiniciando com 5 vidas.');
        vidas = 6;
        nivelAtual = 0;
        carregarFase(nivelAtual);
        return;
    }
    jogador.reset();
}

function criarInimigo(data) {
    return {
        ...data,
        velX: data.velocidade,
        velY: 0,
        noChao: false,
        dir: 1,
        territorio: { min: data.x, max: data.x + (data.largura || 30) }
    };
}

function colide(a, b) {
    return a.x < b.x + b.largura && a.x + a.largura > b.x && a.y < b.y + b.altura && a.y + a.altura > b.y;
}

function atualizarParticulas() { particulas = particulas.filter(p => p.vida > 0); particulas.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += gravidade; p.vida--; }); }

function desenharParticulas() { particulas.forEach(p => { ctx.fillStyle = p.cor.replace(')', `, ${p.vida/30})`); ctx.fillRect(p.x, p.y, p.tamanho, p.tamanho); }); }

function atualizar() {
    jogador.velX = controles.esquerda ? -jogador.velocidade : (controles.direita ? jogador.velocidade : 0);
    jogador.velY += gravidade;
    jogador.x += jogador.velX;
    jogador.y += jogador.velY;

    // Colisão com plataformas
    jogador.noChao = false;
    fases[nivelAtual].plataformas.forEach(p => {
        if (jogador.x < p.x + p.largura && jogador.x + jogador.largura > p.x &&
            jogador.y + jogador.altura > p.y && jogador.y + jogador.altura < p.y + p.altura + jogador.velY) {
            if (jogador.velY > 0) { jogador.noChao = true; jogador.velY = 0; jogador.y = p.y - jogador.altura; for(let i=0;i<5;i++) criarParticula(jogador.x+Math.random()*jogador.largura, jogador.y+jogador.altura, (Math.random()-0.5)*2, Math.random(), 'rgba(0, 200, 200, 0.6)'); }
        }
    });

    // Colisão com objetivo
    if (jogador.x < objetivo.x + objetivo.largura && jogador.x + jogador.largura > objetivo.x &&
        jogador.y < objetivo.y + objetivo.altura && jogador.y + jogador.altura > objetivo.y) {
        nivelAtual++;
        carregarFase(nivelAtual);
    }

    atualizarInimigos();
    atualizarParticulas();
    if (jogador.y > canvas.height) perderVida();
    frameCount++;
}

function atualizarInimigos() {
    inimigos.forEach(enemy => {
        enemy.velY += gravidade;
        enemy.x += enemy.velX;
        enemy.y += enemy.velY;
        enemy.noChao = false;

        const plataforma = fases[nivelAtual].plataformas.find(p =>
            enemy.x + enemy.largura > p.x && enemy.x < p.x + p.largura &&
            enemy.y + enemy.altura <= p.y + 10 && enemy.y + enemy.altura >= p.y - 30
        );

        if (plataforma) {
            if (enemy.velY > 0) {
                enemy.noChao = true;
                enemy.velY = 0;
                enemy.y = plataforma.y - enemy.altura;
            }
            enemy.territorio.min = plataforma.x;
            enemy.territorio.max = plataforma.x + plataforma.largura - enemy.largura;
        }

        const distancia = jogador.x + jogador.largura / 2 - (enemy.x + enemy.largura / 2);
        const visivel = Math.abs(distancia) < enemy.alerta;

        if (enemy.noChao) {
            if (visivel) {
                enemy.velX = Math.sign(distancia) * enemy.velocidade;
            } else {
                if (enemy.velX === 0) enemy.velX = enemy.velocidade * enemy.dir;
                if (enemy.x <= enemy.territorio.min) {
                    enemy.dir = 1;
                    enemy.velX = enemy.velocidade;
                }
                if (enemy.x >= enemy.territorio.max) {
                    enemy.dir = -1;
                    enemy.velX = -enemy.velocidade;
                }
            }
        }

        if (plataforma) {
            if (enemy.x < enemy.territorio.min) enemy.x = enemy.territorio.min;
            if (enemy.x > enemy.territorio.max) enemy.x = enemy.territorio.max;
        }

        if (colide(enemy, jogador)) {
            perderVida();
        }
    });
}

function desenhar() {
    // Gradiente de fundo
    const gradiente = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradiente.addColorStop(0, '#87CEEB');
    gradiente.addColorStop(0.5, '#E0F6FF');
    gradiente.addColorStop(1, '#90EE90');
    ctx.fillStyle = gradiente;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Overlay de transição
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, transicaoOpacity - 0.05)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    transicaoOpacity = Math.max(0, transicaoOpacity - 0.02);

    // Nuvens animadas
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    const nuvemY = 100 + Math.sin(frameCount * 0.01) * 20;
    ctx.beginPath();
    ctx.ellipse(100 + (frameCount % 800), nuvemY, 80, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(600 + ((frameCount * 0.8) % 800), nuvemY + 150, 100, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    // Plataformas com estilo 3D
    fases[nivelAtual].plataformas.forEach(p => {
        const platGradiente = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.altura);
        platGradiente.addColorStop(0, '#4ecca3');
        platGradiente.addColorStop(1, '#27ae60');
        ctx.fillStyle = platGradiente;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 5;
        ctx.fillRect(p.x, p.y, p.largura, p.altura);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 3;
        ctx.strokeRect(p.x, p.y, p.largura, p.altura);
    });

    // Objetivo com animação de estrela
    const objetivoAnimacao = Math.sin(frameCount * 0.05) * 5;
    const objetivoTamanho = 1 + Math.sin(frameCount * 0.04) * 0.1;
    ctx.save();
    ctx.translate(objetivo.x + objetivo.largura/2, objetivo.y + objetivo.altura/2 + objetivoAnimacao);
    ctx.scale(objetivoTamanho, objetivoTamanho);
    ctx.fillStyle = '#f1c40f';
    ctx.shadowColor = 'rgba(241, 196, 15, 0.6)';
    ctx.shadowBlur = 20;
    desenharEstrela(0, 0, 5, 20, 10);
    ctx.restore();

    desenharInimigos();
    desenharParticulas();

    // Jogador com brilho
    const playerGradiente = ctx.createLinearGradient(jogador.x, jogador.y, jogador.x, jogador.y + jogador.altura);
    playerGradiente.addColorStop(0, '#00ff88');
    playerGradiente.addColorStop(1, '#00d2ff');
    ctx.shadowColor = `rgba(0, 255, 136, ${jogador.brilho * 0.6})`;
    ctx.shadowBlur = 15;
    ctx.fillStyle = playerGradiente;
    ctx.fillRect(jogador.x, jogador.y, jogador.largura, jogador.altura);
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(jogador.x, jogador.y, jogador.largura, jogador.altura);

    // Olhos do jogador
    ctx.fillStyle = 'black';
    ctx.fillRect(jogador.x + 6, jogador.y + 8, 4, 4);
    ctx.fillRect(jogador.x + 15, jogador.y + 8, 4, 4);

    ctx.shadowColor = 'transparent';
}

function desenharInimigos() {
    inimigos.forEach(enemy => {
        ctx.fillStyle = enemy.cor;
        ctx.shadowColor = 'rgba(231, 76, 60, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillRect(enemy.x, enemy.y, enemy.largura, enemy.altura);
        ctx.fillStyle = 'black';
        ctx.fillRect(enemy.x + 5, enemy.y + 10, 5, 5);
        ctx.fillRect(enemy.x + enemy.largura - 10, enemy.y + 10, 5, 5);
        ctx.shadowColor = 'transparent';
    });
}

function desenharEstrela(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
}

function loop() { atualizar(); desenhar(); requestAnimationFrame(loop); }

carregarFase(nivelAtual);
loop();
