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
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, width, height);

    // Variáveis para controlar a animação
    var animationState = "heart"; // "heart", "explode", "text", "textExplode"
    var stateTimer = 0;
    var textParticles = [];
    var message = "TE AMO LORAYNE";

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
        ctx.fillStyle = "rgba(0,0,0,1)";
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
        var fontSize = Math.min(width, height) * 0.08;
        ctx.font = fontSize + "px Arial";
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
            var particlesPerLetter = 8; // Reduzido para evitar duplicação
            for (var j = 0; j < particlesPerLetter; j++) {
                // Distribuir as partículas em posições iniciais mais espalhadas
                var initialX = rand() * width;
                var initialY = rand() * height;
                
                textParticles.push({
                    x: initialX,
                    y: initialY,
                    targetX: letterX,
                    targetY: startY,
                    vx: (rand() - 0.5) * 5, // Velocidade inicial reduzida
                    vy: (rand() - 0.5) * 5, // Velocidade inicial reduzida
                    color: "hsla(0," + ~~(40 * rand() + 100) + "%," + ~~(60 * rand() + 20) + "%,.7)",
                    letter: letter,
                    size: fontSize * (0.8 + rand() * 0.2), // Menos variação no tamanho
                    force: 0.2 * rand() + 0.7,
                    speed: rand() + 5,
                    opacity: 0, // Começar invisível
                    targetOpacity: 0.7 + rand() * 0.3 // Opacidade alvo
                });
            }
        }
    };

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
            f: "hsla(0," + ~~(40 * rand() + 100) + "%," + ~~(60 * rand() + 20) + "%,.3)",
            trace: []
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
        
        if (animationState === "heart" && stateTimer > 5) {
            animationState = "explode";
            stateTimer = 0;
        } 
        else if (animationState === "explode" && stateTimer > 1) {
            animationState = "text";
            stateTimer = 0;
            createTextParticles();
        }
        else if (animationState === "text" && stateTimer > 5) {
            animationState = "textExplode";
            stateTimer = 0;
        }
        else if (animationState === "textExplode" && stateTimer > 1) {
            animationState = "heart";
            stateTimer = 0;
        }
        
        // Limpar tela
        ctx.fillStyle = "rgba(0,0,0,.1)";
        ctx.fillRect(0, 0, width, height);
        
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
        else if (animationState === "text" || animationState === "textExplode") {
            // Desenhar partículas de texto
            for (i = 0; i < textParticles.length; i++) {
                var p = textParticles[i];
                
                if (animationState === "text") {
                    // Mover partículas para formar o texto de forma mais suave
                    var dx = p.targetX - p.x;
                    var dy = p.targetY - p.y;
                    // Movimento mais lento e suave
                    p.x += dx * 0.03; // Reduzido de 0.1 para 0.03
                    p.y += dy * 0.03; // Reduzido de 0.1 para 0.03
                    
                    // Aumentar gradualmente a opacidade
                    if (p.opacity < p.targetOpacity) {
                        p.opacity += 0.01;
                    }
                } else {
                    // Explodir partículas
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vx *= 0.98;
                    p.vy *= 0.98;
                    p.vy += 0.1; // Gravidade
                    
                    // Diminuir gradualmente a opacidade
                    p.opacity -= 0.02;
                    if (p.opacity < 0) p.opacity = 0;
                }
                
                // Desenhar partícula com opacidade
                ctx.font = p.size + "px Arial";
                ctx.fillStyle = p.color.replace(".7)", p.opacity + ")");
                ctx.fillText(p.letter, p.x, p.y);
            }
        }

        window.requestAnimationFrame(loop, canvas);
    };
    loop();
};

var s = document.readyState;
if (s === 'complete' || s === 'loaded' || s === 'interactive') init();
else document.addEventListener('DOMContentLoaded', init, false);
