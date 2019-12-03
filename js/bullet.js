class Bullet {

    constructor(settings) {
       
        this.width = 3;
        this.height = 3;
        this.sx = settings.x;
        this.sy = settings.y;
        this.x = this.sx;
        this.y = this.sy;
        this.angle = settings.angle;
        this.lastTime = Date.now();
        this.speed = 600;
        this.visible = true;
        this.distance = 0;
        this.xDistance = 0;
        this.yDistance = 0;
        this.type = settings.type || 1
        this.xLimit = this.type == 1 ? screenWidth * .55 : screenWidth + 30;
        this.yLimit = this.type == 1 ? screenHeight * .55 : screenWidth + 30;
    }

    draw(c) {   // ROTATE CANVAS AND DRAW BULLET

        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.angle);
        c.strokeStyle = "red";
        c.fillStyle = "white";
        c.lineWidth = 1;
        c.beginPath();
        c.arc(0, 0, 1.75, 0, 2 * Math.PI, false);
        c.closePath();
        c.stroke();
        c.fill();
        c.restore();
    }

    updatePosition(elapsed) {   // UPDATE BULLET LOCATION

        // PLOT NEW POSITION BASED ON D=RT & REMOVE IF AT DISTANCE LIMIT
        var d = this.speed * elapsed
        this.x += d * Math.cos(this.angle);
        this.xDistance += Math.abs(d * Math.cos(this.angle));
        this.y += d * Math.sin(this.angle);
        this.yDistance += Math.abs(d * Math.sin(this.angle));
        if(this.xDistance > this.xLimit || this.yDistance > this.yLimit) this.visible=false;
        this.sx = this.x;
        this.sy = this.y;

        // IF BULLET CROSES SCREEN BOUNDARIES PLACE ON OTHER SIDE
        if(this.type == 1) {
            if(this.x > screenWidth + 2) {
                this.x = -2;
                this.sx = this.x;
            }
            if(this.x < -2) {
                this.x = screenWidth + 2;
                this.sx = this.x;
            }
            if(this.y > screenHeight + 2) {
                this.y = -2;
                this.sy = this.y;
            }
            if(this.y < -2) {
                this.y = screenHeight + 2;
                this.sy = this.y;
            }
        }
    }
}