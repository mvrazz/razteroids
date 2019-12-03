class Saucer {
    
    constructor(settings) {
        
        this.size = settings.size || 1
        this.directionArray = [];

        // SET ACCURACY ANGLES OF SMALL SAUCER (START AT +/- 18 DEG & WORK DOWN TO +/- 2 DEG.)
        this.accuracy = 18 - game.level;
        if(this.accuracy < 2) this.accuracy = 2;
        
        // PICK START LOCATION AND FILL ARRAY WITH POSSIBLE ANGLES FOR RANDOM MOVEMENT
        if(this.rnd(1, 2) == 1) {
            this.direction = -1;
            this.startX = screenWidth + 25;
            for(var i = 105; i < 256; i++) {
                this.directionArray.push(i * (Math.PI / 180));
            }
        } else {
            this.direction = 1;
            this.startX = -25;
            for(var i = 0; i < 76; i++) {
                this.directionArray.push(i * (Math.PI / 180));
            }
            for(var i = 285; i < 360; i++) {
                this.directionArray.push(i * (Math.PI / 180));
            }
        }

        // PLACE AT START POINT AND PICK FIRST ANGLE OF MOVEMENT
        this.x = this.startX;
        this.y = this.rnd(25, screenHeight - 25);
        this.angle = this.directionArray[this.rnd(0, this.directionArray.length - 1)];

        if(this.size == 1) {
            this.width = 50;
            this.height = 30;
            this.speed = 125;
            this.score = 200;
        } else {
            this.width = 25;
            this.height = 15;
            this.speed = 150;
            this.score = 1000;
        }

        this.directionChange = screenWidth / 5;    // SET NUMBER OF DIRECTION CHANGES
        this.fireMax = 1.4; // SET TIME BETWEEN FIRING
        this.fireTimer = this.fireMax + .25; // DELAY INITIAL FIRE
        this.visible = true;
    }

    draw(c) {       // DRAW SAUCER ON SCREEN

        if(!this.visible) return;
        
        var x = this.x;
        var y = this.y;

        c.save();
        c.strokeStyle = "gray";
        c.fillStyle = "white";
        c.lineWidth = 1;

        if(this.size == 1) {        // DRAW LARGE SAUCER
            c.beginPath();
            c.moveTo(x - 5, y - 15);
            c.lineTo(x + 5, y - 15);
            c.lineTo(x + 10, y - 5);
            c.lineTo(x - 10, y - 5);
            c.closePath();
            c.fill();
            c.stroke();

            c.beginPath();
            c.moveTo(x + 10, y - 5)
            c.lineTo(x + 25, y + 5);
            c.lineTo(x - 25, y + 5);
            c.lineTo(x - 10, y - 5);
            c.closePath();
            c.fill();
            c.stroke();

            c.beginPath();
            c.moveTo(x + 25, y + 5)
            c.lineTo(x + 10, y + 15);
            c.lineTo(x - 10, y + 15);
            c.lineTo(x - 25, y + 5);
            c.closePath();
            c.fill();
            c.stroke();
        } else {                    // DRAW SMALL SAUCER
            c.beginPath();
            c.moveTo(x - 2.5, y - 7.5);
            c.lineTo(x + 2.5, y - 7.5);
            c.lineTo(x + 5, y - 2.5);
            c.lineTo(x - 5, y - 2.5);
            c.closePath();
            c.fill();
            c.stroke();

            c.beginPath();
            c.moveTo(x + 5, y - 2.5)
            c.lineTo(x + 12.5, y + 2.5);
            c.lineTo(x - 12.5, y + 2.5);
            c.lineTo(x - 5, y - 2.5);
            c.closePath();
            c.fill();
            c.stroke();

            c.beginPath();
            c.moveTo(x + 12.5, y + 2.5)
            c.lineTo(x + 5, y + 7.5);
            c.lineTo(x - 5, y + 7.5);
            c.lineTo(x - 12.5, y + 2.5);
            c.closePath();
            c.fill();
            c.stroke();
        }

        c.restore();
    }

    update(elapsed) {       // UPDATE LOCATION & FIRE WHEN TIMER REACHED

        var d = this.speed * elapsed
        this.x += (d * Math.cos(this.angle)) ;
        this.y += (d * Math.sin(this.angle)) ;

        if(this.direction==1) {
            var xd = this.x - this.startX;
        } else {
            var xd = this.startX - this.x;
        }

        if(xd > this.directionChange) {
            this.startX = this.x;
            this.angle = this.directionArray[this.rnd(0, this.directionArray.length - 1)];
        }

        if(this.x > screenWidth + 30 || this.x < -30) this.visible = false;
        
        if(this.y > screenHeight - 20 || this.y < 20) {
            this.angle *= -1; 
        }

        //FIRE
        this.fireTimer -= elapsed;
        if(this.fireTimer < 0) {

            if(this.size == 1) {
                var angle = this.rnd(0, Math.PI * 2);
            } else {
                var a = Math.atan2(ship.y - this.y, ship.x - this.x)
                var lower = a - (this.accuracy * Math.PI / 180);
                var upper = a + (this.accuracy * Math.PI / 180)
                var angle = this.drnd(lower, upper);
            }

            bulletArray.push(new Bullet({x: this.x, y: this.y, angle: angle, type: 2}));
            sndSaucerFire.currentTime = 0;
            sndSaucerFire.volume = 0.3;
            if(options.sndMissle) sndSaucerFire.play();

            this.fireTimer = this.fireMax;
        }
    }

    explode() {     // CREATE EXPLOSION PARTICLES WHEN HIT

        for(var i = 1; i < 200; i++) {
            explodeArray.push(new Explode({size: 2, x: this.x, y: this.y, color: "white"}));
        }
        this.visible = false;
        if(options.sndExplode) sndLargeBang.play();
        game.score+=this.score;
    }

    rnd(lower, upper) {     // GENERATE RANDOM NUMBER (ROUNDED)
        
        return Math.round(Math.random() * (upper - lower) + lower);
    }

    drnd(lower, upper) {    // GENERATE RANDOM NUMBER (NO ROUND)
        
        return Math.random() * (upper - lower) + lower;
    }
}