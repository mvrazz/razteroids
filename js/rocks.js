class Rock {

    constructor(settings) {

        this.minWidth = 0;
        this.maxWidth = 0;
        this.width = 0;
        this.height = 0;
        this.speed = 0;
        this.size = this.setProperties(settings.size || 3);

        if(settings.x) {
            this.x = settings.x;
            this.y = settings.y;
        } else {
            this.x = 0;
            this.y = 0;
            this.getXY();
        }

        this.pointArray = this.getDataPoints();
        this.angle = this.rnd(0, Math.PI * 2);
        this.rotationAngle = 0;
        this.rotationSpeed = this.rnd(0,.3);
        this.rotationDirection = Math.floor(this.rnd(0,2)) == 1 ? 1 : -1;
        this.visible = true;
        this.lastTime = Date.now();
    }

    setProperties(size) {   // SET "THIS" PROPERTIES BASED ON SIZE

        this.size = size;

        switch(size) {
            
            case 3:     // LARGE ASTEROID
                this.minWidth = 65;
                this.maxWidth = 80;
                this.width = 2 * this.maxWidth;
                this.height = 2 * this.maxWidth;
                this.speed = this.rnd(25, 50); 
                return size;
                break;

            case 2:     // MEDIUM ASTEROID
                this.minWidth = 25;
                this.maxWidth = 35;
                this.width = 2 * this.maxWidth;
                this.height = 2 * this.maxWidth;
                this.speed = this.rnd(50, 100); 
                return size;
                break;
    
            case 1:     // SMALL ASTEROID
                this.minWidth = 10;
                this.maxWidth = 15;
                this.width = 2 * this.maxWidth;
                this.height = 2 * this.maxWidth;
                this.speed = this.rnd(100, 250); 
                return size;
        }        
    }

    getXY() {       // GET ACCEPTABLE COORDINATES FOR PLACING INITIAL ROCK ON SCREEN

        // LOOP UNTIL RANDOM COORDINATES ARE FOUND ACCEPTABLE 
        for(var i = 1; i < 500; i++) {

            var x = this.rnd(0, screenWidth);
            var y = this.rnd(0, screenHeight);

            if(x < safeX1 || x > safeX2) break;
            if(y < safeY1 || y > safeY2) break;
            if((x > safeX1 && x < safeX2) && (y < safeY1 || y > safeY2)) break;
            if((y > safeY1 && y < safeY2) && (x < safeX1 || x > safeX2)) break;
        }

        this.x = x;
        this.y = y;
    }

    getDataPoints() {   // GET THE OUTSIDE POINTS OF THE ROCK (FOR RANDOM SHAPES)
        
        var pa = [];

        // FILL ARRAY WITH POINTS BASED ON RANDOM ANGLES AND DISTANCES FROM CENTER
        for(var i = 1; i < 20; i++){
            var angle = this.rnd(0, 2 * Math.PI);
            var distance = this.rnd(this.minWidth, this.maxWidth);
            var nx = distance * Math.cos(angle);
            var ny = distance * Math.sin(angle);
            pa.push({x: nx, y: ny, angle: angle});
        }
    
        // SORT THE POINTS BASED ON ANGLE (RADIANS) AND RETURN IT FOR RENDERING
        pa.sort(this.compare);
        return pa;
    }

    compare(value1, value2) {   // SORT FUNCTION FOR POINT ARRAY

        return value1.angle - value2.angle;
    }

    draw(c) {       // ROTATE CANVAS AND DRAW ASTEROID
        
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.rotationAngle);

        if(c == ctx) {
            c.shadowBlur = 5;
            c.shadowOffsetY = 10;
            c.shadowColor = "black";
            c.shadowOffsetX = 10;
        }
        
        c.fillStyle = "gray";
        c.strokeStyle = "white";
        c.linewidth = 2;
        c.beginPath();
        c.moveTo(this.pointArray[0].x, this.pointArray[0].y);
    
        // DRAW FROM ONE POINT TO THE NEXT UNTIL FULL CIRCLE ACHIEVED
        for (var i = 1; i < this.pointArray.length; i++) {
            c.lineTo(this.pointArray[i].x, this.pointArray[i].y);
        }
    
        c.closePath();
        c.stroke();
        c.fill();
        c.restore();
    }

    updatePosition(elapsed) {   // UPDATE LOCATION OF ASTEROID 

        var d = this.speed * elapsed
        this.rotationAngle += this.rotationDirection * (this.rotationSpeed * elapsed);
        this.x += d * Math.cos(this.angle);
        this.y += d * Math.sin(this.angle);

        // IF ASTEROID CROSSES SCREEN BOUNDARY, MOVE TO OPPOSITE SIDE
        if(this.x > screenWidth + 8) {
            this.x = -8;
            this.sx = this.x;
        }
        if(this.x < -8) {
            this.x = screenWidth + 8;
            this.sx = this.x;
        }
        if(this.y > screenHeight + 4) {
            this.y = -4;
            this.sy = this.y;
        }
        if(this.y < -4) {
            this.y = screenHeight + 4;
            this.sy = this.y;
        }
    }

    explode(score) {    // START EXPLODE SEQUENCE AND BREAK UP ROCK WHEN HIT

        // CREATE EXPLOSION PARTICLES
        for(var i = 1; i < 200; i++) {
            explodeArray.push(new Explode({size: this.size, x: this.x, y: this.y, color: "gray"}));
        }
        
        this.visible = false;

        // LARGE - BREAK INTO 2 MEDIUM
        if(this.size == 3) {
            if(options.sndExplode) sndLargeBang.play();
            rockArray.push(new Rock({size: 2, x: this.x, y: this.y}))
            rockArray.push(new Rock({size: 2, x: this.x, y: this.y}))
            if(score) game.score += 20;
        }

        // MEDIUM - BREAK INTO 2 SMALL
        if(this.size == 2) {
            if(options.sndExplode) sndMediumBang.play();
            rockArray.push(new Rock({size: 1, x: this.x, y: this.y}))
            rockArray.push(new Rock({size: 1, x: this.x, y: this.y}))
            if(score) game.score += 50;
        }

        // SMALL - REMOVE FROM ARRAY
        if(this.size == 1) {
            if(options.sndExplode) sndSmallBang.play();
            if(score) game.score += 100;
        }
    }

    rnd(lower, upper) {     // GENERATE RANDOM NUMBER
        
        return Math.random() * (upper - lower) + lower;
    }
}