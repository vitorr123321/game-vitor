const canvas = document.getElementById('canvasJogo');
const ctx = canvas.getContext('2d');
const w = canvas.width, h = canvas.height;

const jogador = {
    x: 0, y: 0, largura: 34, altura: 48, 
    velX: 0, velY: 0, velocidade: 8, gravidade: 0.7, 
    pulosRestantes: 2, olhandoDireita: true,
    vidas: 10, invencivel: 0 
};

let estadoJogo = 'MENU'; 
let faseIndice = 0;
let pontuacao = 0;
let teclas = {};
let elementosFundo = []; // Nosso array de estrelas
let particulasLava = [];
let balas = [];

const biomas = [
    { ceu: ["#000005", "#0a0f1e"], plat: "#2d3748", lava: "#ff4500", bala: "#00ffff" },
    { ceu: ["#000005", "#0a1a16"], plat: "#38a169", lava: "#ccff33", bala: "#33ff33" },
    { ceu: ["#000000", "#111111"], plat: "#4a5568", lava: "#ff0000", bala: "#ff4444" }
];

function gerarFases() {
    let fases = [];
    for (let i = 0; i < 10; i++) {
        let b = biomas[i < 3 ? 0 : i < 7 ? 1 : 2];
        let plataformas = [{x: 50, y: 450, largura: 250, altura: 40}];
        let inimigos = [];
        let atualX = 250, atualY = 450;
        
        for (let j = 1; j <= 12; j++) {
            atualX += 200 + (Math.random() * 100); 
            atualY += (Math.random() - 0.5) * 200; 
            if (atualY < 200) atualY = 250; if (atualY > 500) atualY = 480;
            let novaPlat = { x: atualX, y: atualY, largura: 180, altura: 25 };
            plataformas.push(novaPlat);

            if (Math.random() > 0.4) {
                inimigos.push({
                    x: novaPlat.x + novaPlat.largura / 2,
                    y: novaPlat.y - 35,
                    vel: (1.2 + (i * 0.15)) * (Math.random() > 0.5 ? 1 : -1),
                    platPai: novaPlat,
                    anim: Math.random() * 10, morto: false, timerTiro: 100
                });
            }
        }
        let ultima = plataformas[plataformas.length - 1];
        fases.push({ b, plataformas, inimigos, objetivo: { x: ultima.x + 100, y: ultima.y - 80 } });
    }
    return fases;
}

let mapaFases = gerarFases();

function inicializar() {
    // Gerar Estrelas (Muitas!)
    // Criamos um campo estelar bem grande (w*10) para cobrir o movimento da câmera
    for(let i = 0; i < 400; i++) {
        elementosFundo.push({
            x: Math.random() * (w * 10),
            y: Math.random() * h,
            // Tamanho variado (0.5 a 2.5 pixels)
            w: 0.5 + Math.random() * 2,
            // Velocidade de paralaxe (0.1 a 0.5 da velocidade da câmera)
            v: 0.1 + Math.random() * 0.4,
            // Opacidade variada (0.2 a 0.8)
            o: 0.2 + Math.random() * 0.6
        });
    }
    requestAnimationFrame(loop);
}

function tomarDano() {
    if (jogador.invencivel > 0) return;
    jogador.vidas--;
    jogador.invencivel = 80;
    document.getElementById('coracoes').innerText = "❤️".repeat(jogador.vidas);
    if (jogador.vidas <= 0) {
        alert("FIM DE JOGO! Tente novamente, Vitor.");
        location.reload();
    }
}

function desenharBatman() {
    if (jogador.invencivel > 0 && Math.floor(Date.now() / 80) % 2 === 0) return;
    ctx.save();
    ctx.translate(jogador.x + 17, jogador.y + 40);
    if (!jogador.olhandoDireita) ctx.scale(-1, 1);
    
    // Capa Realista
    ctx.fillStyle = "#0a0a0a";
    let movCapa = Math.sin(Date.now() * 0.005) * 4;
    ctx.beginPath();
    ctx.moveTo(-15, -35);
    ctx.quadraticCurveTo(-25 + movCapa, 10, -18, 15);
    ctx.lineTo(10, 15);
    ctx.quadraticCurveTo(5, 0, 15, -35);
    ctx.fill();

    // Armadura
    let grad = ctx.createLinearGradient(-12, -35, 12, 0);
    grad.addColorStop(0, "#2d3748"); grad.addColorStop(1, "#1a202c");
    ctx.fillStyle = grad;
    ctx.fillRect(-12, -35, 24, 30);
    
    // Cinto
    ctx.fillStyle = "#d4af37"; ctx.fillRect(-13, -10, 26, 5);

    // Máscara e Olhos Glow
    ctx.fillStyle = "black"; ctx.beginPath(); ctx.arc(0, -42, 12, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-10, -45); ctx.lineTo(-12, -58); ctx.lineTo(-4, -48); ctx.fill();
    ctx.beginPath(); ctx.moveTo(10, -45); ctx.lineTo(12, -58); ctx.lineTo(4, -48); ctx.fill();
    
    ctx.fillStyle = "white"; ctx.shadowBlur = 8; ctx.shadowColor = "white";
    ctx.fillRect(-7, -45, 5, 2); ctx.fillRect(2, -45, 5, 2);
    ctx.restore();
}

function desenharRobo(ini) {
    if (ini.morto) return;
    ini.anim += 0.08;
    ctx.save();
    ctx.translate(ini.x, ini.y);
    let g = ctx.createLinearGradient(-15, -15, 15, 15);
    g.addColorStop(0, "#718096"); g.addColorStop(1, "#2d3748");
    ctx.fillStyle = g; ctx.fillRect(-15, -15, 30, 25);
    let p = Math.abs(Math.sin(ini.anim * 2));
    ctx.fillStyle = `rgba(0, 255, 255, ${0.4 + p * 0.6})`;
    ctx.shadowBlur = 10 * p; ctx.shadowColor = "#00ffff";
    ctx.fillRect(-8, -25, 16, 4);
    ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(-10, 12, 5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(10, 12, 5, 0, 7); ctx.fill();
    ctx.restore();
}

function desenharLavaMinecraft(camX, corBase) {
    const tam = 25;
    const colunas = Math.ceil(w / tam) + 2;
    ctx.save();
    ctx.shadowBlur = 20; ctx.shadowColor = corBase;
    for (let i = 0; i < colunas; i++) {
        for (let j = 0; j < 2; j++) {
            let x = (Math.floor(camX / tam) * tam) + (i * tam);
            let y = h - 40 + (j * tam);
            let varCor = Math.sin(Date.now() * 0.002 + i * 0.8);
            ctx.fillStyle = varCor > 0.5 ? "#ff8c00" : varCor > 0 ? "#ff4500" : "#d32f2f";
            ctx.fillRect(x, y + Math.sin(Date.now() * 0.003 + i) * 3, tam, tam);
        }
    }
    if (Math.random() > 0.9) particulasLava.push({ x: camX + Math.random() * w, y: h - 40, vy: -Math.random() * 3, vida: 20 });
    particulasLava.forEach((p, idx) => {
        ctx.fillStyle = "yellow"; ctx.fillRect(p.x, p.y, 4, 4);
        p.y += p.vy; p.vida--; if (p.vida <= 0) particulasLava.splice(idx, 1);
    });
    ctx.restore();
}

function loop() {
    ctx.clearRect(0, 0, w, h);
    const f = mapaFases[faseIndice];
    
    if (estadoJogo === 'MENU') {
        ctx.fillStyle = "black"; ctx.fillRect(0,0,w,h);
        ctx.textAlign = "center"; ctx.fillStyle = "gold"; ctx.font = "bold 45px Arial";
        ctx.fillText("ARKHAM NIGHT", w/2, h/2);
        ctx.fillStyle = "white"; ctx.font = "18px Arial"; ctx.fillText("CLIQUE OU PULE PARA INICIAR", w/2, h/2 + 50);
    } else {
        if (jogador.invencivel > 0) jogador.invencivel--;
        let camX = jogador.x - 300;
        ctx.save(); ctx.translate(-camX, 0);

        // --- NOVO DESENHO DO CÉU ESTRELADO ---
        // Fundo Sólido (Bioma)
        ctx.fillStyle = f.b.ceu[0]; ctx.fillRect(camX, 0, w, h);
        
        // Desenhar Estrelas com Paralaxe
        elementosFundo.forEach(e => {
            // A estrela é desenhada em sua posição X menos a câmera, 
            // multiplicada por seu fator de paralaxe (v).
            // Isso faz com que estrelas mais longe se movam mais devagar.
            let estrelaX = e.x - (camX * e.v);
            let estrelaY = e.y;
            
            // Loop Infinito: Se a estrela sair da tela pela esquerda, 
            // move ela lá pra direita do campo estelar.
            if (estrelaX < camX - e.w) e.x += (w * 10);
            if (estrelaX > camX + w) e.x -= (w * 10);

            // Desenhar a estrela (pequeno quadrado branco com opacidade variada)
            ctx.fillStyle = `rgba(255, 255, 255, ${e.o})`;
            ctx.fillRect(estrelaX, estrelaY, e.w, e.w);
        });
        // -------------------------------------

        desenharLavaMinecraft(camX, f.b.lava);

        f.plataformas.forEach(p => { 
            ctx.fillStyle = f.b.plat; ctx.fillRect(p.x, p.y, p.largura, p.altura);
            ctx.fillStyle = "rgba(255,255,255,0.1)"; ctx.fillRect(p.x, p.y, p.largura, 4);
        });

        f.inimigos.forEach(ini => {
            if(ini.morto) return;
            ini.x += ini.vel;
            if (ini.x < ini.platPai.x + 10 || ini.x > ini.platPai.x + ini.platPai.largura - 10) ini.vel *= -1;

            if (Math.abs(jogador.y - ini.y) < 100 && Math.abs(jogador.x - ini.x) < 400) {
                if (--ini.timerTiro <= 0) {
                    let dir = jogador.x > ini.x ? 1 : -1;
                    balas.push({ x: ini.x, y: ini.y - 10, vx: dir * 7, vy: 0, cor: f.b.bala });
                    ini.timerTiro = 120;
                }
            }

            if(Math.abs(jogador.x+15 - ini.x) < 25 && Math.abs(jogador.y+20 - ini.y) < 30) {
                if(jogador.velY > 0 && jogador.y < ini.y - 20) { ini.morto=true; jogador.velY=-12; pontuacao+=500; }
                else tomarDano();
            }
            desenharRobo(ini);
        });

        balas.forEach((b, i) => {
            b.x += b.vx; ctx.fillStyle = b.cor; ctx.shadowBlur = 8; ctx.shadowColor = b.cor;
            ctx.fillRect(b.x, b.y, 12, 4); ctx.shadowBlur = 0;
            if(Math.abs(b.x - (jogador.x+15)) < 20 && Math.abs(b.y - (jogador.y+20)) < 20) { tomarDano(); balas.splice(i, 1); }
        });

        if(teclas['KeyA'] || teclas['ArrowLeft']) { jogador.velX = -jogador.velocidade; jogador.olhandoDireita = false; }
        else if(teclas['KeyD'] || teclas['ArrowRight']) { jogador.velX = jogador.velocidade; jogador.olhandoDireita = true; }
        else jogador.velX *= 0.8;
        
        jogador.velY += jogador.gravidade; jogador.x += jogador.velX; jogador.y += jogador.velY;

        f.plataformas.forEach(p => {
            if(jogador.x+25 > p.x && jogador.x < p.x+p.largura && jogador.y+48 > p.y && jogador.y+48 < p.y+p.altura+jogador.velY) {
                if(jogador.velY > 0) { jogador.velY = 0; jogador.y = p.y-48; jogador.pulosRestantes = 2; }
            }
        });

        if(jogador.y > h - 50) { tomarDano(); jogador.x = f.plataformas[0].x; jogador.y = f.plataformas[0].y-100; }
        
        ctx.fillStyle = "gold"; ctx.fillRect(f.objetivo.x, f.objetivo.y, 40, 80);
        if(Math.hypot(jogador.x-f.objetivo.x, jogador.y-f.objetivo.y) < 60) {
            faseIndice++; if(faseIndice >= 10) { alert("PARABÉNS VITOR! VOCÊ ESCAPOU!"); location.reload(); }
            else { jogador.x = 100; jogador.y = 200; balas = []; }
        }

        desenharBatman(); ctx.restore();
        document.getElementById('score').innerText = pontuacao;
        document.getElementById('faseAtual').innerText = faseIndice + 1;
    }
    requestAnimationFrame(loop);
}

const pular = () => { 
    if(estadoJogo === 'MENU') { estadoJogo = 'JOGANDO'; jogador.x = 100; jogador.y = 200; }
    else if(jogador.pulosRestantes > 0) { jogador.velY = -14; jogador.pulosRestantes--; } 
};

window.onkeydown = e => teclas[e.code] = true;
window.onkeyup = e => teclas[e.code] = false;
canvas.onclick = pular;
document.getElementById('btnAction').onclick = pular;
document.getElementById('btnLeft').onmousedown = () => teclas['KeyA'] = true;
document.getElementById('btnLeft').onmouseup = () => teclas['KeyA'] = false;
document.getElementById('btnRight').onmousedown = () => teclas['KeyD'] = true;
document.getElementById('btnRight').onmouseup = () => teclas['KeyD'] = false;

inicializar();