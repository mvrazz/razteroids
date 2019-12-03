class Explode {

    constructor(settings) {
       
        this.radius = this.rnd(.5, 1.5);
        this.sx = settings.x;
        this.sy = settings.y;
        this.x = this.sx;
        this.y = this.sy;
        this.angle = this.rnd(0, Math.PI * 2);
        this.lastTime = Date.now();
        this.speed = this.rnd(50, 200);
        this.visible = true;
        this.distance = 0;
        this.limit = 60 * settings.size;
        this.color=settings.color || "white";
    }

    draw() {    // DRAW EXPLOSION PARTICLE ON SCREEN

        ctx.save();
        ctx.fillStyle = this.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    updatePosition(elapsed) {   // UPDATE PARTICLE POSITION

        var d = this.speed * elapsed
        this.x += d * Math.cos(this.angle);
        this.y += d * Math.sin(this.angle);
        this.distance = Math.sqrt(Math.pow(this.sx - this.x, 2) + Math.pow(this.sy - this.y, 2));
        if(this.distance > this.limit) this.visible = false;
    }

    rnd(lower, upper) {    // RANDOM NUMBER GENERATOR
        
        var range = upper - lower;
        return Math.random() * range + lower;
    }
}