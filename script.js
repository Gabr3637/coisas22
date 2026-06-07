window.requestAnimationFrame =
    window.__requestAnimationFrame ||
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    (function () {
        return function (callback, element) {
            var lastTime = element.__lastTime || 0;
            var currTime = Date.now();
            var timeToCall = Math.max(1, 33 - (currTime - lastTime));
            setTimeout(callback, timeToCall);
            element.__lastTime = currTime + timeToCall;
        };
    })();

var loaded = false;
var init = function () {
    if (loaded) return;
    loaded = true;

    var canvas = document.getElementById('heart');
    var ctx = canvas.getContext('2d');
    var width = canvas.width = innerWidth;
    var height = canvas.height = innerHeight;
    var rand = Math.random;
    var isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());

    var message = "Não";  // ← Altere aqui quando quiser

    var animationState = "heart";
    var stateTimer = 0;
    var heartParticles = [];
    var textParticles = [];

    // Coração
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
    window.addEventListener('resize', () => {
        width = canvas.width = innerWidth;
        height = canvas.height = innerHeight;
    });

    // Criar partículas do coração
    var traceCount = isMobile ? 20 : 35;
    var pointsOrigin = [];
    var dr = 0.085;
    for (let i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 230, 15, 0, 0));
    for (let i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 165, 11, 0, 0));
    for (let i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 105, 7, 0, 0));

    var heartPointsCount = pointsOrigin.length;

    for (let i = 0; i < heartPointsCount; i++) {
        heartParticles.push({
            x: rand() * width,
            y: rand() * height,
            vx: 0,
            vy: 0,
            speed: rand() * 4 + 5,
            q: ~~(rand() * heartPointsCount),
            force: 0.82,
            hue: 330 + rand() * 40,
            alpha: 1,
            trace: Array(traceCount).fill(0).map(() => ({x: rand()*width, y: rand()*height}))
        });
    }

    var targetPoints = new Array(heartPointsCount);

    var pulse = function (kx, ky) {
        for (let i = 0; i < pointsOrigin.length; i++) {
            targetPoints[i] = [
                width / 2 + kx * pointsOrigin[i][0],
                height / 2 + ky * pointsOrigin[i][1]
            ];
        }
    };

    var createTextParticles = function () {
        textParticles = [];
        var fontSize = Math.min(width, height) * 0.13;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = "center";

        var textWidth = ctx.measureText(message).width;
        var startX = width / 2 - textWidth / 2;
        var startY = height * 0.48;

        for (let i = 0; i < message.length; i++) {
            var letter = message[i];
            var letterX = startX + (textWidth / message.length) * (i + 0.5);

            // Mais partículas por letra para efeito bonito
            for (let j = 0; j < (isMobile ? 6 : 12); j++) {
                textParticles.push({
                    x: rand() * width,
                    y: rand() * height * 0.7,
                    targetX: letterX,
                    targetY: startY + (rand() - 0.5) * 15,
                    vx: (rand() - 0.5) * 12,
                    vy: (rand() - 0.5) * 12,
                    size: fontSize * (0.75 + rand() * 0.5),
                    color: `hsla(${340 + rand()*35}, 100%, ${65 + rand()*30}%, 1)`,
                    opacity: 0,
                    letter: letter
                });
            }
        }
    };

    var time = 0;
    var loop = function () {
        stateTimer += 0.016;

        // Controle de estados
        if (animationState === "heart" && stateTimer > 5.5) {
            animationState = "explode";
            stateTimer = 0;
        } else if (animationState === "explode" && stateTimer > 1.8) {
            animationState = "text";
            stateTimer = 0;
            createTextParticles();
        } else if (animationState === "text" && stateTimer > 5) {
            animationState = "textExplode";
            stateTimer = 0;
        } else if (animationState === "textExplode" && stateTimer > 2) {
            animationState = "heart";
            stateTimer = 0;
            textParticles = [];
        }

        // Fade background
        ctx.fillStyle = "rgba(8, 0, 18, 0.14)";
        ctx.fillRect(0, 0, width, height);

        if (animationState === "heart" || animationState === "explode") {
            var n = -Math.cos(time);
            pulse(0.92 + n * 0.18, 0.92 + n * 0.18);
            time += 0.022;

            for (let i = 0; i < heartParticles.length; i++) {
                let p = heartParticles[i];

                if (animationState === "explode") {
                    p.vx += (rand() - 0.5) * 6.5;
                    p.vy += (rand() - 0.5) * 6.5 - 2.5;
                    p.alpha = Math.max(0.1, p.alpha - 0.012);
                } else {
                    let target = targetPoints[p.q];
                    let dx = p.trace[0].x - target[0];
                    let dy = p.trace[0].y - target[1];
                    let dist = Math.hypot(dx, dy) || 1;

                    if (dist < 14) {
                        p.q = ~~(rand() * heartPointsCount);
                    } else {
                        p.vx += (dx / dist) * -p.speed;
                        p.vy += (dy / dist) * -p.speed;
                    }
                }

                p.trace[0].x += p.vx;
                p.trace[0].y += p.vy;
                p.vx *= p.force;
                p.vy *= p.force;

                // Trail
                for (let k = 0; k < p.trace.length - 1; k++) {
                    let a = p.trace[k];
                    let b = p.trace[k + 1];
                    b.x = b.x * 0.65 + a.x * 0.35;
                    b.y = b.y * 0.65 + a.y * 0.35;
                }

                ctx.fillStyle = `hsla(${p.hue}, 100%, 78%, ${p.alpha})`;
                for (let k = 0; k < p.trace.length; k++) {
                    let size = k < 4 ? 2.2 : 1.1;
                    ctx.fillRect(p.trace[k].x, p.trace[k].y, size, size);
                }
            }
        }

        // Texto
        if (animationState === "text" || animationState === "textExplode") {
            for (let i = 0; i < textParticles.length; i++) {
                let p = textParticles[i];

                if (animationState === "text") {
                    p.x += (p.targetX - p.x) * 0.085;
                    p.y += (p.targetY - p.y) * 0.085;
                    p.opacity = Math.min(1, p.opacity + 0.028);
                } else {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vx *= 0.975;
                    p.vy *= 0.975;
                    p.vy += 0.22;
                    p.opacity -= 0.022;
                }

                ctx.save();
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.font = `${p.size}px Arial`;
                ctx.fillStyle = p.color;
                ctx.fillText(p.letter, p.x, p.y);
                ctx.restore();
            }
        }

        requestAnimationFrame(loop);
    };

    loop();
};

if (document.readyState === 'complete' || document.readyState === 'loaded' || document.readyState === 'interactive') {
    init();
} else {
    document.addEventListener('DOMContentLoaded', init);
}
