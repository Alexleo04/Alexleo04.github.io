var canvas = document.getElementById('screen');
var ctx = canvas.getContext('2d')

//-------------------------------------------------------------------------
// POLYFILLS
//-------------------------------------------------------------------------

if (!window.requestAnimationFrame) { // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    window.requestAnimationFrame = window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback, element) {
            window.setTimeout(callback, 1000 / 60);
        }
}

//-------------------------------------------------------------------------
// UTILITIES
//-------------------------------------------------------------------------

function timestamp() {
    return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

function bound(x, min, max) {
    return Math.max(min, Math.min(max, x));
}

function overlap(x1, y1, w1, h1, x2, y2, w2, h2) {
    return !(((x1 + w1 - 1) < x2) ||
        ((x2 + w2 - 1) < x1) ||
        ((y1 + h1 - 1) < y2) ||
        ((y2 + h2 - 1) < y1))
}

//-------------------------------------------------------------------------
// CONSTANTS
//-------------------------------------------------------------------------

var assetGround = new Image();
assetGround.src = "./assets/ground.png";
var assetSpikes = new Image();
assetSpikes.src = "./assets/spikes.png";
var assetBackGround = new Image();
assetBackGround.src = "./assets/background.png";
var assetBackGroundGameOver = new Image();
assetBackGroundGameOver.src = "./assets/background_game_over.png";
var assetWater = new Image();
assetWater.src = "./assets/water.png";
var assetPlayer = new Image();
assetPlayer.src = "./assets/player.png";
var assetPlayerGameOver = new Image();
assetPlayerGameOver.src = "./assets/player_2.png";

var assetPlayerRunF1 = new Image();
assetPlayerRunF1.src = "./assets/player_f1.png";
var assetPlayerRunF2 = new Image();
assetPlayerRunF2.src = "./assets/player_f2.png";

var assetPlayerDieF1 = new Image();
assetPlayerDieF1.src = "./assets/player_die_f1.png";
var assetPlayerDieF2 = new Image();
assetPlayerDieF2.src = "./assets/player_die_f2.png";

var assetPlayerFallingF1 = new Image();
assetPlayerFallingF1.src = "./assets/player_falling_f1.png";

var assetPlayerJumpingF1 = new Image();
assetPlayerJumpingF1.src = "./assets/player_jumping_f1.png";
var assetPlayerJumpingF2 = new Image();
assetPlayerJumpingF2.src = "./assets/player_jumping_f2.png";
var assetPlayerJumpingF3 = new Image();
assetPlayerJumpingF3.src = "./assets/player_jumping_f3.png";

var backgroundMusic = new Audio('./assets/backgroundMusic.mp3');
var gameOverMusic = new Audio('./assets/gameOverMusic.mp3');
var jumpMusic = new Audio('./assets/jump.wav');

var GRAVITY_ORIG = 6.8,
    JUMP_SPEED_ORIG = -0.7;

var PIXELS_IN_METER = 50,
    GRAVITY = GRAVITY_ORIG / 4 * PIXELS_IN_METER,
    GROUND_POSITION = 600,
    PLAYER_GROUND_POSITION = 602,
    SPIKES_POSITION = 500,
    WATER_POSITION = 595,
    PLAYER_STARTING_POSITION_X = 50,
    PLAYER_STARTING_POSITION_Y = 150,
    PLAYER_TOP_LIMIT_POSITION_Y = 10,
    RUN_SPEED = 8 * PIXELS_IN_METER, // meters/second
    JUMP_SPEED = JUMP_SPEED_ORIG * PIXELS_IN_METER, // meters/second
    KEY = {
        SPACE: 32,
        TOUCH: "TOUCH"
    },
    GAME_OBJECT_GROUND = "GAME_OBJECT_GROUND",
    GAME_OBJECT_WATER = "GAME_OBJECT_WATER",
    GAME_OBJECT_SPIKES = "GAME_OBJECT_SPIKES",
    PLAYER_STATE_RUN = "PLAYER_STATE_RUN",
    PLAYER_STATE_JUMPING = "PLAYER_STATE_JUMPING",
    PLAYER_STATE_FALLING = "PLAYER_STATE_FALLING"
PLAYER_STATE_DEAD = "PLAYER_STATE_DEAD"
;

var MAP_PARTS = [
    {
        1: GAME_OBJECT_GROUND,
        2: GAME_OBJECT_GROUND,
        3: GAME_OBJECT_WATER,
        4: GAME_OBJECT_SPIKES,
        5: GAME_OBJECT_GROUND,
        6: GAME_OBJECT_GROUND,
        7: GAME_OBJECT_SPIKES,
        8: GAME_OBJECT_GROUND,
        9: GAME_OBJECT_GROUND,
        10: GAME_OBJECT_GROUND,
        11: GAME_OBJECT_GROUND,
        12: GAME_OBJECT_WATER,
        13: GAME_OBJECT_WATER,
        14: GAME_OBJECT_GROUND,
        15: GAME_OBJECT_GROUND,
    },
    {
        1: GAME_OBJECT_GROUND,
        2: GAME_OBJECT_GROUND,
        3: GAME_OBJECT_SPIKES,
        4: GAME_OBJECT_SPIKES,
        5: GAME_OBJECT_GROUND,
        6: GAME_OBJECT_GROUND,
        7: GAME_OBJECT_GROUND,
        8: GAME_OBJECT_SPIKES,
        9: GAME_OBJECT_WATER,
        10: GAME_OBJECT_GROUND,
        11: GAME_OBJECT_GROUND,
        12: GAME_OBJECT_WATER,
        13: GAME_OBJECT_GROUND,
        14: GAME_OBJECT_GROUND,
        15: GAME_OBJECT_GROUND,
        16: GAME_OBJECT_GROUND,
        17: GAME_OBJECT_SPIKES,
        18: GAME_OBJECT_GROUND,
        19: GAME_OBJECT_GROUND,
    }
];

var worldShift = 0;
var isGameOver = false;
// -------------------------------------------------------------------------
// LOGIC
//-------------------------------------------------------------------------


function Player(drawX, drawY) {
    this.drawX = drawX;
    this.drawY = drawY;
    this.worldX = drawX;
    this.worldY = drawY;
    this.width = 2 * PIXELS_IN_METER;
    this.height = 2 * PIXELS_IN_METER * 1.35;
    this.justJumped = false;
    this.isJumping = false;
    this.accelerationY = 0
    this.speedY = 0
    this.isDead = false
    this.frameNumber = 1;
    this.timePassFromLastFrameChange = 0;
    this.state = PLAYER_STATE_RUN
}

// learn later
// function BaseWorldObject(drawX, drawY) {
//     this.drawX = drawX;
//     this.drawY = drawY;
//     this.worldX = drawX;
//     this.worldY = drawY;
// }

function GameObjectGround(drawX, drawY) {
    this.drawX = drawX;
    this.drawY = drawY;
    this.worldX = drawX;
    this.worldY = drawY;
    this.height = 4 * PIXELS_IN_METER;
    this.width = 2 * PIXELS_IN_METER;
    this.color = "brown"
    this.bgImage = assetGround
    this.deleteMe = false;
    this.name = GAME_OBJECT_GROUND
}

function GameObjectWater(drawX, drawY) {
    this.drawX = drawX;
    this.drawY = drawY;
    this.worldX = drawX;
    this.worldY = drawY;
    this.height = 4 * PIXELS_IN_METER + 5;
    this.width = 2 * PIXELS_IN_METER;
    this.color = "blue"
    this.bgImage = assetWater;
    this.deleteMe = false;
    this.name = GAME_OBJECT_WATER
}

function GameObjectSpikes(drawX, drawY) {
    this.drawX = drawX;
    this.drawY = drawY;
    this.worldX = drawX;
    this.worldY = drawY;
    this.height = 6 * PIXELS_IN_METER;
    this.width = 2 * PIXELS_IN_METER;
    this.color = "grey"
    this.bgImage = assetSpikes
    this.deleteMe = false;
    this.name = GAME_OBJECT_SPIKES
}

function updateStep(player, gameObjects, timeDeltaSec) {
    var stepGroundShift = player.isDead ? 0 : timeDeltaSec * RUN_SPEED
    var isCross = false;

    updateWorldShift(stepGroundShift);
    updatePlayer(player, stepGroundShift, timeDeltaSec);
    for (var gameObjectId in gameObjects) {
        updateWorldObject(gameObjects[gameObjectId]);

        if (!isCross && gameObjects[gameObjectId].name === GAME_OBJECT_SPIKES) {
            isCross = crossCheckingSpikes(player.drawX, player.drawY, player.width, player.height, gameObjects[gameObjectId].drawX, gameObjects[gameObjectId].drawY, gameObjects[gameObjectId].width, gameObjects[gameObjectId].height);
        }

        if (!isCross && gameObjects[gameObjectId].name === GAME_OBJECT_WATER) {
            isCross = crossCheckingWater(player.drawX, player.drawY, player.width, player.height, gameObjects[gameObjectId].drawX, gameObjects[gameObjectId].drawY, gameObjects[gameObjectId].width, gameObjects[gameObjectId].height);
        }
    }

    player.isDead = isCross;

    if (player.isDead) {
        isGameOver = true;
    }
}

/**
 * Function UpdatePlayer
 * Calculate player object coordinates
 * Calculate user state RUNNING/JUMPING/FALLING/DEAD to determinate which animation frame choose
 * Check user state RUNNING/JUMPING/FALLING/DEAD to choose right sound
 *
 * @param player
 * @param stepGroundShift
 * @param timeDeltaSec
 */
function updatePlayer(player, stepGroundShift, timeDeltaSec) {

    calculatePlayerYSpeed(player, timeDeltaSec)
    calculatePlayerCoordinates(player, timeDeltaSec, stepGroundShift)
    choosePlayerFrame(player, timeDeltaSec)
    choosePlayerState(player)

    if (player.worldX > 100 * 2 * PIXELS_IN_METER) {
        assetSpikes.src = "./assets/spikes_m2.png";
        assetGround.src = "./assets/ground_m2.png";
        assetWater.src = "./assets/water_m2.png";
    }
}

/**
 * Function calculatePlayerYSpeed
 * Calculate player Y speed based on jump/falling
 * @param player
 * @param timeDeltaSec
 */
function calculatePlayerYSpeed(player, timeDeltaSec) {
    var isPlayerJustJumped = player.justJumped && !player.isInAirNow;

    if (isPlayerJustJumped) {
        player.isInAirNow = true;
        player.speedY = JUMP_SPEED;
        jumpMusic.play()
    } else {
        if (player.isDead) {
            player.speedY = 3
        } else {
            player.speedY = player.speedY + GRAVITY * timeDeltaSec
        }
    }
}

/**
 * Function calculatePlayerCoordinates
 * Calculate user x,y coordinates based on time and speed
 * @param player
 * @param timeDeltaSec
 * @param stepGroundShift
 */
function calculatePlayerCoordinates(player, timeDeltaSec, stepGroundShift) {
    var playerShiftY = player.speedY * timeDeltaSec * PIXELS_IN_METER
    player.worldY = player.worldY + playerShiftY;

    // check playground borders coordinates and fix player position if player tries cross them
    if (!player.isDead) {
        if (player.worldY >= PLAYER_GROUND_POSITION - player.height) {
            player.worldY = PLAYER_GROUND_POSITION - player.height;
            player.speedY = 0
            player.isInAirNow = false;
        }
        if (player.worldY < PLAYER_TOP_LIMIT_POSITION_Y) {
            player.worldY = PLAYER_TOP_LIMIT_POSITION_Y
        }
    }

    player.drawY = player.worldY
    player.worldX = player.worldX + stepGroundShift;
    player.drawX = player.worldX + worldShift;

}

/**
 * Function choosePlayerFrame
 * Calculate count of frames to render based on time
 * Each 0.1 sec add one more frame
 * @param player
 * @param timeDeltaSec
 */
function choosePlayerFrame(player, timeDeltaSec) {
    player.timePassFromLastFrameChange += timeDeltaSec;

    if (player.timePassFromLastFrameChange > 0.1) {
        player.timePassFromLastFrameChange -= 0.1;
        player.frameNumber += 1;
    }
}

/**
 * Function choosePlayerState
 * Choose right player state based on its Y speed and isDead flag
 *
 * @param player
 */
function choosePlayerState(player) {
    player.state = PLAYER_STATE_RUN

    if (player.speedY < -3) {
        player.state = PLAYER_STATE_JUMPING
    } else if (player.speedY > 3) {
        player.state = PLAYER_STATE_FALLING
    }

    if (player.isDead) {
        player.state = PLAYER_STATE_DEAD
    }
}


function updateWorldShift(stepGroundShift) {
    worldShift = worldShift - stepGroundShift;
}

function updateWorldObject(worldObject) {

    worldObject.drawX = worldObject.worldX + worldShift
    worldObject.drawY = worldObject.worldY

    if (worldObject.drawX + worldObject.width < 0) {
        worldObject.deleteMe = true;
    }
}

function generatePartOfTheMap(x, mapConfig) {
    var tmpObjects = [], tmpX = x, tmpGameObject;

    for (var mapConfigObjectId in mapConfig) {
        switch (mapConfig[mapConfigObjectId]) {
            case GAME_OBJECT_GROUND: {
                tmpGameObject = new GameObjectGround(tmpX, GROUND_POSITION);
                break;
            }
            case GAME_OBJECT_WATER: {
                tmpGameObject = new GameObjectWater(tmpX, WATER_POSITION);
                break;
            }
            case GAME_OBJECT_SPIKES: {
                tmpGameObject = new GameObjectSpikes(tmpX, SPIKES_POSITION);
                break;
            }
        }
        tmpObjects.push(tmpGameObject);
        tmpX += tmpGameObject.width;
    }

    return tmpObjects;
}


function crossCheckingSpikes(x1, y1, w1, h1, x2, y2, w2, h2) {
    return (y1 + h1 - 10 >= y2) && (x1 + w1 - 30 >= x2) && (x2 + w2 - 30 >= x1)
}

function crossCheckingWater(x1, y1, w1, h1, x2, y2, w2, h2) {
    return (x1 + w1 * 0.3 >= x2) && (y2 < y1 + h1) && (x2 + w2 - 0.7 * w1 >= x1)
}


//-------------------------------------------------------------------------
// CONTROLS
//-------------------------------------------------------------------------

function onkey(ev, key, down, player) {
    switch (key) {
        case KEY.SPACE:
            if (!player.isDead) {
                player.justJumped = down;
                ev.preventDefault();
                return false;
            }
            break;
        case KEY.TOUCH:
            if (!player.isDead) {
                player.justJumped = down;
                ev.preventDefault();
                return false;
            }
            break;

    }
}

//-------------------------------------------------------------------------
// RENDER
//-------------------------------------------------------------------------

function render(canvas, ctx, dt, player, gameObjects, score) {

    //https://jooinn.com/images/sky-panorama-1.jpg

    ctx.beginPath();
    // ctx.fillStyle = "navy";
    if (player.isDead) {
        ctx.drawImage(assetBackGroundGameOver, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.drawImage(assetBackGround, 0, 0, canvas.width, canvas.height);
    }
    // ctx.rect(0, 0, canvas.width, canvas.height)
    ctx.closePath();
    ctx.fill();

    renderPlayer(ctx, player);

    for (var gameObjectId in gameObjects) {
        renderWorldObject(ctx, gameObjects[gameObjectId])
    }

    renderScore(ctx, score.toFixed(0))

}

function renderPlayer(ctx, player) {
    ctx.beginPath();
    switch (player.state) {
        case PLAYER_STATE_RUN: {
            switch (player.frameNumber % 2) {
                case 0: {
                    ctx.drawImage(assetPlayerRunF1, player.drawX, player.drawY, player.width, player.height)
                    break;
                }
                case 1: {
                    ctx.drawImage(assetPlayerRunF2, player.drawX, player.drawY, player.width, player.height)
                    break;
                }
            }
            break;
        }
        case PLAYER_STATE_JUMPING: {
            switch (player.frameNumber % 3) {
                case 0: {
                    ctx.drawImage(assetPlayerJumpingF1, player.drawX, player.drawY, player.width, player.height)
                    break;
                }
                case 1: {
                    ctx.drawImage(assetPlayerJumpingF2, player.drawX, player.drawY, player.width, player.height)
                    break;
                }
                case 2: {
                    ctx.drawImage(assetPlayerJumpingF3, player.drawX, player.drawY, player.width, player.height)
                    break;
                }
            }
            break;
        }
        case PLAYER_STATE_FALLING: {
            ctx.drawImage(assetPlayerFallingF1, player.drawX, player.drawY, player.width, player.height)
            break;
        }
        case PLAYER_STATE_DEAD: {
            switch (player.frameNumber % 2) {
                case 0: {
                    ctx.drawImage(assetPlayerDieF1, player.drawX, player.drawY, player.width, player.height)
                    break;
                }
                case 1: {
                    ctx.drawImage(assetPlayerDieF2, player.drawX, player.drawY, player.width, player.height)
                    break;
                }
            }
            break;
        }
    }
    ctx.closePath();
    ctx.fill();
}

function renderWorldObject(ctx, object) {
    ctx.beginPath();
    ctx.drawImage(object.bgImage, object.drawX, object.drawY, object.width, object.height)
    ctx.closePath();
    ctx.fill();
}

function renderScore(ctx, score) {
    ctx.beginPath();
    ctx.fillStyle = "yellow";
    ctx.font = "30px Arial";
    ctx.fillText("Score: " + score, 30, 50);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = "yellow";
    ctx.font = "30px Arial";
    ctx.fillText("Gravity: " + GRAVITY_ORIG, 30, 100);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = "yellow";
    ctx.font = "30px Arial";
    ctx.fillText("Jump speed: " + JUMP_SPEED_ORIG, 30, 150);
    ctx.closePath();
    ctx.fill();
}

//-------------------------------------------------------------------------
// THE GAME LOOP
//-------------------------------------------------------------------------

var fps = 60,
    step = 1 / fps,
    dt = 0,
    now,
    last = timestamp(),
    background = new Image(),
    player = new Player(PLAYER_STARTING_POSITION_X, PLAYER_STARTING_POSITION_Y),
    gameObjects = []

// fpsmeter = new FPSMeter({ decimals: 0, graph: true, theme: 'dark', left: '5px' });

function frame() {

    now = timestamp();
    dt = dt + Math.min(1, (now - last) / 1000);
    while (dt > step) {
        dt = dt - step;
        updateStep(player, gameObjects, step);
    }

    if (gameObjects.length < 22) {
        gameObjects = gameObjects.concat(generatePartOfTheMap(gameObjects[gameObjects.length - 1].worldX, MAP_PARTS[getRandomInt(0, 3)]));
    }

    for (var gameObjectId in gameObjects) {
        if (gameObjects[gameObjectId].deleteMe) {
            gameObjects.splice(gameObjectId, 1);
        }
    }

    render(canvas, ctx, dt, player, gameObjects, Math.abs(worldShift / PIXELS_IN_METER));
    last = now;

    if (isGameOver) {
        backgroundMusic.pause();
        gameOverMusic.play();
    }
    requestAnimationFrame(frame, canvas);
}

for (var i = 0; i < 10; i++) {
    gameObjects.push(new GameObjectGround(i * 2 * PIXELS_IN_METER, GROUND_POSITION))
}


// var tmpObjects = generatePartOfTheMap(10 * 2 * PIXELS_IN_METER, MAP_PARTS[0]);
// gameObjects = gameObjects.concat(tmpObjects);

backgroundMusic.play()

frame();

document.addEventListener('keydown', function (ev) {
    return onkey(ev, ev.keyCode, true, player);
}, false);

document.addEventListener('keyup', function (ev) {
    return onkey(ev, ev.keyCode, false, player);
}, false);

document.addEventListener('touchstart', function (ev) {
    console.log(ev)
    return onkey(ev, KEY.TOUCH, true, player);
}, false);

document.addEventListener('touchend', function (ev) {
    console.log(ev)
    return onkey(ev, KEY.TOUCH, false, player);
}, false);

