window.requestAnimationFrame = window.requestAnimationFrame || 
    window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || 
    function(callback) { setTimeout(callback, 16); };

var loaded = false;
var init = function () {
    if (loaded) return;
    loaded = true;

    var canvas = document.getElementById('heart');
    var ctx = canvas.getContext('2d', { alpha: true });
    var width = canvas.width = innerWidth;
    var height = canvas.height = innerHeight;
    var rand = Math.random;
    var isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());

    var message = "Não";   // ← Mude aqui

    var animationState = "heart";
    var stateTimer = 0;
    var heartParticles = [];
    var textParticles = [];

    // Coração
    var heartPosition = (rad) => [
        Math.pow(Math.sin(rad), 3),
        -(15 * Math.cos(rad) - 5 * Math.cos(2*rad) - 2 * Math.cos(3*rad) - Math.cos(4*rad))
    ];

    var scaleAndTranslate = (pos, sx, sy, dx, dy) => [dx + pos[0]*sx, dy + pos[1]*sy];

    window.addEventListener('resize', () => {
        width = canvas.width = innerWidth;
        height = canvas.height = innerHeight;
    });

    // Cria partículas do coração
    var traceCount = isMobile ? 18 : 32;
    var pointsOrigin = [];
    var dr = 0.082;
    for (let i = 0; i < Math.PI*2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 235, 15.5, 0, 0));
    for (let i = 0; i < Math.PI*2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 170, 11, 0, 0));
    for (let i = 0; i < Math.PI*2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 105, 6.5, 0, 0));

    var heartPointsCount = pointsOrigin.length;

    for (let i = 0; i < heartPointsCount; i++) {
        heartParticles.push({
            x: rand()*width, y: rand()*height,
            vx: 0, vy: 0,
            speed: 4 + rand()*5,
            q: ~~(rand()*heartPointsCount),
            force: 0.83,
            hue: 325 + rand()*45,
            alpha: 1,
            trace: Array.from({length: traceCount}, () => ({x: rand()*width, y: rand()*height}))
        });
    }

    var targetPoints = new Array(heartPointsCount);
    var pulse = (kx, ky) => {
        for (let i = 0; i < pointsOrigin.length; i++) {
            targetPoints[i] = [width/2 + kx * pointsOrigin[i][0], height/2 + ky * pointsOrigin[i][1]];
        }
    };

    var createTextParticles = () => {
        textParticles = [];
        var fontSize = Math.min(width, height) * 0.135;
        var textWidth = message.length * fontSize * 0.65;
        var startX = width/2 - textWidth/2;
        var startY = height * 0.47;

        for (let i = 0; i < message.length; i++) {
            let letter = message[i];
            let letterX = startX + i * (textWidth / message.length) + (textWidth / message.length)/2;

            let particlesPerLetter = isMobile ? 7 : 14;
            for (let j = 0; j < particlesPerLetter; j++) {
                textParticles.push({
                    x: rand() * width,
                    y: rand() * height * 0.75,
                    targetX: letterX,
                    targetY: startY + (rand()-0.5)*20,
                    vx: (rand()-0.5)*14,
                    vy: (rand()-0.5)*14 - 1,
                    size: fontSize * (0.7 + rand()*0.55),
                    color: `hsla(${335 + rand()*40}, 100%, ${70 + rand()*25}%, 1)`,
                    opacity: 0,
                    letter: letter
                });
            }
        }
    };

    var time = 0;
    var loop = function () {
        stateTimer += 0.016;

        // Transições
        if (animationState === "heart" && stateTimer > 5) {
            animationState = "explode"; stateTimer = 0;
        } else if (animationState === "explode" && stateTimer > 2.2) {
            animationState = "text"; stateTimer = 0;
            createTextParticles();
        } else if (animationState === "text" && stateTimer > 5) {
            animationState = "textExplode"; stateTimer = 0;
        } else if (animationState === "textExplode" && stateTimer > 2) {
            animationState = "heart"; stateTimer = 0;
            textParticles = [];
        }

        // Fade
        ctx.fillStyle = "rgba(5, 0, 15, 0.13)";
        ctx.fillRect(0, 0, width, height);

        // === CORAÇÃO + EXPLOSÃO ===
        if (animationState === "heart" || animationState === "explode") {
            let n = -Math.cos(time);
            pulse(0.9 + n*0.22, 0.9 + n*0.22);
            time += 0.021;

            for (let i = 0; i < heartParticles.length; i++) {
                let p = heartParticles[i];

                if (animationState === "explode") {
                    p.vx += (rand() - 0.5) * 7.5;
                    p.vy += (rand() - 0.5) * 7.5 - 3;
                    p.alpha = Math.max(0.05, p.alpha - 0.009);
                } else {
                    let t = targetPoints[p.q];
                    let dx = p.trace[0].x - t[0];
                    let dy = p.trace[0].y - t[1];
                    let d = Math.hypot(dx, dy) || 1;

                    if (d < 16) p.q = ~~(rand() * heartPointsCount);
                    else {
                        p.vx -= dx / d * p.speed;
                        p.vy -= dy / d * p.speed;
                    }
                }

                p.trace[0].x += p.vx;
                p.trace[0].y += p.vy;
                p.vx *= p.force;
                p.vy *= p.force;

                // Trail suave
                for (let k = 0; k < p.trace.length-1; k++) {
                    let a = p.trace[k], b = p.trace[k+1];
                    b.x = b.x*0.68 + a.x*0.32;
                    b.y = b.y*0.68 + a.y*0.32;
                }

                ctx.fillStyle = `hsla(${p.hue}, 100%, 82%, ${p.alpha})`;
                for (let k = 0; k < p.trace.length; k++) {
                    let sz = k < 5 ? 2.4 : 1.2;
                    ctx.fillRect(p.trace[k].x - sz/2, p.trace[k].y - sz/2, sz, sz);
                }
            }
        }

        // === TEXTO ===
        if (animationState === "text" || animationState === "textExplode") {
            for (let i = 0; i < textParticles.length; i++) {
                let p = textParticles[i];

                if (animationState === "text") {
                    p.x += (p.targetX - p.x) * 0.092;
                    p.y += (p.targetY - p.y) * 0.092;
                    p.opacity = Math.min(1, p.opacity + 0.032);
                } else {
                    p.x += p.vx; p.y += p.vy;
                    p.vx *= 0.97; p.vy *= 0.97;
                    p.vy += 0.25;
                    p.opacity -= 0.023;
                }

                ctx.save();
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.font = `bold ${p.size}px Arial`;
                ctx.fillStyle = p.color;
                ctx.shadowBlur = 8;
                ctx.shadowColor = p.color;
                ctx.fillText(p.letter, p.x, p.y);
                ctx.restore();
            }
        }

        requestAnimationFrame(loop);
    };

    loop();
};

if (['complete','
