class Ship {
    
    constructor(settings) {
        
        this.width = 30;
        this.height = 20;
        this.x = settings.screenWidth / 2;
        this.y = settings.screenHeight / 2;
        this.angle = 270 * Math.PI / 180;
        this.thrust = false;
        this.thrustTimer = 0;
        this.mass = 50;
        this.force = 2000;
        this.vx = 0;
        this.vy = 0;
        this.friction = .002;
        this.visible = true;
    }

    draw(c) {   // DRAW PLAYER SHIP ON SCREEN

        if(!this.visible) return;
        
        // ROTATE CANVAS & DRAW SHIP
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.angle);
        c.strokeStyle = "gray";
        c.fillStyle = "white";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(15, 0);
        c.lineTo(-10, 10);
        c.lineTo(-10, -10);
        c.closePath();
        c.stroke();
        c.fill();

        // IF THRUST ON, DRAW THRUST FLAME
        if(this.thrust) {
            ctx.strokeStyle = "yellow";
            ctx.fillStyle = "red";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-11, -7);
            ctx.lineTo(-25, 0);
            ctx.lineTo(-11, 7);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
        }

        c.restore();
    }

    update(elapsed) {       // UPDATE SHIP LOCATION 
        
        // CALCULATE THRUST AND SPEED

        // CALCULATE FORCE APPLIED BASED ON FACING DIRECTION (ANGLE)
        var fx = this.force * Math.cos( this.angle );
        var fy = this.force * Math.sin( this.angle );
    
        // APPLY ACCELERATION BASED ON FORCE / MASS
        var ax = this.thrust ? fx / this.mass : 0;
        var ay = this.thrust ? fy / this.mass : 0;

        // UPDATE NEW LOCATION BASED ON ACCELERATION AND CURRENT VELOCITY
        this.x = ax * elapsed * elapsed + this.vx * elapsed + this.x;
        this.y = ay * elapsed * elapsed + this.vy * elapsed + this.y;
    
        // UPDATE VELOCITY BASED ON CURRENT ACCELERATION
        this.vx += 2 * ax * elapsed;
        this.vy += 2 * ay * elapsed;

        // APPLY FRICTION TO SLOW SHIP (EVENTUALY STOP)
        if(!this.thrust) {
            this.vx -= this.vx * this.friction;
            this.vy -= this.vy * this.friction;
            if(this.vx > -2 && this.vx < 2) this.vx = 0;
            if(this.vy > -2 && this.vy < 2) this.vy = 0;
        }

        // CHECK FOR SCREEN BOUNDARIES
        if(this.x < -5) this.x = screenWidth + 5;
        if(this.x > screenWidth + 5) this.x = -5;
        if(this.y < -5) this.y = screenHeight + 5;
        if(this.y > screenHeight + 5) this.y = -5;
    }

    rotate(direction) {     // TURN SHIP LEFT/RIGHT
        
        this.angle += (3 * Math.PI / 180) * direction;
    }

    explode() {     // CREATE EXPLOSION PARTICLES & REMOVE SHIP

        for(var i = 1; i < 200; i++) {
            explodeArray.push(new Explode({size: 3, x: this.x, y: this.y, color: "red"}));
        }
        this.visible = false;
        if(options.sndExplode) sndLargeBang.play();
    }
}