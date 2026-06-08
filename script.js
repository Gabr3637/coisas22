window.requestAnimationFrame =
    window.__requestAnimationFrame ||
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        (function () {
            return function (callback, element) {
                var lastTime = element.__lastTime;
                if (lastTime === undefined) {
                    lastTime = 0;
                }
                var currTime = Date.now();
                var timeToCall = Math.max(1, 33 - (currTime - lastTime));
                window.setTimeout(callback, timeToCall);
                element.__lastTime = currTime + timeToCall;
            };
        })();
window.isDevice = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(((navigator.userAgent || navigator.vendor || window.opera)).toLowerCase()));
var loaded = false;
var init = function () {
    if (loaded) return;
    loaded = true;
    var mobile = window.isDevice;
    var koef = 1; // Usando escala completa para todos os dispositivos
    var canvas = document.getElementById('heart');
    var ctx = canvas.getContext('2d');
    var width = canvas.width = innerWidth;
    var height = canvas.height = innerHeight;
    var rand = Math.random;
    ctx.fillStyle = "rgba(10,5,8,1)";
    ctx.fillRect(0, 0, width, height);

    // Inicializar música
    var audioElement = document.getElementById('lullaby');
    var musicStarted = false;

    // Variáveis para controlar a animação
    var animationState = "heart"; // "heart", "explode", "text", "textFade", "textExplode"
    var stateTimer = 0;
    var textParticles = [];
    var message = "Lory❤️";
    var firstFrameOfState = true; // Flag para limpeza no início de cada estado
    var textStateStarted = false; // Flag para detectar quando o estado "text" começou

    var heartPosition = function (rad) {
        //return [Math.sin(rad), Math.cos(rad)];
        return [Math.pow(Math.sin(rad), 3), -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))];
    };
    var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
        return [dx + pos[0] * sx, dy + pos[1] * sy];
    };

    window.addEventListener('resize', function () {
        width = canvas.width = innerWidth;
        height = canvas.height = innerHeight;
        ctx.fillStyle = "rgba(10,5,8,1)";
        ctx.fillRect(0, 0, width, height);
    });

    var traceCount = mobile ? 30 : 50;
    var pointsOrigin = [];
    var i;
    var dr = 0.1; // Mesmo valor para mobile e desktop para melhor qualidade
    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 210, 13, 0, 0));
    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 150, 9, 0, 0));
    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 90, 5, 0, 0));
    var heartPointsCount = pointsOrigin.length;

    var targetPoints = [];
    var pulse = function (kx, ky) {
        for (i = 0; i < pointsOrigin.length; i++) {
            targetPoints[i] = [];
            targetPoints[i][0] = kx * pointsOrigin[i][0] + width / 2;
            targetPoints[i][1] = ky * pointsOrigin[i][1] + height / 2;
        }
    };

    // Função para criar partículas de texto
    var createTextParticles = function() {
        textParticles = [];
        // AUMENTADO: 3x maior que o anterior (0.08 * 3 = 0.24)
        var fontSize = Math.min(width, height) * 0.24;
        ctx.font = "700 " + fontSize + "px 'Tangerine', cursive";
        ctx.textAlign = "center";
        
        var textWidth = ctx.measureText(message).width;
        var startX = width / 2 - textWidth / 2;
        var startY = height / 2;
        
        // Criar partículas para cada letra
        var letterSpacing = textWidth / message.length;
        for (var i = 0; i < message.length; i++) {
            var letter = message[i];
            var letterX = startX + i * letterSpacing + letterSpacing / 2;
            
            // Criar apenas uma partícula por letra para evitar duplicação
            var particlesPerLetter = 1;
            for (var j = 0; j < particlesPerLetter; j++) {
                // Começar DO CENTRO (onde o coração explodiu)
                var initialX = width / 2;
                var initialY = height / 2;
                
                textParticles.push({
                    x: initialX,
                    y: initialY,
                    targetX: letterX,
                    targetY: startY,
                    vx: 0,
                    vy: 0,
                    color: "hsla(0," + ~~(40 * rand() + 100) + "%," + ~~(60 * rand() + 20) + "%,.7)",
                    letter: letter,
                    size: fontSize * (0.95 + rand() * 0.1), // Tamanho mais consistente
                    force: 0.2 * rand() + 0.7,
                    speed: rand() + 5,
                    opacity: 0,
                    targetOpacity: 1, // Totalmente opaco para melhor destaque
                    delay: i * 0.15, // Atraso para cada letra aparecer sequencialmente
                    hasAppeared: false,
                    glowOpacity: 0, // Opacidade do brilho
                    targetGlowOpacity: 0.8 // Brilho forte
                });
            }
        }
    };

    // Cores vermelhas intensas, profundas e vibrantes para melhor variação - PALETA ROMÂNTICA
    var redColors = [
        "hsla(0, 100%, 50%, .3)",      // Vermelho brilhante puro
        "hsla(0, 95%, 45%, .3)",       // Vermelho escarlate profundo
        "hsla(0, 100%, 42%, .3)",      // Vermelho carmim intenso
        "hsla(0, 90%, 40%, .3)",       // Vermelho profundo escuro
        "hsla(0, 100%, 48%, .3)",      // Vermelho vívido
        "hsla(0, 92%, 38%, .3)",       // Vermelho bordo profundo
        "hsla(0, 98%, 46%, .3)",       // Vermelho rubi
        "hsla(0, 100%, 52%, .3)",      // Vermelho luminoso
        "hsla(0, 88%, 44%, .3)",       // Vermelho marrom avermelhado
        "hsla(0, 96%, 41%, .3)"        // Vermelho cereja
    ];

    var e = [];
    for (i = 0; i < heartPointsCount; i++) {
        var x = rand() * width;
        var y = rand() * height;
        e[i] = {
            vx: 0,
            vy: 0,
            R: 2,
            speed: rand() + 5,
            q: ~~(rand() * heartPointsCount),
            D: 2 * (i % 2) - 1,
            force: 0.2 * rand() + 0.7,
            f: redColors[~~(rand() * redColors.length)],
            trace: [],
            particleOpacity: 1 // Opacidade das partículas
        };
        for (var k = 0; k < traceCount; k++) e[i].trace[k] = {x: x, y: y};
    }

    var config = {
        traceK: 0.4,
        timeDelta: 0.01
    };

    var time = 0;
    var loop = function () {
        var n = -Math.cos(time);
        
        // Gerenciar estados da animação
        stateTimer += 0.01;
        var oldAnimationState = animationState;
        
        // TIMING AJUSTADO:
        // 0-6 segundos: coração pulsando
        // 6-7 segundos: explosão
        // 7-11 segundos: texto aparecendo e brilhando
        // 11-12 segundos: texto desaparecendo
        // Após 12 segundos: reinicia

        if (animationState === "heart" && stateTimer > 6) {
            animationState = "explode";
            stateTimer = 0;
            firstFrameOfState = true;
            textStateStarted = false;
        } 
        else if (animationState === "explode" && stateTimer > 1) {
            animationState = "text";
            stateTimer = 0;
            firstFrameOfState = true;
            textStateStarted = true;
            createTextParticles();
            
            // MÚSICA: Quando o texto começa (6 segundos depois), pular para o segundo 23
            if (audioElement && musicStarted) {
                audioElement.currentTime = 23;
            }
            
            // Resetar opacidade das partículas - começar a desaparecer imediatamente
            for (i = 0; i < e.length; i++) {
                e[i].particleOpacity = 1;
            }
        }
        else if (animationState === "text" && stateTimer > 4) {
            animationState = "textFade";
            stateTimer = 0;
            firstFrameOfState = true;
        }
        else if (animationState === "textFade" && stateTimer > 1) {
            animationState = "heart";
            stateTimer = 0;
            firstFrameOfState = true;
            textStateStarted = false;
            
            // MÚSICA: Quando a animação reinicia, resetar a música para o início
            if (audioElement) {
                audioElement.currentTime = 0;
                if (!musicStarted) {
                    musicStarted = true;
                    audioElement.play().catch(function(error) {
                        console.log("Erro ao reproduzir áudio:", error);
                    });
                }
            }
        }
        
        // Limpar tela - usar clearRect no primeiro frame de cada estado
        if (firstFrameOfState) {
            ctx.fillStyle = "rgba(10,5,8,1)";
            ctx.fillRect(0, 0, width, height);
            firstFrameOfState = false;
        } else {
            // Após o primeiro frame, usar rastro muito leve com fundo escuro
            ctx.fillStyle = "rgba(10,5,8,.08)";
            ctx.fillRect(0, 0, width, height);
        }
        
        if (animationState === "heart" || animationState === "explode") {
            pulse((1 + n) * .5, (1 + n) * .5);
            time += ((Math.sin(time)) < 0 ? 9 : (n > 0.8) ? .2 : 1) * config.timeDelta;
            
            // Desenhar coração
            for (i = e.length; i--;) {
                var u = e[i];
                
                // Se estiver no estado de explosão, adicionar velocidade aleatória
                if (animationState === "explode") {
                    u.vx += (rand() - 0.5) * 2;
                    u.vy += (rand() - 0.5) * 2;
                } else {
                    var q = targetPoints[u.q];
                    var dx = u.trace[0].x - q[0];
                    var dy = u.trace[0].y - q[1];
                    var length = Math.sqrt(dx * dx + dy * dy);
                    if (10 > length) {
                        if (0.95 < rand()) {
                            u.q = ~~(rand() * heartPointsCount);
                        }
                        else {
                            if (0.99 < rand()) {
                                u.D *= -1;
                            }
                            u.q += u.D;
                            u.q %= heartPointsCount;
                            if (0 > u.q) {
                                u.q += heartPointsCount;
                            }
                        }
                    }
                    u.vx += -dx / length * u.speed;
                    u.vy += -dy / length * u.speed;
                }
                
                u.trace[0].x += u.vx;
                u.trace[0].y += u.vy;
                u.vx *= u.force;
                u.vy *= u.force;
                for (k = 0; k < u.trace.length - 1;) {
                    var T = u.trace[k];
                    var N = u.trace[++k];
                    N.x -= config.traceK * (N.x - T.x);
                    N.y -= config.traceK * (N.y - T.y);
                }
                ctx.fillStyle = u.f;
                for (k = 0; k < u.trace.length; k++) {
                    ctx.fillRect(u.trace[k].x, u.trace[k].y, 1, 1);
                }
            }
        } 
        else if (animationState === "text" || animationState === "textFade") {
            // Desenhar partículas que explodiram com opacidade reduzida rapidamente
            for (i = e.length; i--;) {
                var u = e[i];
                
                if (animationState === "text") {
                    // AUMENTADO: Reduzir opacidade MUITO mais rápido (0.05 em vez de 0.01)
                    u.particleOpacity -= 0.05;
                    if (u.particleOpacity < 0) u.particleOpacity = 0;
                } else if (animationState === "textFade") {
                    // Diminuir opacidade das partículas ainda mais
                    u.particleOpacity -= 0.02;
                    if (u.particleOpacity < 0) u.particleOpacity = 0;
                }
                
                // Desenhar partículas com opacidade
                if (u.particleOpacity > 0) {
                    var originalColor = u.f;
                    // Extrair os valores HSLA e aplicar opacidade
                    var colorParts = originalColor.match(/[\d.]+/g);
                    ctx.fillStyle = "hsla(" + colorParts[0] + "," + colorParts[1] + "%," + colorParts[2] + "%," + (u.particleOpacity * 0.5) + ")";
                    
                    for (k = 0; k < u.trace.length; k++) {
                        ctx.fillRect(u.trace[k].x, u.trace[k].y, 1, 1);
                    }
                }
            }
            
            // Desenhar texto por cima das partículas com efeito GLOW INTENSO E ROMÂNTICO
            for (i = 0; i < textParticles.length; i++) {
                var p = textParticles[i];
                
                if (animationState === "text") {
                    // Verificar se é hora desta letra aparecer
                    if (stateTimer >= p.delay) {
                        if (!p.hasAppeared) {
                            p.hasAppeared = true;
                        }
                        
                        // Mover partículas para formar o texto
                        var dx = p.targetX - p.x;
                        var dy = p.targetY - p.y;
                        // Movimento mais rápido e direto
                        p.x += dx * 0.12;
                        p.y += dy * 0.12;
                        
                        // Aumentar gradualmente a opacidade
                        if (p.opacity < p.targetOpacity) {
                            p.opacity += 0.05; // Mais rápido para aparecer
                        }
                        
                        // Aumentar opacidade do brilho
                        if (p.glowOpacity < p.targetGlowOpacity) {
                            p.glowOpacity += 0.04;
                        }
                    }
                } else {
                    // textFade - diminuir opacidade
                    p.opacity -= 0.02;
                    if (p.opacity < 0) p.opacity = 0;
                    
                    // Diminuir brilho também
                    p.glowOpacity -= 0.02;
                    if (p.glowOpacity < 0) p.glowOpacity = 0;
                }
                
                // Desenhar partícula com opacidade e EFEITO GLOW INTENSO E ROMÂNTICO
                if (p.opacity > 0) {
                    ctx.font = "700 " + p.size + "px 'Tangerine', cursive";
                    
                    // NOVO: Desenhar múltiplas camadas de brilho (glow) em vermelho intenso
                    // Aumentado: 25 camadas em vez de 15 para glow MUITO mais intenso
                    for (var glowIndex = 25; glowIndex > 0; glowIndex--) {
                        var glowSize = glowIndex * 1.5; // Aumentado para brilho muito maior
                        var glowAlpha = p.glowOpacity * (1 - (glowIndex / 25)) * 0.7; // Muito mais intenso
                        
                        // Gradiente de cores vermelhas para efeito romântico perfeito
                        var hue = 0; // Vermelho puro
                        var saturation = 100 - (glowIndex / 25) * 15; // Desatura ligeiramente conforme afasta
                        var lightness = 45 + (glowIndex / 25) * 15; // Fica mais claro conforme afasta
                        
                        ctx.fillStyle = "hsla(" + hue + ", " + saturation + "%, " + lightness + "%, " + glowAlpha + ")";
                        ctx.shadowColor = "hsla(" + hue + ", " + saturation + "%, " + lightness + "%, " + glowAlpha + ")";
                        ctx.shadowBlur = glowSize;
                        ctx.shadowOffsetX = 0;
                        ctx.shadowOffsetY = 0;
                        ctx.fillText(p.letter, p.x, p.y);
                    }
                    
                    // Resetar shadow para não afetar próximas renderizações
                    ctx.shadowColor = "transparent";
                    ctx.shadowBlur = 0;
                    
                    // Desenhar o texto branco brilhante em cima
                    ctx.fillStyle = "rgba(255, 230, 230, " + p.opacity + ")";
                    ctx.fillText(p.letter, p.x, p.y);
                    
                    // Desenhar um contorno em vermelho intenso para mais definição e romance
                    ctx.fillStyle = "rgba(255, 20, 50, " + (p.opacity * 0.95) + ")";
                    ctx.fillText(p.letter, p.x, p.y);
                    
                    // Camada adicional de brilho branco no centro
                    ctx.fillStyle = "rgba(255, 245, 245, " + (p.opacity * 0.9) + ")";
                    ctx.fillText(p.letter, p.x, p.y);
                }
            }
        }

        window.requestAnimationFrame(loop, canvas);
    };
    loop();
};

var s = document.readyState;
if (s === 'complete' || s === 'loaded' || s === 'interactive') init();
else document.addEventListener('DOMContentLoaded', init, false);
