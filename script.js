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
    var koef = mobile ? 0.5 : 1;
    var canvas = document.getElementById('heart');
    var ctx = canvas.getContext('2d');
    var width = canvas.width = koef * innerWidth;
    var height = canvas.height = koef * innerHeight;
    var rand = Math.random;
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, width, height);

    var heartPosition = function (rad) {
        //return [Math.sin(rad), Math.cos(rad)];
        return [Math.pow(Math.sin(rad), 3), -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))];
    };
    var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
        return [dx + pos[0] * sx, dy + pos[1] * sy];
    };

    window.addEventListener('resize', function () {
        width = canvas.width = koef * innerWidth;
        height = canvas.height = koef * innerHeight;
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.fillRect(0, 0, width, height);
    });

    var traceCount = mobile ? 20 : 50;
    var pointsOrigin = [];
    var i;
    var dr = mobile ? 0.3 : 0.1;
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
            f: "hsla(0," + ~~(40 * rand() + 60) + "%," + ~~(60 * rand() + 20) + "%,.3)",
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
        pulse((1 + n) * .5, (1 + n) * .5);
        time += ((Math.sin(time)) < 0 ? 9 : (n > 0.8) ? .2 : 1) * config.timeDelta;
        ctx.fillStyle = "rgba(0,0,0,.1)";
        ctx.fillRect(0, 0, width, height);
        for (i = e.length; i--;) {
            var u = e[i];
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
        //ctx.fillStyle = "rgba(255,255,255,1)";
        //for (i = u.trace.length; i--;) ctx.fillRect(targetPoints[i][0], targetPoints[i][1], 2, 2);

        window.requestAnimationFrame(loop, canvas);
    };
    loop();
};


var s = document.readyState;
if (s === 'complete' || s === 'loaded' || s === 'interactive') init();
else document.addEventListener('DOMContentLoaded', init, false);

var initGarden = function () {
    var canvas = document.getElementById('garden');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var mobile = window.isDevice;
    var koef = mobile ? 0.5 : 1;
    var width;
    var height;
    var points = [];
    var groups = [];
    var agents = [];
    var gardenTime = 0;
    var rand = Math.random;
    var traceCount = mobile ? 10 : 18;

    var colors = {
        grass: ['hsla(133,75%,45%,.42)', 'hsla(155,80%,54%,.48)', 'hsla(96,72%,48%,.38)'],
        cherry: ['hsla(338,100%,72%,.62)', 'hsla(350,100%,84%,.68)', 'hsla(325,88%,65%,.56)'],
        cherryWhite: ['hsla(345,70%,90%,.62)', 'hsla(18,100%,92%,.7)', 'hsla(330,75%,76%,.52)'],
        orchid: ['hsla(278,92%,72%,.62)', 'hsla(302,95%,68%,.64)', 'hsla(255,86%,76%,.56)'],
        orchidBlue: ['hsla(228,100%,74%,.62)', 'hsla(252,92%,78%,.66)', 'hsla(203,95%,68%,.54)'],
        lotus: ['hsla(187,95%,68%,.62)', 'hsla(211,100%,74%,.66)', 'hsla(170,82%,62%,.54)'],
        lotusPink: ['hsla(330,100%,74%,.64)', 'hsla(350,100%,84%,.7)', 'hsla(305,82%,68%,.54)'],
        chrysanthemum: ['hsla(38,100%,62%,.66)', 'hsla(51,100%,72%,.68)', 'hsla(20,100%,62%,.56)'],
        chrysanthemumRed: ['hsla(4,100%,62%,.66)', 'hsla(20,100%,70%,.7)', 'hsla(345,95%,58%,.56)'],
        spiderOrange: ['hsla(27,100%,54%,.72)', 'hsla(42,100%,65%,.72)', 'hsla(8,100%,52%,.6)']
    };

    var addPoint = function (x, y, color, sway, phase) {
        points.push({
            x: x,
            y: y,
            color: color,
            sway: sway || 0,
            phase: phase || rand() * Math.PI * 2
        });
    };

    var addGroup = function (color, draw, density) {
        var start = points.length;
        draw(color);
        var end = points.length;

        if (end > start) {
            groups.push({
                start: start,
                end: end,
                color: color,
                density: density || 1
            });
        }
    };

    var addLine = function (x1, y1, x2, y2, color, count, sway) {
        for (var i = 0; i < count; i++) {
            var t = count === 1 ? 0 : i / (count - 1);
            addPoint(
                x1 + (x2 - x1) * t,
                y1 + (y2 - y1) * t,
                color,
                sway * t
            );
        }
    };

    var addCircle = function (cx, cy, radius, color, count, squash) {
        for (var i = 0; i < count; i++) {
            var angle = Math.PI * 2 * i / count;
            addPoint(
                cx + Math.cos(angle) * radius,
                cy + Math.sin(angle) * radius * (squash || 1),
                color,
                1.2
            );
        }
    };

    var addPetal = function (cx, cy, length, petalWidth, angle, color, steps) {
        var directionX = Math.cos(angle);
        var directionY = Math.sin(angle);
        var sideX = -directionY;
        var sideY = directionX;
        var i;

        for (i = 0; i <= steps; i++) {
            var t = i / steps;
            var breadth = petalWidth * Math.sin(Math.PI * t) * (0.55 + 0.45 * t);
            addPoint(
                cx + directionX * length * t + sideX * breadth,
                cy + directionY * length * t + sideY * breadth,
                color,
                1.8 * t
            );
        }

        for (i = steps; i >= 0; i--) {
            var backT = i / steps;
            var backBreadth = petalWidth * Math.sin(Math.PI * backT) * (0.55 + 0.45 * backT);
            addPoint(
                cx + directionX * length * backT - sideX * backBreadth,
                cy + directionY * length * backT - sideY * backBreadth,
                color,
                1.8 * backT
            );
        }
    };

    var addCurvedPetal = function (cx, cy, length, curve, angle, color, steps) {
        var directionX = Math.cos(angle);
        var directionY = Math.sin(angle);
        var sideX = -directionY;
        var sideY = directionX;

        for (var i = 0; i <= steps; i++) {
            var t = i / steps;
            var hook = Math.sin(t * Math.PI * 0.92) * curve * t;
            addPoint(
                cx + directionX * length * t + sideX * hook,
                cy + directionY * length * t + sideY * hook,
                color,
                2.4 * t
            );
        }
    };

    var addSerratedLeaf = function (cx, cy, length, leafWidth, angle, color) {
        var directionX = Math.cos(angle);
        var directionY = Math.sin(angle);
        var sideX = -directionY;
        var sideY = directionX;
        var teeth = mobile ? 6 : 10;
        var side;

        for (side = -1; side <= 1; side += 2) {
            for (var i = 0; i <= teeth; i++) {
                var t = i / teeth;
                var breadth = leafWidth * Math.sin(Math.PI * t);
                var serration = i % 2 === 0 ? 1 : 0.55;
                addPoint(
                    cx + directionX * length * t + sideX * breadth * serration * side,
                    cy + directionY * length * t + sideY * breadth * serration * side,
                    color,
                    1.3 * t
                );
            }
        }

        addLine(
            cx,
            cy,
            cx + directionX * length,
            cy + directionY * length,
            color,
            mobile ? 5 : 9,
            1
        );
    };

    var addLeaf = function (cx, cy, length, leafWidth, angle, color) {
        addPetal(cx, cy, length, leafWidth, angle, color, mobile ? 7 : 11);
        addLine(
            cx,
            cy,
            cx + Math.cos(angle) * length,
            cy + Math.sin(angle) * length,
            color,
            mobile ? 5 : 8,
            1
        );
    };

    var addStem = function (x, groundY, flowerY, lean) {
        addGroup(colors.grass[1], function (color) {
            var steps = mobile ? 12 : 22;
            for (var i = 0; i < steps; i++) {
                var t = i / (steps - 1);
                addPoint(
                    x + Math.sin(t * Math.PI) * lean,
                    groundY + (flowerY - groundY) * t,
                    color,
                    2.2 * t
                );
            }
        });
    };

    var addCherryBlossom = function (cx, cy, scale, palette) {
        palette = palette || colors.cherry;
        addGroup(palette[0], function (color) {
            for (var petal = 0; petal < 5; petal++) {
                addPetal(
                    cx,
                    cy,
                    31 * scale,
                    12 * scale,
                    -Math.PI / 2 + petal * Math.PI * 2 / 5,
                    color,
                    mobile ? 7 : 12
                );
            }
        });
        addGroup(palette[1], function (color) {
            addCircle(cx, cy, 7 * scale, color, mobile ? 9 : 16, 1);
            for (var i = 0; i < 7; i++) {
                var angle = Math.PI * 2 * i / 7;
                addLine(
                    cx,
                    cy,
                    cx + Math.cos(angle) * 12 * scale,
                    cy + Math.sin(angle) * 12 * scale,
                    color,
                    mobile ? 3 : 5,
                    1
                );
            }
        });
    };

    var addOrchid = function (cx, cy, scale, palette) {
        palette = palette || colors.orchid;
        addGroup(palette[0], function (color) {
            addPetal(cx, cy, 43 * scale, 17 * scale, Math.PI, color, mobile ? 8 : 13);
            addPetal(cx, cy, 43 * scale, 17 * scale, 0, color, mobile ? 8 : 13);
            addPetal(cx, cy, 37 * scale, 15 * scale, -Math.PI / 2, color, mobile ? 8 : 13);
            addPetal(cx, cy, 31 * scale, 13 * scale, -Math.PI * 2 / 3, color, mobile ? 7 : 11);
            addPetal(cx, cy, 31 * scale, 13 * scale, -Math.PI / 3, color, mobile ? 7 : 11);
        });
        addGroup(palette[1], function (color) {
            addPetal(cx, cy + 2 * scale, 25 * scale, 14 * scale, Math.PI / 2, color, mobile ? 8 : 12);
            addCircle(cx, cy + 3 * scale, 6 * scale, color, mobile ? 8 : 13, 0.75);
        });
    };

    var addLotus = function (cx, cy, scale, palette) {
        palette = palette || colors.lotus;
        addGroup(palette[0], function (color) {
            var outerAngles = [-2.65, -2.25, -1.82, -1.32, -0.88, -0.48];
            for (var i = 0; i < outerAngles.length; i++) {
                addPetal(cx, cy, 42 * scale, 13 * scale, outerAngles[i], color, mobile ? 8 : 12);
            }
        });
        addGroup(palette[1], function (color) {
            var innerAngles = [-2.2, -1.78, -1.36, -0.94];
            for (var i = 0; i < innerAngles.length; i++) {
                addPetal(cx, cy - 1 * scale, 34 * scale, 10 * scale, innerAngles[i], color, mobile ? 7 : 11);
            }
            addCircle(cx, cy, 8 * scale, color, mobile ? 9 : 15, 0.55);
        });
    };

    var addChrysanthemum = function (cx, cy, scale, palette) {
        palette = palette || colors.chrysanthemum;
        addGroup(palette[0], function (color) {
            var petals = mobile ? 14 : 22;
            for (var i = 0; i < petals; i++) {
                var angle = -Math.PI / 2 + i * Math.PI * 2 / petals;
                var length = (i % 2 === 0 ? 38 : 31) * scale;
                addPetal(cx, cy, length, 5.5 * scale, angle, color, mobile ? 5 : 8);
            }
        });
        addGroup(palette[1], function (color) {
            var petals = mobile ? 9 : 14;
            for (var i = 0; i < petals; i++) {
                addPetal(
                    cx,
                    cy,
                    21 * scale,
                    4 * scale,
                    -Math.PI / 2 + i * Math.PI * 2 / petals,
                    color,
                    mobile ? 4 : 6
                );
            }
            addCircle(cx, cy, 5 * scale, color, mobile ? 7 : 12, 1);
        });
    };

    var addSpiderChrysanthemum = function (cx, cy, scale, palette) {
        palette = palette || colors.spiderOrange;

        addGroup(palette[0], function (color) {
            var petals = mobile ? 18 : 30;
            for (var i = 0; i < petals; i++) {
                var angle = -Math.PI / 2 + i * Math.PI * 2 / petals;
                var length = (i % 3 === 0 ? 44 : 36) * scale;
                var curve = (i % 2 === 0 ? 10 : -10) * scale;
                addCurvedPetal(
                    cx,
                    cy,
                    length,
                    curve,
                    angle,
                    color,
                    mobile ? 7 : 12
                );
            }
        }, 2.35);

        addGroup(palette[1], function (color) {
            var innerPetals = mobile ? 12 : 19;
            for (var i = 0; i < innerPetals; i++) {
                var angle = -Math.PI / 2 + i * Math.PI * 2 / innerPetals;
                addCurvedPetal(
                    cx,
                    cy,
                    25 * scale,
                    (i % 2 ? 6 : -6) * scale,
                    angle,
                    color,
                    mobile ? 5 : 8
                );
            }
            addCircle(cx, cy, 6 * scale, color, mobile ? 8 : 14, 1);
        }, 1.85);
    };

    var addSpiderChrysanthemumCluster = function (x, groundY, scale) {
        var topY = groundY - 128 * scale;
        var leftY = groundY - 82 * scale;
        var budY = groundY - 92 * scale;

        addStem(x, groundY, topY, 4 * scale);
        addStem(x - 4 * scale, groundY, leftY, -19 * scale);
        addStem(x + 5 * scale, groundY, budY, 22 * scale);

        addGroup(colors.grass[0], function (color) {
            addSerratedLeaf(x - 2 * scale, groundY - 43 * scale, 40 * scale, 11 * scale, -2.78, color);
            addSerratedLeaf(x + 3 * scale, groundY - 57 * scale, 37 * scale, 10 * scale, -0.35, color);
            addSerratedLeaf(x - 5 * scale, groundY - 70 * scale, 30 * scale, 9 * scale, Math.PI, color);
        });

        addSpiderChrysanthemum(x + 4 * scale, topY, scale, colors.spiderOrange);
        addSpiderChrysanthemum(x - 23 * scale, leftY, scale * 0.72, colors.spiderOrange);
        addSpiderChrysanthemum(x + 27 * scale, budY, scale * 0.42, colors.spiderOrange);
    };

    var addCherryPlant = function (x, groundY, scale, palette, lean) {
        var flowerY = groundY - 88 * scale;
        addStem(x, groundY, flowerY, lean * scale);
        addGroup(colors.grass[1], function (color) {
            addLeaf(x, groundY - 35 * scale, 25 * scale, 7 * scale, lean < 0 ? -2.8 : -0.34, color);
        });
        addCherryBlossom(x + lean * scale, flowerY, scale, palette);
    };

    var addOrchidPlant = function (x, groundY, scale, palette, lean) {
        var flowerY = groundY - 103 * scale;
        addStem(x, groundY, flowerY, lean * scale);
        addGroup(colors.grass[0], function (color) {
            addLeaf(x, groundY - 28 * scale, 32 * scale, 9 * scale, -2.82, color);
            addLeaf(x, groundY - 42 * scale, 28 * scale, 8 * scale, -0.3, color);
        });
        addOrchid(x + lean * scale, flowerY, scale, palette);
    };

    var addLotusPlant = function (x, groundY, scale, palette) {
        var flowerY = groundY - 35 * scale;
        addGroup(colors.grass[1], function (color) {
            addLine(x, groundY, x, flowerY, color, mobile ? 5 : 9, 1.2);
            addLeaf(x - 2 * scale, groundY - 10 * scale, 27 * scale, 10 * scale, Math.PI, color);
        });
        addLotus(x, flowerY, scale, palette);
    };

    var addChrysanthemumPlant = function (x, groundY, scale, palette, lean) {
        var flowerY = groundY - 91 * scale;
        addStem(x, groundY, flowerY, lean * scale);
        addGroup(colors.grass[2], function (color) {
            addSerratedLeaf(x, groundY - 36 * scale, 28 * scale, 8 * scale, lean < 0 ? -2.75 : -0.38, color);
        });
        addChrysanthemum(x + lean * scale, flowerY, scale, palette);
    };

    var buildGarden = function () {
        points = [];
        groups = [];
        agents = [];

        var groundY = height - Math.max(18, height * 0.025);
        var flowerScale = mobile
            ? Math.max(0.55, Math.min(0.78, width / 260))
            : Math.max(0.78, Math.min(1.12, width / 1100));

        addGroup(colors.grass[0], function (color) {
            var groundSteps = mobile ? 80 : 180;
            for (var i = 0; i < groundSteps; i++) {
                var x = width * i / (groundSteps - 1);
                var y = groundY + Math.sin(i * 0.7) * 2.5;
                addPoint(x, y, color, 0.8);
            }
        });

        addGroup(colors.grass[2], function (color) {
            var bladeCount = mobile ? 34 : 86;
            for (var i = 0; i < bladeCount; i++) {
                var x = width * (i + 0.4) / bladeCount;
                var bladeHeight = (10 + rand() * 24) * (mobile ? 0.75 : 1);
                var lean = (rand() - 0.5) * 10;
                addLine(x, groundY, x + lean, groundY - bladeHeight, color, mobile ? 3 : 5, 2);
            }
        });

        var backScale = flowerScale * (mobile ? 0.72 : 0.78);
        var middleScale = flowerScale * (mobile ? 0.82 : 0.9);
        var frontScale = flowerScale * (mobile ? 0.68 : 0.76);

        addCherryPlant(width * 0.045, groundY, backScale * 0.82, colors.cherryWhite, 7);
        addOrchidPlant(width * 0.12, groundY, backScale * 0.88, colors.orchidBlue, -7);
        addChrysanthemumPlant(width * 0.2, groundY, backScale * 0.78, colors.chrysanthemumRed, 5);
        addCherryPlant(width * 0.28, groundY, backScale * 0.86, colors.cherry, -7);
        addOrchidPlant(width * 0.36, groundY, backScale * 0.78, colors.orchid, 6);
        addChrysanthemumPlant(width * 0.45, groundY, backScale * 0.82, colors.chrysanthemum, -5);
        addCherryPlant(width * 0.54, groundY, backScale * 0.76, colors.cherryWhite, 5);
        addOrchidPlant(width * 0.62, groundY, backScale * 0.85, colors.orchidBlue, -6);
        addChrysanthemumPlant(width * 0.7, groundY, backScale * 0.76, colors.chrysanthemumRed, 5);
        addCherryPlant(width * 0.78, groundY, backScale * 0.84, colors.cherry, -6);
        addOrchidPlant(width * 0.95, groundY, backScale * 0.8, colors.orchid, -6);

        addSpiderChrysanthemumCluster(width * 0.865, groundY, middleScale * 0.92);
        addSpiderChrysanthemumCluster(width * 0.58, groundY, middleScale * 0.58);

        addLotusPlant(width * 0.07, groundY, frontScale * 0.75, colors.lotusPink);
        addLotusPlant(width * 0.16, groundY, frontScale * 0.92, colors.lotus);
        addLotusPlant(width * 0.25, groundY, frontScale * 0.72, colors.lotusPink);
        addLotusPlant(width * 0.34, groundY, frontScale * 0.88, colors.lotus);
        addLotusPlant(width * 0.43, groundY, frontScale * 0.7, colors.lotusPink);
        addLotusPlant(width * 0.51, groundY, frontScale * 0.84, colors.lotus);
        addLotusPlant(width * 0.65, groundY, frontScale * 0.76, colors.lotusPink);
        addLotusPlant(width * 0.74, groundY, frontScale * 0.9, colors.lotus);
        addLotusPlant(width * 0.93, groundY, frontScale * 0.78, colors.lotusPink);

        for (var groupIndex = 0; groupIndex < groups.length; groupIndex++) {
            var group = groups[groupIndex];
            var pointCount = group.end - group.start;
            var agentCount = Math.max(
                2,
                Math.min(
                    mobile ? 16 : 32,
                    Math.ceil(pointCount / (mobile ? 8 : 7) * group.density)
                )
            );

            for (var agentIndex = 0; agentIndex < agentCount; agentIndex++) {
                var q = group.start + ~~(rand() * pointCount);
                var startX = width / 2 + (rand() - 0.5) * width * 0.2;
                var startY = height * 0.72 + (rand() - 0.5) * height * 0.15;
                var trace = [];

                for (var traceIndex = 0; traceIndex < traceCount; traceIndex++) {
                    trace.push({x: startX, y: startY});
                }

                agents.push({
                    vx: 0,
                    vy: 0,
                    speed: 0.65 + rand() * 1.35,
                    force: 0.72 + rand() * 0.16,
                    q: q,
                    direction: agentIndex % 2 ? 1 : -1,
                    groupStart: group.start,
                    groupEnd: group.end,
                    color: group.color,
                    trace: trace
                });
            }
        }
    };

    var resizeGarden = function () {
        width = canvas.width = koef * innerWidth;
        height = canvas.height = koef * innerHeight;
        ctx.clearRect(0, 0, width, height);
        buildGarden();
    };

    var loopGarden = function () {
        gardenTime += 0.018;
        ctx.clearRect(0, 0, width, height);

        for (var i = agents.length; i--;) {
            var agent = agents[i];
            var target = points[agent.q];
            var targetX = target.x + Math.sin(gardenTime + target.phase) * target.sway;
            var targetY = target.y + Math.cos(gardenTime * 0.72 + target.phase) * target.sway * 0.3;
            var dx = agent.trace[0].x - targetX;
            var dy = agent.trace[0].y - targetY;
            var distance = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));

            if (distance < 5) {
                agent.q += agent.direction;
                if (agent.q >= agent.groupEnd) agent.q = agent.groupStart;
                if (agent.q < agent.groupStart) agent.q = agent.groupEnd - 1;
            }

            agent.vx += -dx / distance * agent.speed;
            agent.vy += -dy / distance * agent.speed;
            agent.trace[0].x += agent.vx;
            agent.trace[0].y += agent.vy;
            agent.vx *= agent.force;
            agent.vy *= agent.force;

            for (var traceIndex = 0; traceIndex < agent.trace.length - 1;) {
                var current = agent.trace[traceIndex];
                var next = agent.trace[++traceIndex];
                next.x -= 0.42 * (next.x - current.x);
                next.y -= 0.42 * (next.y - current.y);
            }

            ctx.fillStyle = agent.color;
            for (var pointIndex = 0; pointIndex < agent.trace.length; pointIndex++) {
                var size = pointIndex === 0 ? 1.4 : 0.85;
                ctx.fillRect(
                    agent.trace[pointIndex].x,
                    agent.trace[pointIndex].y,
                    size,
                    size
                );
            }
        }

        window.requestAnimationFrame(loopGarden, canvas);
    };

    window.addEventListener('resize', resizeGarden);
    resizeGarden();
    loopGarden();
};

if (s === 'complete' || s === 'loaded' || s === 'interactive') initGarden();
else document.addEventListener('DOMContentLoaded', initGarden, false);

var setupInvitation = function () {
    var invitation = document.getElementById('invitation');
    var answer = document.getElementById('answer');
    var yesButton = document.getElementById('yesButton');
    var noButton = document.getElementById('noButton');
    var absorption = document.getElementById('absorption');
    var triggerDistance = 125;
    var escapeSpeed = 520;
    var padding = 16;
    var isFree = false;
    var isAccepting = false;
    var pointerX = null;
    var pointerY = null;
    var buttonX = 0;
    var buttonY = 0;
    var buttonWidth = 0;
    var buttonHeight = 0;
    var lastFrameTime = performance.now();

    noButton.tabIndex = -1;
    noButton.setAttribute('aria-disabled', 'true');

    var clamp = function (value, min, max) {
        return Math.min(Math.max(value, min), max);
    };

    var releaseNoButton = function (rect) {
        if (isFree) return;

        buttonX = rect.left;
        buttonY = rect.top;
        buttonWidth = rect.width;
        buttonHeight = rect.height;
        document.body.appendChild(noButton);
        noButton.classList.add('is-running');
        noButton.style.left = buttonX + 'px';
        noButton.style.top = buttonY + 'px';
        isFree = true;
    };

    var chooseBoundaryPosition = function (step) {
        var maxLeft = window.innerWidth - buttonWidth - padding;
        var maxTop = window.innerHeight - buttonHeight - padding;
        var bestPosition = null;
        var bestDistance = -Infinity;

        for (var i = 0; i < 24; i++) {
            var angle = Math.PI * 2 * i / 24;
            var candidateX = buttonX + Math.cos(angle) * step;
            var candidateY = buttonY + Math.sin(angle) * step;

            if (
                candidateX < padding ||
                candidateX > maxLeft ||
                candidateY < padding ||
                candidateY > maxTop
            ) {
                continue;
            }

            var candidateDistance = Math.hypot(
                candidateX + buttonWidth / 2 - pointerX,
                candidateY + buttonHeight / 2 - pointerY
            );

            if (candidateDistance > bestDistance) {
                bestDistance = candidateDistance;
                bestPosition = {x: candidateX, y: candidateY};
            }
        }

        return bestPosition;
    };

    var animateNoButton = function (frameTime) {
        var deltaTime = Math.min((frameTime - lastFrameTime) / 1000, 0.04);
        lastFrameTime = frameTime;

        if (!isAccepting && pointerX !== null && pointerY !== null) {
            var rect = isFree
                ? {
                    left: buttonX,
                    top: buttonY,
                    width: buttonWidth,
                    height: buttonHeight
                }
                : noButton.getBoundingClientRect();
            var centerX = rect.left + rect.width / 2;
            var centerY = rect.top + rect.height / 2;
            var directionX = centerX - pointerX;
            var directionY = centerY - pointerY;
            var distance = Math.hypot(directionX, directionY);

            if (distance < triggerDistance) {
                releaseNoButton(rect);

                if (distance < 1) {
                    var angle = Math.random() * Math.PI * 2;
                    directionX = Math.cos(angle);
                    directionY = Math.sin(angle);
                    distance = 1;
                }

                directionX /= distance;
                directionY /= distance;

                var step = escapeSpeed * deltaTime;
                var maxLeft = window.innerWidth - buttonWidth - padding;
                var maxTop = window.innerHeight - buttonHeight - padding;
                var nextX = buttonX + directionX * step;
                var nextY = buttonY + directionY * step;

                if (
                    nextX >= padding &&
                    nextX <= maxLeft &&
                    nextY >= padding &&
                    nextY <= maxTop
                ) {
                    buttonX = nextX;
                    buttonY = nextY;
                } else {
                    var boundaryPosition = chooseBoundaryPosition(step);

                    if (boundaryPosition) {
                        buttonX = boundaryPosition.x;
                        buttonY = boundaryPosition.y;
                    }
                }

                noButton.style.left = buttonX + 'px';
                noButton.style.top = buttonY + 'px';
            }
        }

        window.requestAnimationFrame(animateNoButton);
    };

    document.addEventListener('pointermove', function (event) {
        pointerX = event.clientX;
        pointerY = event.clientY;
    });

    window.addEventListener('resize', function () {
        if (!isFree) return;

        buttonX = clamp(
            buttonX,
            padding,
            window.innerWidth - buttonWidth - padding
        );
        buttonY = clamp(
            buttonY,
            padding,
            window.innerHeight - buttonHeight - padding
        );
        noButton.style.left = buttonX + 'px';
        noButton.style.top = buttonY + 'px';
    });

    window.requestAnimationFrame(animateNoButton);

    var createAbsorptionParticles = function () {
        var rect = invitation.getBoundingClientRect();
        var colors = ['#ff2857', '#ff4f79', '#ff8ca5', '#fff1f5'];
        var particleCount = window.innerWidth < 520 ? 48 : 76;

        for (var i = 0; i < particleCount; i++) {
            var particle = document.createElement('span');
            var x = rect.left + Math.random() * rect.width;
            var y = rect.top + Math.random() * rect.height;
            var size = 2 + Math.random() * 4;

            particle.className = 'absorption-particle';
            particle.style.setProperty('--start-x', x + 'px');
            particle.style.setProperty('--start-y', y + 'px');
            particle.style.setProperty('--size', size + 'px');
            particle.style.setProperty('--color', colors[i % colors.length]);
            particle.style.setProperty('--delay', Math.random() * 160 + 'ms');
            particle.style.setProperty('--duration', 720 + Math.random() * 260 + 'ms');
            absorption.appendChild(particle);
        }
    };

    yesButton.addEventListener('click', function () {
        if (isAccepting) return;
        isAccepting = true;

        createAbsorptionParticles();
        document.body.classList.add('is-transforming');
        invitation.classList.add('is-absorbing');
        absorption.classList.add('is-active');
        noButton.hidden = true;

        window.setTimeout(function () {
            invitation.classList.add('is-hidden');
            document.body.classList.add('accepted');
        }, 900);

        window.setTimeout(function () {
            answer.classList.add('is-visible');
            answer.setAttribute('aria-hidden', 'false');
        }, 1550);

        window.setTimeout(function () {
            absorption.replaceChildren(absorption.querySelector('.absorption-core'));
            absorption.classList.remove('is-active');
            document.body.classList.remove('is-transforming');
        }, 1900);
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupInvitation, false);
} else {
    setupInvitation();
}
