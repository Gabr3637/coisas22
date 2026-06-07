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
            if (lastTime === undefined) lastTime = 0;
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

    var canvas = document.getElementById('heart');
    var ctx = canvas.getContext('2d');
    var width = canvas.width = innerWidth;
    var height = canvas.height = innerHeight;
    var rand = Math.random;
    var mobile = window.isDevice;

    // Configurações
    var message = "Não";                    // ← Mude aqui a mensagem
    var animationState = "heart";
    var stateTimer = 0;
    var textParticles = [];

    var heartPosition = function (rad) {
        return [
            Math.pow(Math.sin(rad), 3),
            -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))
        ];
    };

    var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
        return [dx + pos[0] * sx, dy + pos[1] * sy];
    };

    // Resize
    window.addEventListener('resize', function () {
        width = canvas.width = innerWidth;
        height = canvas.height = innerHeight;
    });

    // Criação do coração
    var traceCount = mobile ? 25 : 45;
    var pointsOrigin = [];
    var dr = 0.08;
    for (var i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 220, 14, 0, 0));
    for (var i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 160, 10, 0, 0));
    for (var i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 100, 6, 0, 0));

    var heartPointsCount = pointsOrigin.length;
    var targetPoints = [];
    var e = [];

    // Partículas do coração
    for (var i = 0; i < heartPointsCount; i++) {
        var x = rand() * width;
        var y = rand() * height;
        e[i] = {
            vx: 0, vy: 0,
            speed: rand() * 3 + 4,
            q: ~~(rand() * heartPointsCount),
            D: 2 * (i % 2) - 1,
            force: 0.85,
            hue: 340 + rand() * 30, // Tons de vermelho/rosa
            trace: []
        };
        for (var k = 0; k < traceCount; k++) e[i].trace[k] = {x: x, y: y};
    }

    var pulse = function (kx, ky) {
        for (var i = 0; i < pointsOrigin.length; i++) {
            targetPoints[i] = [
                kx * pointsOrigin[i][0] + width / 2,
                ky * pointsOrigin[i][1] + height / 2
            ];
        }
    };

    var createTextParticles = function() {
        textParticles = [];
        var fontSize = Math.min(width, height) * 0.12;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = "center";

        var textWidth = ctx.measureText(message).width;
        var startX = width / 2 - textWidth / 2;
        var startY = height * 0.48;

        var letterSpacing = textWidth / message.length;

        for (var i = 0; i < message.length; i++) {
            var letter = message[i];
            var letterX = startX + i * letterSpacing + letterSpacing / 2;

            // Múltiplas partículas por letra (melhor efeito)
            for (var j = 0; j < 8; j++) {
                textParticles.push({
                    x: rand() * width,
                    y: rand() * height * 0.6,
                    targetX: letterX,
                    targetY: startY,
                    vx: (rand() - 0.5) * 8,
                    vy: (rand() - 0.5) * 8,
                    color: `hsla(${340 + rand()*40}, 100%, ${60 + rand()*30}%, 1)`,
                    letter: letter,
                    size: fontSize * (0.7 + rand() * 0.6),
                    opacity: 0,
                    targetOpacity: 0.9 + rand() * 0.1
                });
            }
        }
    };

    var time = 0;
    var loop = function () {
        var n = -Math.cos(time);
        stateTimer += 0.016;

        // Controle de estados
        if (animationState === "heart" && stateTimer > 6) {
            animationState = "explode"; stateTimer = 0;
        } else if (animationState === "explode" && stateTimer > 1.2) {
            animationState = "text"; stateTimer = 0;
            createTextParticles();
        } else if (animationState === "text" && stateTimer > 5) {
            animationState = "textExplode"; stateTimer = 0;
        } else if (animationState === "textExplode" && stateTimer > 1.8) {
            animationState = "heart"; stateTimer = 0;
        }

        // Fade suave
        ctx.fillStyle = "rgba(10, 0, 15, 0.12)";
        ctx.fillRect(0, 0, width, height);

        if (animationState === "heart" || animationState === "explode") {
            pulse(0.9 + n * 0.2, 0.9 + n * 0.2);
            time += 0.018;

            for (var i = e.length - 1; i >= 0; i--) {
                var u = e[i];

                if (animationState === "explode") {
                    u.vx += (rand() - 0.5) * 4.5;
                    u.vy += (rand() - 0.5) * 4.5 - 1;
                } else {
                    var q = targetPoints[u.q];
                    var dx = u.trace[0].x - q[0];
                    var dy = u.trace[0].y - q[1];
                    var dist = Math.sqrt(dx * dx + dy * dy) || 1;

                    if (dist < 12) {
                        u.q = ~~(rand() * heartPointsCount);
                    } else {
                        u.vx += -dx / dist * u.speed;
                        u.vy += -dy / dist * u.speed;
                    }
                }

                u.trace[0].x += u.vx;
                u.trace[0].y += u.vy;
                u.vx *= u.force;
                u.vy *= u.force;

                // Trail
                for (var k = 0; k < u.trace.length - 1; k++) {
                    var T = u.trace[k];
                    var N = u.trace[k + 1];
                    N.x = N.x * 0.6 + T.x * 0.4;
                    N.y = N.y * 0.6 + T.y * 0.4;
                }

                // Desenho com glow
                ctx.fillStyle = `hsla(${u.hue}, 100%, 75%, 0.9)`;
                for (var k = 0; k < u.trace.length; k++) {
                    var size = k < 3 ? 1.8 : 1;
                    ctx.fillRect(u.trace[k].x, u.trace[k].y, size, size);
                }
            }
        } 
        else if (animationState === "text" || animationState === "textExplode") {
            for (var i = 0; i < textParticles.length; i++) {
                var p = textParticles[i];

                if (animationState === "text") {
                    p.x += (p.targetX - p.x) * 0.08;
                    p.y += (p.targetY - p.y) * 0.08;
                    p.opacity = Math.min(p.targetOpacity, p.opacity + 0.025);
                } else {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vx *= 0.975;
                    p.vy *= 0.975;
                    p.vy += 0.18; // gravidade
                    p.opacity -= 0.018;
                }

                ctx.save();
                ctx.globalAlpha = p.opacity;
                ctx.font = `${p.size}px Arial`;
                ctx.fillStyle = p.color;
                ctx.fillText(p.letter, p.x, p.y);
                ctx.restore();
            }
        }

        window.requestAnimationFrame(loop, canvas);
    };

    loop();
};

var s = document.readyState;
if (s === 'complete' || s === 'loaded' || s === 'interactive') init();
else document.addEventListener('DOMContentLoaded', init, false);
