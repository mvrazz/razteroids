window.addEventListener("load", init, false);
window.addEventListener("keydown", keyDown, false);
window.addEventListener("keyup", keyUp, false);

var canvas, ctx;            // MAIN SCREEN
var canvas2, ctx2;          // COLLISION CHECK CANVAS

var timer = {};
var options = {};
var game = {};

var keyArray = [];          // STORES WHICH KEYS HAVE BEEN PRESSED
var bulletArray = [];       // STORES ALL BULLET OBJECTS
var rockArray = [];         // STORES ALL ASTEROID OBJECTS  
var explodeArray = [];      // STORES EXPLOSION PARTICLES
var instructionArray = [];  // STORES GAME INSTRUCTIONS
var levelRocksArray = [];   // STORES ASTEROID COUNT FOR EACH LEVEL
var saucerArray = [];       // STORES FLYING SAUCER OBJECT
var highScoreArray = [];    // STORES HIGH SCORES

var filesToLoad;            // TOTAL COUNT OF EXTERNAL FILES TO LOAD
var lastTime;               // TIMER USED FOR GAMELOOP FUNCTION
var screenWidth;
var screenHeight;

var ship;                   // PLAYER SHIP OBJECT

// ALL GAME SOUND VARIABLES
var sndFire, sndSaucerFire, sndThrust;
var sndBigSaucer, sndSmallSaucer;
var sndBeat1, sndBeat2;
var sndLargeBang, sndMediumBang, sndSmallBang;

// TIMER MIN/MAX AND TRACK FOR BACKGROUND "HEARTBEAT" SOUND
var beatTimer, beatTimerMin, beatTimerMax, beatCurrentMax, beatTrack;

var safeX1, safeX2;     // L,R,T,B OF CLEAR AREA SHIP CAN REAPPEAR IN OR WHERE
var safeY1, safeY2;     // ASTEROIDS CAN'T BE PLACED WHEN STARTING NEW LEVEL

var RnoUpdate;  // KEEPS ASTEROIDS FROM UPDATING WHEN NONE ARE IN ARRAY
var RnoUpdate2; // ALLOWS FOR DELAY WHEN GAME IS OVER OR SHIP NEW LIFE

var ls;      // LOCAL STORAGE TEST VARIABLE

function init() {       // FUNCTION TO INITIALIZE ALL VARIABLES, ETC.

    // CHECK TO SEE IF LOCAL STORAGE IS AVAILABLE (FOR STORING GAME OPTIONS)
    try {
        localStorage.test = "test";
        ls = true;
    }

    catch(err) {
        ls = false;
    }

    // EVENT LISTENERS FOR HIGH SCORE NAME SCREEN
    document.getElementById("btnok").addEventListener("click", function(){ updateHighScore(1);});
    document.getElementById("btncancel").addEventListener("click", function(){ updateHighScore(2);});
    document.getElementById("hsname").addEventListener("keyup", function(event) {
        if (event.keyCode === 13) {
          event.preventDefault();
          document.getElementById("btnok").click();
        }
      });

    document.getElementById("highscore").classList.add("hidden");

    levelRocksArray.push(0, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 12, 14, 16, 18, 20);
    
    RnoUpdate = false;    
    RnoUpdate2 = false;

    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    canvas2 = document.createElement("canvas");
    ctx2 = canvas2.getContext("2d");

    screenWidth = window.innerWidth - 50;
    if (screenWidth > 1000) screenWidth = 1000;
    screenHeight = window.innerHeight - 25;
    
    canvas.width = screenWidth;
    canvas2.width = canvas.width;
    canvas.height = screenHeight;
    canvas2.height = canvas.height;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "yellow";
    ctx.font = "46px arial";
    ctx.textAlign = "center";
    ctx.fillText("Loading...", screenWidth / 2, screenHeight / 2);

    beatTimerMax = 1.25;
    beatTimerMin = 0.25
    beatCurrentMax = beatTimerMax;
    beatTimer = beatTimerMax;
    beatTrack = 2;

    // LOAD GAME OPTIONS IF LOCAL STORAGE IS AVAILABLE OTHERWISE TURN ON ALL SOUNDS
    if (ls && localStorage.gameOptions) {
        options = JSON.parse(localStorage.gameOptions);

    } else {
        options.sndBeat = true;
        options.sndThrust = true;
        options.sndMissle = true;
        options.sndExplode = true;
        options.sndSaucer = true;
    }

    game.minutesPlayed = 0;
    game.misslesFired = 0;
    game.asteroidsDestroyed = 0;
    game.saucersDestroyed = 0;
    game.welcome = true;        // SHOW WELCOME SCREEN WHEN TRUE
    
    // TIMER FOR EACH LINE OF INSTRUCTIONS ON WELCOME SCREEN
    game.instructionRec = 0;
    game.instructionRecMax = 2.5;
    game.instructionRecTimer = game.instructionRecMax;

    // FLASHING PRESS ANY KEY TO START TIMERS
    game.startMax = 0.4;
    game.startTimer = game.startMax;
    game.startDisplay = true;

    game.newLife = false;
    game.newLevel = false;
    game.score = 0;
    game.fireOn = true;
    game.freeGuy = 10000;
    game.highScoreTimerOn = false;
    game.highScoreTimer = 0;
    game.highScoreUpdate = false;

    getHighScores(); 

    updatePauseScreen("show");
    updatePauseScreen("hide");

    // PAUSE GAME WHEN BROWSER LOSES FOCUS
    window.addEventListener("blur", lostFocus, false);

    // AMOUNT OF DELAY BEFORE NEXT SHIP MISSLE FIRES
    timer.fireDelay = 140;
    timer.fireTime = Date.now();

    // TIMER FOR SAUCERS APPEARING ON SCREEN
    timer.saucerDelayMax = 20;
    timer.saucerDelay = timer.saucerDelayMax;

    // LOAD PLAYER SHIP OBJECT
    ship = new Ship({screenWidth: screenWidth, screenHeight: screenHeight});
    ship.visible = false; 

    // ASTEROIDS FOR WELCOME SCREEN
    for (var i = 0; i < 5; i++) {rockArray.push(new Rock({size: 1}));}
    for (var i = 0; i < 7; i++) {rockArray.push(new Rock({size: 2}));}
    for (var i = 0; i < 2; i++) {rockArray.push(new Rock({size: 3}));}


    instructionArray[0] = "LEFT Arrow Key - Rotate Ship Left";
    instructionArray[1] = "RIGHT Arrow Key - Rotate Ship Right";
    instructionArray[2] = "Spacebar - Fire Missles";
    instructionArray[3] = "UP Arrow Key - Thrust";
    instructionArray[4] = "P Key - Pause Game/View Stats";

    canvas.focus();
    
    // LOAD ALL SOUND/GRAPHIC FILES AND HOLD START OF GAME UNTIL LOADED
    filesToLoad = 0;
    sndFire = loadFiles(2, "sound/fire.wav");
    sndThrust = loadFiles(2, "sound/thrust.mp3");
    sndBeat1 = loadFiles(2, "sound/beat1.wav");
    sndBeat2 = loadFiles(2, "sound/beat2.wav");
    sndSmallBang = loadFiles(2, "sound/bangsmall.wav");
    sndMediumBang = loadFiles(2, "sound/bangmedium.wav");
    sndLargeBang = loadFiles(2, "sound/banglarge.wav");
    sndBigSaucer = loadFiles(2, "sound/saucerbig.wav");
    sndSmallSaucer = loadFiles(2, "sound/saucersmall.wav");
    sndSaucerFire = loadFiles(2, "sound/saucerfire.wav");
    sndExtraShip = loadFiles(2, "sound/extraship.wav");
    background = loadFiles(1, "images/background3.png");
}

function newGame() {        // CLEAR VARIABLES & REINITIALIZE GAME

    game.minutesPlayed = 0;
    game.misslesFired = 0;
    game.asteroidsDestroyed = 0;
    game.saucersDestroyed = 0;
    game.level = 1;
    game.lives = 3;
    game.over = false;
    game.score = 0;
    game.highScoreUpdate = false;

    ship = {};
    ship = new Ship({screenWidth: screenWidth, screenHeight: screenHeight});

    timer.saucerDelay = timer.saucerDelayMax;

    getSafeBox();

    rockArray=[];
    for (var i = 0; i < levelRocksArray[game.level]; i++) {
        rockArray.push(new Rock({size: 3}));
    }

    game.totalRocks = 7 * rockArray.length;
    game.currentRocks = game.totalRocks;

    RnoUpdate2 = false;
    canvas.style.cursor = "none";

    lastTime = Date.now();
}

function gameLoop() {   // ANIMATION LOOP FOR GAME
    
    var curTime = Date.now();
    var elapsed = (curTime - lastTime) / 1000;
    lastTime = curTime;
    if (!game.over && !game.welcome) game.minutesPlayed += elapsed;

    ctx.drawImage(background, 0, 0, screenWidth, screenHeight);

    checkKeys();
    updateRocks(elapsed);
    updateSaucer(elapsed);
    updateBullets(elapsed);
    
    if (!game.welcome && !game.over) {
        playBeat(elapsed);
        ship.update(elapsed);
        ship.draw(ctx);
    }
    
    if (explodeArray.length > 0) updateExplode(elapsed);

    drawScores();
    checkScore();

    if (game.welcome) {
        updateWelcomeScreen();
        game.instructionRecTimer -= elapsed;
        game.startTimer -= elapsed; 
        game.highScoreTimer += elapsed;

        if (game.instructionRecTimer < 0) {
            game.instructionRec++
            if (game.instructionRec == instructionArray.length) game.instructionRec = 0;
            game.instructionRecTimer = game.instructionRecMax;
        }

        if (game.startTimer < 0) {
            if (game.startDisplay) {
                game.startDisplay = false;
            } else {
                game.startDisplay = true;
            }
            game.startTimer = game.startMax;
        }
    }
    
    if (game.newLife) newShip();
    if (game.newLevel) newLevel();
    if (game.over) gameOverScreen(elapsed);

    if (options.pause) {
        updatePauseScreen("show");
    } else if (game.newHighScore) {
        // EXIT ANIMATION LOOP
    } else {
        requestAnimationFrame(gameLoop);
    }
}

function newLevel() {       // CREATE NEW LEVEL WHEN ALL ASTEROIDS DESTROYED

    if (saucerArray.length > 0) return;

    game.level++;
    var level = game.level;
    if (level > levelRocksArray.length - 1) level = levelRocksArray.length - 1;
    
    var levelRocks = levelRocksArray[level];
    rockArray = [];

    for (var i = 0; i < levelRocks; i++) {
        rockArray.push(new Rock({size: 3}));
    }
    
    game.totalRocks = 7 * rockArray.length;
    game.currentRocks = game.totalRocks;

    game.newLevel = false;
    RnoUpdate = false;
    timer.saucerDelay = timer.saucerDelayMax;
}

function newShip() {        // CREATE NEW SHIP AFTER BEING DESTROYED

    if (rockArray.length == 0) return;

    for (var i = 0; i < rockArray.length; i++) {
        var r = rockArray[i];

        ship.x = screenWidth / 2;
        ship.y = screenHeight / 2;

        getSafeBox();
        if (r.x > safeX1 && r.x < safeX2 && r.y > safeY1 && r.y < safeY2) return;
    }

    if (saucerArray.length > 0 || bulletArray.length > 0) return;

    ship.angle = 270 * Math.PI / 180;
    ship.thrust = false;
    ship.thrustTimer = 0;
    ship.vx = 0;
    ship.vy = 0;
    ship.visible = true;
    game.newLife = false;
    RnoUpdate2 = false;
    game.lives --;
}

function createSaucer() {   // FUNCTION TO CREATE NEW FLYING SAUCERS

    if (saucerArray.length > 0 || game.over || game.welcome) {
        timer.saucerDelay = timer.saucerDelayMax;
        return;
    }

    if (!ship.visible) {
        timer.saucerDelay = timer.saucerDelayMax * .05;
        return;
    }

    var saucerSize;

    if (game.score < 40000) {
        saucerSize = rnd(1, 2, true);
    } else {
        saucerSize = 1; // IF SCORE > 40,000 ONLY SMALL SAUCER WILL APPEAR
    }

    if (game.level == 1 && game.saucersDestroyed < 3) saucerSize = 1;

    saucerArray.push(new Saucer({size: saucerSize}))
    if (saucerSize == 1) {
        sndBigSaucer.currentTime = 0;
        sndBigSaucer.loop = true;
        sndBigSaucer.volume = .05;
        if (options.sndSaucer) {
            sndBigSaucer.play();
            game.bigSaucerPlaying = true;
        }
    } else {
        sndSmallSaucer.currentTime = 0;
        sndSmallSaucer.loop = true;
        sndSmallSaucer.volume = .05;
        if (options.sndSaucer) {
            sndSmallSaucer.play();
            game.smallSaucerPlaying = true;
        }
    }
}

function updateSaucer(elapsed) {    // FUNCTION TO UPDATE SAUCER POSITION/CHECK COLLISIONS

    timer.saucerDelay -= elapsed;

    if (timer.saucerDelay < 0) {
        timer.saucerDelay = timer.saucerDelayMax;
        createSaucer();
    }
    
    if (saucerArray.length == 0) return;

    var saucer = saucerArray[0];

    saucer.update(elapsed);
    saucer.draw(ctx);

    if (checkCollision(saucerArray[0], ship)) {
        saucerArray[0].explode();
        game.saucersDestroyed++;
        ship.explode();
        if (game.lives - 1 == 0 && !RnoUpdate2) {
            RnoUpdate2 = true;
            setTimeout(function() {game.over = true; game.overCounter = 0; canvas.style.cursor = "auto";
        }, 2000);
        } else {
            RnoUpdate2 = true;
            setTimeout(function() {game.newLife = true;}, 2000);
        }
    }

    if (saucer.visible == false) {
        saucerArray = [];
        timer.saucerDelay = timer.saucerDelayMax;
        sndBigSaucer.loop = false;
        sndBigSaucer.pause();
        sndBigSaucer.currentTime = 0;
        sndSmallSaucer.loop = false;
        sndSmallSaucer.pause();
        sndSmallSaucer.currentTime = 0;
    }
}

function checkScore() {     // AWARD FREE SHIP WHEN SCORE REACHED

    if (game.score >= game.freeGuy) {
        game.freeGuy += 10000;

        if (game.lives < 10)  {
        game.lives++;
        sndExtraShip.currentTime = 0;
        sndExtraShip.loop = true;
        sndExtraShip.play();
        setTimeout(function(){sndExtraShip.pause();}, 1000)
        }
    }
}

function fireBullet() {     // CREATE BULLET FOR PLAYER SHIP

    var now = Date.now();

    if (now - timer.fireTime > timer.fireDelay) {
        var bullet = new Bullet({x: ship.x, y: ship.y, angle: ship.angle});
        bulletArray.push(bullet);
        sndFire.currentTime = 0;
        sndFire.volume = 0.4;
        if (options.sndMissle) sndFire.play();
        timer.fireTime = Date.now();
        game.misslesFired++;
    } 
}

function updateBullets(elapsed) {   // UPDATE ALL BULLETS & CHECK FOR COLLISION

    for (var i = bulletArray.length - 1; i >= 0; i--) {
        if (bulletArray[i].visible == false) {
            bulletArray.splice(i, 1);
        } else {
            bulletArray[i].updatePosition(elapsed);
            bulletArray[i].draw(ctx);

            // CHECK SAUCER BULLETS AGAINST SHIP
            if (bulletArray[i].type == 2 && checkCollision(bulletArray[i], ship)) {
                ship.explode();
                if (game.lives - 1 == 0 && !RnoUpdate2) {
                    RnoUpdate2 = true;
                    setTimeout(function() {game.over = true; game.overCounter = 0; canvas.style.cursor = "auto";
                }, 2000);
                } else {
                    RnoUpdate2 = true;
                    setTimeout(function() {game.newLife = true;},2000);
                }
            }

            // CHECK SHIP BULLETS AGAINST SAUCER
            if (saucerArray.length > 0) {
                if (bulletArray[i].type == 1 && checkCollision(bulletArray[i], saucerArray[0])) {
                    game.saucersDestroyed++;
                    saucerArray[0].explode();
                }
            }
            
            // CHECK ALL BULLETS AGAINST ROCKS
            for (var r = 0; r < rockArray.length; r++) {
                if (checkCollision(bulletArray[i], rockArray[r])) {
                    bulletArray[i].visible = false;
                    var score = bulletArray[i].type == 2 ? false : true;
                    rockArray[r].explode(score);
                    if (!bulletArray[i].type == 2) game.asteroidsDestroyed++;
                }
            }
        }
    }
}

function updateRocks(elapsed) {     // UPDATE ASTEROID POSITIONS & CHECK COLLISION

    if (RnoUpdate) return;

    for (var i = rockArray.length - 1; i >= 0; i--) {
        if (!rockArray[i].visible) {
            rockArray.splice(i, 1);
            game.currentRocks--;
            if (rockArray.length < 1) {
                RnoUpdate = true;
                setTimeout(function(){game.newLevel = true;}, 2500);
            }
        } else {
            rockArray[i].updatePosition(elapsed);
            rockArray[i].draw(ctx);

            if (checkCollision(rockArray[i], ship)) {
                rockArray[i].explode(true);
                game.asteroidsDestroyed++;
                ship.explode();
                if (game.lives - 1 == 0 && !RnoUpdate2) {
                    RnoUpdate2 = true;
                    setTimeout(function() {game.over = true; game.overCounter = 0; canvas.style.cursor = "auto";
                }, 2000);
                } else {
                    RnoUpdate2 = true;
                    setTimeout(function() {game.newLife = true;}, 2000);
                }
            }
        }
    }
}

function updateExplode(elapsed) {       // UPDATE EXPLOSION PARTICLES 

    for (var i = explodeArray.length - 1; i >= 0; i--) {
        if (!explodeArray[i].visible) {
            explodeArray.splice(i, 1);
        } else {
            explodeArray[i].updatePosition(elapsed);
            explodeArray[i].draw();
        }
    }
}

function playBeat(elapsed) {        // HANDLES BEAT AND ADJUSTS TIMING BASED ON # OF ROCKS

    if (!ship.visible || rockArray.length == 0) return;

    var timeDiff = beatTimerMax - beatTimerMin;
    var decAmt = timeDiff / game.totalRocks;
    var totalDiff = (game.totalRocks - game.currentRocks) * decAmt;
    beatCurrentMax = beatTimerMax - totalDiff;

    beatTimer -= elapsed;

    if (beatTimer < 0) {
        beatTimer = beatCurrentMax;

        if (beatTrack == 1) {
            beatTrack = 2;
            if (options.sndBeat) sndBeat2.play();
        } else {
            beatTrack = 1;
            if (options.sndBeat) sndBeat1.play();
        }
    }
}

function keyDown(e) {       // HANDLER FOR WHEN KEY IS PRESSED DOWN
    
    event.stopPropagation();

    keyArray[e.keyCode] = true; // STORES KEYPRESS IN KEY ARRAY

    if (game.welcome) {     // ANY KEY STARTS GAME FROM WELCOME SCREEN
        keyArray[e.keyCode] = false;
        game.welcome = false;
        newGame();
    }

    if (game.over && !game.newHighScore) {  // ANY KEY STARTS GAME FROM GAME OVER SCREEN
        keyArray[e.keyCode] = false;
        game.over = false;
        newGame();
    }

    if (keyArray[32] == true) {         // TOGGLE FIRING TIMER
        if (game.fireOn == false) {
            keyArray[32] = false;
        } else {
            game.fireOn = false;
        }
    }
}

function keyUp(e) {     // HANDLER FOR WHEN KEY IS LET BACK UP
    
    event.stopPropagation();

    keyArray[e.keyCode] = false;    // REMOVES KEYPRESS FROM KEY ARRAY

    if (e.keyCode == 32) {      //TOGGLE FIRING TIMER
        game.fireOn = true;
    }
}

function checkKeys() {  // CHECK WHICH KEYS ARE ACTIVE

    if (keyArray[39] && ship.visible) ship.rotate(1);    // RIGHT ARROW
    if (keyArray[37] && ship.visible) ship.rotate(-1);   // LEFT ARROW
    
    if (keyArray[38] && ship.visible) {                  // UP ARROW
        ship.thrust = true;
        if (options.sndThrust) sndThrust.play();
    }else {
        ship.thrust = false;
        sndThrust.pause();
        sndThrust.currentTime = 0;
    }

    if (keyArray[32] && ship.visible) {                  // SPACEBAR
        fireBullet();     
        keyArray[32] = false; 
    }

    if (keyArray[80]) {                                 // 'P' KEY
        if (!options.pause && !game.welcome && !game.over) {
            options.pause = true;
            canvas.style.cursor = "auto";
        }
    }
}

function checkCollision(obj1, obj2) {      // FUNCTION FOR CHECKING COLLISIONS BETWEEN 2 OBJECTS

    if (!obj1.visible || !obj2.visible) return;

    // GET BOUNDING BOX COORDINATES OF BOTH OBJECTS
    var xMin1 = obj1.x - (obj1.width / 2), xMax1 = obj1.x + (obj1.width / 2)
    var xMin2 = obj2.x - (obj2.width / 2), xMax2 = obj2.x + (obj2.width / 2);
    var yMin1 = obj1.y - (obj1.height / 2), yMax1 = obj1.y + (obj1.height / 2)
    var yMin2 = obj2.y - (obj2.height / 2), yMax2 = obj2.y + (obj2.height / 2);

    // CHECK FOR INTERSECTION OF BOTH BOUNDING BOXES AND EXIT FUNCTION IF NO INTERSECTION
    if (xMax1 < xMin2 || yMax1 < yMin2 || xMin1 > xMax2 || yMin1 > yMax2) return false;

    // GET COORDINATES OF INTERSECTING BOX
    var xMin = Math.max(xMin1, xMin2);
    var xMax = Math.min(xMax1, xMax2);
    var yMin = Math.max(yMin1, yMin2);
    var yMax = Math.min(yMax1, yMax2);

    // CLEAR 2ND CANVAS AND DRAW OBJECT #1 ON IT
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
    obj1.draw(ctx2);

    // CAPTURE OBJECT #1 IMAGE DATA FROM INTERSECTING BOX
    var imageData1 = ctx2.getImageData(xMin, yMin, Math.ceil(xMax - xMin), Math.ceil(yMax - yMin));

    // CLEAR 2ND CANVAS AGAIN AND DRAW OBJECT #2 ON IT
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
    obj2.draw(ctx2);

    // CAPTURE OBJECT #2 IMAGE DATA FROM INTERSECTING BOX
    var imageData2 = ctx2.getImageData(xMin, yMin, Math.ceil(xMax - xMin), Math.ceil(yMax - yMin));

    var checkQuality = 4 * 2;   // RESOLUTION LEVEL (2 = EVERY OTHER PIXEL)
    var checkLength = imageData1.data.length;

    // CHECK IMAGE DATA FROM BOTH OBJECTS FOR NON TRANSPARENT PIXELS AND RETURN TRUE IF COLLISION
    for (var i = 0; i < checkLength; i += checkQuality) {
        if (imageData1.data[i + 3] !== 0 && imageData2.data[i + 3] !== 0) return true;
    }

    return false;
}

function getSafeBox() {     // MAKE PROTECTIVE BOUNDARY AROUND SHIP FOR LEVEL CHANGE/NEW GAME
    
    safeX1 = ship.x - 150;
    safeX2 = ship.x + 150; 

    safeY1 = ship.y - 125;
    safeY2 = ship.y + 125;
}

function loadFiles(type, filename) {    // FILE LOAD HANDLER SO GAME DOESN'T START BEFORE FILES LOADED

    //  1 - IMAGE FILE
    //  2 - SOUND FILE

    switch (type) {
        case 1:
            var img = new Image();
            img.addEventListener("load", filesLoaded, false);
            img.src = filename;
            filesToLoad++;
            return img;
            break;

        case 2:
            var snd = new Audio(filename);
            snd.addEventListener("canplaythrough", filesLoaded, false);
            filesToLoad++;
            return snd;
            break;
    }
}

function filesLoaded() {    // ONCE FILES LOADED, RUN GAMELOOP FUNCTION

    if (--filesToLoad == 0) {
        lastTime=Date.now();
        gameLoop();
    }
}

function format(num, formatType) {  // REGEX FOR DISPLAYING FORMATTED NUMBERS

    if (formatType = "comma") return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
    if (formatType = "currency") return '$' + num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

function rnd(lower, upper, round) {     // RANDOM NUMBER GENERATOR
    
    if (round) {
        return Math.round(Math.random() * (upper - lower) + lower);
    } else {
        return Math.random() * (upper - lower) + lower;
    }
}

function lostFocus() {      // PAUSE GAME WHEN BROWSER LOSES FOCUS
    
    if (!options.pause && !game.welcome && !game.over) {
        options.pause = true;
        canvas.style.cursor = "auto";
    }
}

function getHighScores() {      // LOAD HIGH SCORES FROM SERVER

    game.highScoreLoaded = false;
    game.highScoreTimer = 0;
    game.highScoreTimerOn = true;

    xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            highScoreArray = JSON.parse(this.responseText);
            game.highScoreLoaded = true;
            game.highScoreTimerOn = false;
        }
    };

    xhttp.open("POST", "php/highscore.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("hsarray=0&gp=g");    
}

function compare(value1, value2) {  // OBJECT SORTER FOR HIGH SCORE ARRAY

    // SORT HIGHEST TO LOWEST
    return value2.score - value1.score;
}

function updateWelcomeScreen() {    // DISPLAY WELCOME SCREEN WHEN GAME LOADS

    ctx.save();
    ctx.strokeStyle = "yellow"
    ctx.lineWidth = 0.75;
    ctx.font = "90px arial";
    ctx.textAlign = "center";
    ctx.textBaseline="top";
    ctx.strokeText("Razteroids", screenWidth / 2, 25);

    ctx.strokeStyle = "white";
    ctx.font = "30px arial";
    ctx.lineWidth = 0.25;
    ctx.strokeText("High Scores", screenWidth / 2, 125);

    if (game.highScoreLoaded) {
        displayHighScores();
    } else {
        if (game.highScoreTimerOn == true && game.highScoreTimer > 3) {
            ctx.textAlign = "center";
            ctx.fillStyle = "red";
            ctx.fillText("High Score File Not Available", screenWidth / 2, 175);
            ctx.fillText("No Internet Connection", screenWidth / 2, 215);
        } else {
            ctx.textAlign = "center";
            ctx.fillStyle = "red";
            ctx.fillText("Loading...", screenWidth / 2, 175);
        }
    }

    hsY=395;

    ctx.font = "24px arial";
    ctx.textAlign = "center";
    ctx.strokeText("Game Keys", screenWidth / 2, hsY);

    hsY+=35;

    ctx.fillStyle = "yellow";
    ctx.font = "24px arial";
    ctx.fillText(instructionArray[game.instructionRec], screenWidth / 2, hsY);

    ctx.font = "24px arial";
    hsY += 40
    ctx.fillStyle = "white";
    
    if (game.startDisplay) {
        ctx.fillText("Press Any Key to Start", screenWidth / 2, hsY);
    } 

    ctx.fillStyle = "gray";
    ctx.font = "10px serif";
    ctx.textBaseline = "bottom";
    ctx.fillText("Designed with JavaScript by Michael Rasmussen", screenWidth / 2, screenHeight - 5);

    ctx.restore();
}

function displayHighScores() {  // DISPLAYS CONTENTS OF HIGH SCORE ARRAY

    var hsX = screenWidth / 2 - 175;
    var hsY = 175;

    ctx.save();
    ctx.font = "14px arial";
    ctx.fillStyle = "white";

    if (highScoreArray.length > 0) {
        for (var i = 0; i < highScoreArray.length; i++) {
            ctx.textAlign = "left";
            ctx.fillText(i + 1 + ".", hsX, hsY);
            ctx.fillText(highScoreArray[i].name, hsX + 25, hsY);
            ctx.fillText("level: " + highScoreArray[i].level, hsX + 225, hsY)
            ctx.textAlign = "right";
            ctx.fillText(format(highScoreArray[i].score, "comma"), hsX + 350, hsY);
            hsY += 20;
        }
    } else {
        ctx.textAlign = "center";
        ctx.fillStyle = "red";
        ctx.fillText("No Internet Connection", screenWidth / 2, 175);
    }

    ctx.restore();
}

function updatePauseScreen(display) {       // SHOW/HIDE PAUSE SCREEN & SAVE OPTION CHANGES

    var pauseScreen = document.getElementById("pause");
    var playButton = document.getElementById("play");

    if (display == "hide") {
        options.sndBeat = document.getElementById("chkbeat").checked;
        options.sndMissle = document.getElementById("chkmissle").checked;
        options.sndThrust = document.getElementById("chkthrust").checked;
        options.sndExplode = document.getElementById("chkexplode").checked;
        options.sndSaucer = document.getElementById("chksaucer").checked;
        
        if (ls) localStorage.gameOptions = JSON.stringify(options);

        options.pause = false;
        playButton.removeEventListener("click", clickPlay, false);
        pauseScreen.classList.add("hidden");
    } else {
        options.pause = true;
        pauseScreen.classList.remove("hidden");
        var pausePos = pauseScreen.getBoundingClientRect();
        pauseScreen.style.left = screenWidth / 2 - pausePos.width / 2 + "px";
        pauseScreen.style.top = screenHeight / 2 - pausePos.height / 2 + "px";
        
        playButton.addEventListener("click", clickPlay, false);
        
        document.getElementById("chkbeat").checked = options.sndBeat
        document.getElementById("chkmissle").checked = options.sndMissle;
        document.getElementById("chkthrust").checked = options.sndThrust;
        document.getElementById("chkexplode").checked = options.sndExplode;
        document.getElementById("chksaucer").checked = options.sndSaucer;

        document.getElementById("level").textContent = game.level;
        document.getElementById("minutesplayed").textContent = (game.minutesPlayed / 60).toFixed(1);
        document.getElementById("misslesfired").textContent = format(game.misslesFired, "comma");
        document.getElementById("asteroidsdestroyed").textContent = format(game.asteroidsDestroyed, "comma");
        document.getElementById("saucersdestroyed").textContent = format(game.saucersDestroyed, "comma");

        if (ls) {
            document.getElementById("errors").innerHTML = "Settings Saved Locally";
        } else {
            document.getElementById("errors").innerHTML = "Permanent Storage Unavailable";
        }

        if (game.bigSaucerPlaying) sndBigSaucer.pause();
        if (game.smallSaucerPlaying) sndSmallSaucer.pause();

        playButton.focus();
    }
}

function clickPlay() {  // UN PAUSE GAME & RESTART PAUSED SOUNDS
        
    updatePauseScreen("hide");

    if (game.bigSaucerPlaying && options.sndSaucer) {
        sndBigSaucer.play();
        sndBigSaucer.loop = true;
    }
    if (game.smallSaucerPlaying && options.sndSaucer) {
        sndSmallSaucer.play();
        sndSmallSaucer.loop = true;
    }

    canvas.style.cursor = "none";
    lastTime = Date.now(); 
    gameLoop();
}

function drawScores() {     // UPDATE SCORE, LEVEL, AND LIVES

    if (game.welcome || game.over) return;
    
    var y=20;
    
    ctx.save();
    ctx.strokeStyle = "white";
    ctx.fillStyle = "white";
    ctx.lineWidth = 1;

    // DRAW SHIPS REPRESENTING REMAINING LIVES
    for (var i = 1; i < game.lives; i++) {
        var x = (10 * i); 
        x += 15 * i;
        ctx.beginPath();
        ctx.moveTo(x, y - 15);
        ctx.lineTo(x - 10, y + 10);
        ctx.lineTo(x + 10, y + 10);
        ctx.closePath();
        ctx.stroke();
    }
    
    // DRAW SCORE
    ctx.font = "30px arial";
    ctx.textBaseline = "top";
    ctx.lineWidth = 0.25
    ctx.textAlign = "center";
    ctx.strokeText(format(game.score, "comma"), screenWidth / 2, y - 15);
    
    // DRAW LEVEL
    ctx.textAlign = "right";
    ctx.strokeText("Level " + game.level, screenWidth - 10, y - 15);

    ctx.restore();
}

function gameOverScreen(elapsed) {  // SHOW GAME OVER SCREEN

    if (game.highScoreUpdate == false) checkHighScore();
    
    // RETURN TO WELCOME SCREEN AFTER 15 SECONDS
    game.overCounter += elapsed
    if (game.overCounter > 15) {
        game.overCounter = 0;
        game.over = false;
        game.welcome = true;
    }

    ctx.save();
    ctx.strokeStyle = "yellow"
    ctx.lineWidth = 0.75;
    ctx.font = "60px arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.strokeText("Razteroids", screenWidth / 2, 25);

    ctx.font = "100px arial";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeText("GAME OVER", screenWidth / 2, 125);

    ctx.font = "14px arial";
    document.getElementById("level").textContent = game.level;
    document.getElementById("minutesplayed").textContent = (game.minutesPlayed / 60).toFixed(1);
    document.getElementById("misslesfired").textContent = format(game.misslesFired, "comma");
    document.getElementById("asteroidsdestroyed").textContent = format(game.asteroidsDestroyed, "comma");
    document.getElementById("saucersdestroyed").textContent = format(game.saucersDestroyed, "comma");

    ctx.fillStyle = "yellow";
    ctx.strokeStyle = "white";
    ctx.textAlign = "left";
    ctx.lineWidth = 0.25;
    var hsX = screenWidth / 2 - 120;
    var hsY = 250;

    ctx.fillText("Final Score:", hsX, hsY); hsY += 20;
    ctx.fillText("Last Level:", hsX, hsY); hsY += 20;
    ctx.fillText("Minutes Played:", hsX, hsY); hsY += 20;
    ctx.fillText("Missles Fired:", hsX, hsY); hsY += 20;
    ctx.fillText("Asteroids Destroyed:", hsX, hsY); hsY += 20;
    ctx.fillText("Saucers Destroyed:", hsX, hsY); hsY += 20;

    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    var hsX=screenWidth / 2 + 120;
    var hsY = 250;

    ctx.fillText(format(game.score, "comma"), hsX, hsY); hsY += 20;
    ctx.fillText(game.level, hsX, hsY); hsY += 20;
    ctx.fillText((game.minutesPlayed / 60).toFixed(1), hsX, hsY); hsY += 20;
    ctx.fillText(format(game.misslesFired, "comma"), hsX, hsY); hsY += 20;
    ctx.fillText(format(game.asteroidsDestroyed, "comma"), hsX, hsY); hsY += 20;
    ctx.fillText(format(game.saucersDestroyed, "comma"), hsX, hsY); hsY += 20;

    ctx.font = "24px arial";
    ctx.textAlign = "center";

    hsY += 50;

    ctx.font = "24px arial";
    ctx.fillStyle = "white";
    
    ctx.fillText("Press Any Key to Start a New Game", screenWidth / 2, hsY);

    ctx.fillStyle = "gray";
    ctx.font = "10px serif";
    ctx.textBaseline = "bottom";
    ctx.fillText("Designed with JavaScript by Michael Rasmussen", screenWidth / 2, screenHeight - 5);

    ctx.restore();
}

function checkHighScore() { // CHECK TO SEE IF PLAYER MADE THE TOP 10

    game.highScoreUpdate = true;

    var tt = false;
    highScoreArray = [];

    xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            highScoreArray = JSON.parse(this.responseText);
            for (var i = 0; i < highScoreArray.length; i++) {
                if (game.score > highScoreArray[i].score) tt = true;
            }

            if (highScoreArray.length < 10) tt = true;

            if (tt) {
                sndBigSaucer.pause();
                sndSmallSaucer.pause();
                game.newHighScore = true;
                var hs=document.getElementById("highscore");
                hs.classList.remove("hidden");
                var pausePos = hs.getBoundingClientRect();
                hs.style.left = screenWidth / 2 - pausePos.width / 2 + "px";
                hs.style.top = screenHeight / 2 - pausePos.height / 2 + "px";
                document.getElementById("hsname").select();
            }
        }
    };

    xhttp.open("POST", "php/highscore.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("hsarray=o&gp=g");    
}

function updateHighScore(type) {    // UPDATE NEW HIGH SCORES INTO ARRAY & SEND TO SERVER

    if (type == 2) {
        var newName = "Anonymous";
    } else {
        var newName = document.getElementById("hsname").value;
    }
    
    highScoreArray.push({name: newName, score: game.score, level: game.level});
    highScoreArray.sort(compare);

    if (highScoreArray.length > 10) {
        highScoreArray.length = 10;
    }

    xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log (this.responseText);
        }
    };

    xhttp.open("POST", "php/highscore.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("hsarray=" + JSON.stringify(highScoreArray) + "&gp=p");    

    document.getElementById("hsname").value = "Player 1";
    document.getElementById("highscore").classList.add("hidden");
    game.newHighScore = false;
    game.overCounter = 10;
    lastTime = Date.now();
    gameLoop();
}