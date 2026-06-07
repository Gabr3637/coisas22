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
    var canvas = document.getElementById('heart');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var width = canvas.width = innerWidth;
    var height = canvas.height = innerHeight;
    var rand = Math.random;

    var animationState = "heart"; // heart, explode, text, textExplode
    var stateTimer = 0;
    var message = "Não";

    var heartTargets = [];
    var textTargets = [];
    var particles = [];

    var heartPosition = function (rad) {
        return [
            Math.pow(Math.sin(rad), 3),
            -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))
        ];
    };

    var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
        return [dx + pos[0] * sx, dy + pos[1] * sy];
    };

    var buildHeartTargets = function () {
        heartTargets = [];

        var pointsOrigin = [];
        var dr = 0.1;

        for (var i = 0; i < Math.PI * 2; i += dr) {
            pointsOrigin.push(scaleAndTranslate(heartPosition(i), 210, 13, 0, 0));
        }
        for (var j = 0; j < Math.PI * 2; j += dr) {
            pointsOrigin.push(scaleAndTranslate(heartPosition(j), 150, 9, 0, 0));
        }
        for (var k = 0; k < Math.PI * 2; k += dr) {
            pointsOrigin.push(scaleAndTranslate(heartPosition(k), 90, 5, 0, 0));
        }

        var pulseX = 1;
        var pulseY = 1;
        for (var p = 0; p < pointsOrigin.length; p++) {
            heartTargets.push([
                pulseX * pointsOrigin[p][0] + width / 2,
                pulseY * pointsOrigin[p][1] + height / 2
            ]);
        }
    };

    var buildTextTargets = function () {
        textTargets = [];

        var offCanvas = document.createElement('canvas');
        offCanvas.width = width;
        offCanvas.height = height;
        var offCtx = offCanvas.getContext('2d');

        offCtx.clearRect(0, 0, width, height);
        offCtx.fillStyle = "#000";
        offCtx.fillRect(0, 0, width, height);
        offCtx.fillStyle = "#fff";
        offCtx.textAlign = "center";
        offCtx.textBaseline = "middle";

        var fontSize = Math.min(width * 0.14, height * 0.18);
        offCtx.font = "bold " + fontSize + "px Arial";

        var maxTextWidth = width * 0.78;
        var measured = offCtx.measureText(message).width;
        if (measured > maxTextWidth) {
            fontSize = fontSize * (maxTextWidth / measured);
            offCtx.font = "bold " + fontSize + "px Arial";
        }

        var textX = width / 2;
        var textY = height / 2;

        offCtx.fillText(message, textX, textY);

        var step = mobile ? 7 : 5;
        var imageData = offCtx.getImageData(0, 0, width, height).data;

        for (var y = 0; y < height; y += step) {
            for (var x = 0; x < width; x += step) {
                var idx = (y * width + x) * 4 + 3;
                if (imageData[idx] > 20) {
                    textTargets.push([
                        x + (rand() - 0.5) * 2,
                        y + (rand() - 0.5) * 2
                    ]);
                }
            }
        }

        if (textTargets.length === 0) {
            textTargets.push([width / 2, height / 2]);
        }
    };

    var createParticles = function () {
        particles = [];

        var count = heartTargets.length || 1;
        var traceCount = mobile ? 25 : 40;

        for (var i = 0; i < count; i++) {
            var x = rand() * width;
            var y = rand() * height;

            particles[i] = {
                x: x,
                y: y,
                vx: 0,
                vy: 0,
                q: i,
                force: 0.88 + rand() * 0.06,
                speed: 0.8 + rand() * 1.2,
                color: "hsla(0," + ~~(40 * rand() + 100) + "%," + ~~(60 * rand() + 20) + "%,.35)",
                trace: [],
                targetX: x,
                targetY: y,
                homeIndex: i,
                textIndex: i
            };

            for (var k = 0; k < traceCount; k++) {
                particles[i].trace[k] = { x: x, y: y };
            }
        }
    };

    var assignTargets = function (targetArray, kind) {
        if (!targetArray || targetArray.length === 0 || particles.length === 0) return;

        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            var idx = Math.floor(i * targetArray.length / particles.length);
            if (idx >= targetArray.length) idx = targetArray.length - 1;

            p.q = idx;
            p.targetX = targetArray[idx][0];
            p.targetY = targetArray[idx][1];

            if (kind === "heart") {
                p.color = "hsla(0," + ~~(40 * rand() + 100) + "%," + ~~(60 * rand() + 20) + "%,.35)";
            }
        }
    };

    var setState = function (nextState) {
        if (animationState === nextState) return;
        animationState = nextState;
        stateTimer = 0;

        if (nextState === "heart") {
            assignTargets(heartTargets, "heart");
        } else if (nextState === "text") {
            assignTargets(textTargets, "text");
        }
    };

    var rebuildScene = function () {
        width = canvas.width = innerWidth;
        height = canvas.height = innerHeight;

        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.fillRect(0, 0, width, height);

        buildHeartTargets();
        buildTextTargets();

        if (particles.length === 0) {
            createParticles();
        }

        if (animationState === "text" || animationState === "textExplode") {
            assignTargets(textTargets, "text");
        } else {
            assignTargets(heartTargets, "heart");
        }
    };

    window.addEventListener('resize', function () {
        rebuildScene();
    });

    buildHeartTargets();
    buildTextTargets();
    createParticles();
    assignTargets(heartTargets, "heart");

    var config = {
        traceK: mobile ? 0.34 : 0.4,
        timeDelta: 0.01
    };

    var time = 0;
    var last = 0;

    var loop = function (ts) {
        if (!last) last = ts;
        var dt = Math.min(0.05, (ts - last) / 1000 || config.timeDelta);
        last = ts;

        stateTimer += dt;

        if (animationState === "heart" && stateTimer > 5) {
            setState("explode");
        } else if (animationState === "explode" && stateTimer > 1) {
            setState("text");
        } else if (animationState === "text" && stateTimer > 5) {
            setState("textExplode");
        } else if (animationState === "textExplode" && stateTimer > 1) {
            setState("heart");
        }

        ctx.fillStyle = "rgba(0,0,0,.12)";
        ctx.fillRect(0, 0, width, height);

        var centerX = width / 2;
        var centerY = height / 2;

        if (animationState === "heart" || animationState === "text") {
            time += dt * (animationState === "heart" ? 1.1 : 0.8);

            for (var i = 0; i < particles.length; i++) {
                var u = particles[i];
                var tx = u.targetX;
                var ty = u.targetY;

                var dx = tx - u.x;
                var dy = ty - u.y;
                var dist = Math.sqrt(dx * dx + dy * dy) + 0.0001;

                var pull = animationState === "heart" ? 0.028 : 0.022;

                u.vx += (dx / dist) * pull * u.speed;
                u.vy += (dy / dist) * pull * u.speed;

                u.vx += (rand() - 0.5) * 0.02;
                u.vy += (rand() - 0.5) * 0.02;

                u.vx *= u.force;
                u.vy *= u.force;

                u.x += u.vx;
                u.y += u.vy;
            }
        } else if (animationState === "explode") {
            for (var j = 0; j < particles.length; j++) {
                var p = particles[j];
                var ex = p.x - centerX;
                var ey = p.y - centerY;
                var ed = Math.sqrt(ex * ex + ey * ey) + 0.0001;

                var impulse = 0.7 + rand() * 1.4;

                p.vx += (ex / ed) * impulse + (rand() - 0.5) * 0.8;
                p.vy += (ey / ed) * impulse + (rand() - 0.5) * 0.8;

                p.vx *= 0.98;
                p.vy *= 0.98;

                p.x += p.vx;
                p.y += p.vy;
            }
        } else if (animationState === "textExplode") {
            for (var m = 0; m < particles.length; m++) {
                var t = particles[m];

                t.vy += 0.04; // gravidade leve
                t.vx *= 0.985;
                t.vy *= 0.985;

                t.x += t.vx;
                t.y += t.vy;
            }
        }

        for (var a = 0; a < particles.length; a++) {
            var u2 = particles[a];

            if (u2.trace.length > 0) {
                u2.trace[0].x = u2.x;
                u2.trace[0].y = u2.y;
            }

            for (var b = 0; b < u2.trace.length - 1; b++) {
                var T = u2.trace[b];
                var N = u2.trace[b + 1];
                N.x -= config.traceK * (N.x - T.x);
                N.y -= config.traceK * (N.y - T.y);
            }

            ctx.fillStyle = u2.color;
            for (var c = 0; c < u2.trace.length; c++) {
                ctx.fillRect(u2.trace[c].x, u2.trace[c].y, 1, 1);
            }
        }

        window.requestAnimationFrame(loop, canvas);
    };

    window.requestAnimationFrame(loop, canvas);
};

var s = document.readyState;
if (s === 'complete' || s === 'loaded' || s === 'interactive') init();
else document.addEventListener('DOMContentLoaded', init, false);
