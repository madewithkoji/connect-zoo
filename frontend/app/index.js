let balls = [];
let gravity;
let BALLSIZE = Math.floor(Math.sqrt(window.innerWidth*window.innerHeight / 50) / 2);
let images;
let backgroundImage;
let selectedIndex = -1;
let chain = [];
let score = 0;
let timing = 1000;
let gameOver = false;
let modalOpen = false;
let overlay;

function setup() {
    const canvas = createCanvas(window.innerWidth, window.innerHeight);
    canvas.parent('root');
    
    gravity = createVector(0, 0.1);
    for(let i=0;i<50;i++) {
        balls.push(new Ball(random(window.innerWidth), random(window.innerHeight), 0, Math.floor(random(6)), i));
    }
    images = [1,2,3,4,5,6].map((n) => loadImage(Koji.config.images[`ball${n}`]));
    backgroundImage = loadImage(Koji.config.images.backgroundImage);

    // setup a pwa install popover
    if (!window.matchMedia('(display-mode: standalone)').matches) {
      Koji.on('pwaPromptReady', () => {
        window.pwaReady = true;
        setTimeout(() => createModal(), 20000);
      })
    }
}

function windowResized() {
  resizeCanvas(window.innerWidth, window.innerHeight);
  BALLSIZE = Math.floor(Math.sqrt(window.innerWidth*window.innerHeight / 50) / 2);
}


function mousePressed() {
    if(gameOver) window.location.reload();
}

function mouseReleased() {    
    // remove the balls
    this.selectedIndex = -1;
    if(chain.length >= 3) {
        score += 100*(chain.length-2);
        chain.forEach((c) => {
            balls[c].position.y = random(100) + 100;
            balls[c].position.x = random(window.innerWidth);
            balls[c].type = Math.floor(random(6));
        })
    }
    chain = [];
}

class Ball {
    constructor(x, y, xvel, type, index) {
        this.position = createVector(x, y);
        this.velocity = createVector(xvel, 0);30
        this.radius = BALLSIZE;
        this.index = index;
        this.type = type;
    }

    step() {
        if(mouseIsPressed && collidePointCircle(mouseX, mouseY, this.position.x, this.position.y, BALLSIZE*2)) {
            if(selectedIndex === -1 && chain.length === 0) {
                selectedIndex = this.index;
                chain.push(this.index);
            } else if(selectedIndex != this.index && chain.reduce((c, i) => c + (i === this.index ? 1 : 0), 0) === 0) {
                if(p5.Vector.sub(this.position, balls[selectedIndex].position).mag() < BALLSIZE*3 && this.type === balls[selectedIndex].type) {
                    selectedIndex = this.index;
                    chain.push(this.index);
                }
            }
        }

        if(window.innerHeight - (this.position.y + BALLSIZE) > 5) this.velocity.add(gravity);
        this.velocity.setMag(this.velocity.mag()-0.01)
        this.position.add(this.velocity);

        balls.forEach((ball) => {
            if(this.position.dist(ball.position) < BALLSIZE*2) {
                let dist = p5.Vector.sub(ball.position, this.position);
                this.position.sub(dist.setMag(1 + BALLSIZE*2 - dist.mag()));
                if(this.index < ball.index) {
                    let tmp = ball.velocity.mag();
                    ball.velocity = dist.setMag(this.velocity.mag()*0.95);
                    this.velocity = p5.Vector.mult(dist.setMag(tmp), -0.95);
                }

            }
        });

        if(this.position.x < BALLSIZE || this.position.x > window.innerWidth-BALLSIZE) this.velocity.x *= -0.95;
        if(this.position.y < BALLSIZE || this.position.y > window.innerHeight-BALLSIZE) this.velocity.y *= -0.95;

        if(this.position.x < BALLSIZE) this.position.x = BALLSIZE+1;
        if(this.position.x > window.innerWidth-BALLSIZE) this.position.x = window.innerWidth-BALLSIZE-1;
        if(this.position.y < BALLSIZE) this.position.y = BALLSIZE+1;
        if(this.position.y > window.innerHeight-BALLSIZE) this.position.y = window.innerHeight-BALLSIZE-1;

        image(images[this.type], this.position.x - BALLSIZE, this.position.y - BALLSIZE, BALLSIZE*2, BALLSIZE*2);
    }
}

function draw() {
    background(backgroundImage);
    if(modalOpen) {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        modalOpen = false;
        overlay.remove(); 
      }
      return;
    }
    balls.forEach((ball) => ball.step());
    fill(0);
    if(!mouseIsPressed) selectedIndex = -1;
    if(selectedIndex !== -1){
        circle(balls[selectedIndex].position.x, balls[selectedIndex].position.y, BALLSIZE/2);
        strokeWeight(BALLSIZE/2);
        stroke(0);
        chain.map((c, i, ch) => i !== ch.length-1 && line(balls[c].position.x, balls[c].position.y, balls[ch[i+1]].position.x, balls[ch[i+1]].position.y));
    }

    strokeWeight(0);
    textSize(32);
    fill(Koji.config.colors.textColor);
    text(score, 20, 40);
}

function collidePointCircle(x1, y1, x2, y2, dist) {
    return Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2)) < dist/2;
}

function createModal() {
    modalOpen = true;
    overlay = createDiv().addClass('overlay');
    const box = createDiv().addClass('box');
    const boxtext = createDiv(Koji.config.strings.modalText).addClass('boxtext');
    const button = createButton(Koji.config.strings.modalButtonText);
    button.mousePressed(() => {
        Koji.pwaPrompt();
    });
    box.child(boxtext)
    box.child(button);
    overlay.child(box);
    overlay.parent('root');
}