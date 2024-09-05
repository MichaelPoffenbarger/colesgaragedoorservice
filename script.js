const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');

const width = 250;
const height = 250;
canvas.width = width;
canvas.height = height;

const numParticles = 5000;
const particles = [];

let flowField = [];
const resolution = 20;
const cols = Math.floor(width / resolution);
const rows = Math.floor(height / resolution);

let isMouseOver = false;

const colorPalette = [
  'rgba(255, 255, 255, 0.5)',   // Red
  'rgba(0, 255, 0, 0.5)',   // Green
  'rgba(255, 255, 255, 0.5)',   // Blue
  'rgba(0, 255, 160, 1)', // Yellow
  'rgba(255, 255, 255, 0.5)', // Magenta
  'rgba(10, 10, 10, 0.5)', // Cyan
];

const obstacle = {
  x: width / 2,
  y: height / 2,
  radius: 80,
  
  
  image: null,
  loadImage: function() {
    this.image = new Image();
    this.image.src = 'img/strongbow.png'; // Replace with your image path
    this.image.onload = () => {
      console.log('Obstacle image loaded successfully');
    };
    this.image.onerror = () => {
      console.error('Failed to load obstacle image');
    };
  }
};

let mouseX = 0;
let mouseY = 0;
const mouseObstacle = {
  x: 0,
  y: 0,
  radius: 50
};

let obstacleImage;

function setup() {
  for (let i = 0; i < numParticles; i++) {
    particles.push(new Particle());
  }
  initFlowField();
  
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseenter', () => isMouseOver = true);
  canvas.addEventListener('mouseleave', () => isMouseOver = false);
  
  obstacle.loadImage();
}

function animate(currentTime) {
  console.log(`Particle count: ${particles.length}`);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  ctx.fillRect(0, 0, width, height);

  updateFlowField();

  // Check if 5 seconds have passed since last particle addition
  if (currentTime - lastParticleAddTime > 5000) {
    createTopLeftParticles();
    lastParticleAddTime = currentTime;
  }

  for (let i = 0; i < particles.length; i++) {
    const particle = particles[i];
    particle.follow(flowField);
    particle.update();
    particle.edges();
    particle.show();
  }

  // Draw the obstacle image
  if (obstacle.image && obstacle.image.complete) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(obstacle.image, 
      obstacle.x - obstacle.radius, 
      obstacle.y - obstacle.radius, 
      obstacle.radius * 2, 
      obstacle.radius * 2
    );
    ctx.restore();
  }

  // Draw obstacle border
  ctx.strokeStyle = obstacle.borderColor;
  ctx.lineWidth = obstacle.borderWidth;
  ctx.beginPath();
  ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
  ctx.stroke();

  frameCount++;
  requestAnimationFrame(animate);
}

function initFlowField() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const index = x + y * cols;
      flowField[index] = Math.random() * Math.PI * 2;
    }
  }
}

function updateFlowField() {
  let yoff = 0;
  for (let y = 0; y < rows; y++) {
    let xoff = 0;
    for (let x = 0; x < cols; x++) {
      const index = x + y * cols;
      let angle = noise(xoff, yoff, frameCount * 0.01) * Math.PI * 2;
      
      angle = adjustFlowForObstacle(x, y, obstacle, angle);
      if (isMouseOver) {
        angle = adjustFlowForObstacle(x, y, mouseObstacle, angle);
      }
      
      flowField[index] = angle;
      xoff += 0.1;
    }
    yoff += 0.1;
  }
}

function adjustFlowForObstacle(x, y, obs, angle) {
  const dx = x * resolution - obs.x;
  const dy = y * resolution - obs.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance < obs.radius + 40) {
    const deflectionAngle = Math.atan2(dy, dx);
    return deflectionAngle + Math.PI / 2;
  }
  return angle;
}

class Particle {
  constructor(x, y) {
    this.pos = new Vector(x || Math.random() * width, y || Math.random() * height);
    this.vel = new Vector(0, 0);
    this.acc = new Vector(0, 0);
    this.maxSpeed = 2;
    this.normalizationFactor = 0.5; // New property to control normalization
    this.color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    
    this.handleObstacle(obstacle);
    if (isMouseOver) {
      this.handleObstacle(mouseObstacle);
    }
    
    // Apply reduced normalization
    this.vel.x += (Math.random() - 0.5) * this.normalizationFactor;
    this.vel.y += (Math.random() - 0.5) * this.normalizationFactor;
    
    this.pos.add(this.vel);
    this.edges(); // Call edges() immediately after updating position
    this.acc.mult(0);
  }

  handleObstacle(obs) {
    const dx = this.pos.x - obs.x;
    const dy = this.pos.y - obs.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < obs.radius + 20) {
      // Calculate clockwise tangent vector
      const angle = Math.atan2(dy, dx);
      const tangentAngle = angle + Math.PI / 2;
      
      // Set new velocity along the tangent
      const speed = this.vel.mag() * 1.5; // Increase speed near obstacle
      this.vel.x = Math.cos(tangentAngle) * speed;
      this.vel.y = Math.sin(tangentAngle) * speed;
      
      // Push particle slightly away from obstacle
      const pushFactor = 1;
      this.pos.x += (dx / distance) * pushFactor;
      this.pos.y += (dy / distance) * pushFactor;
    }
  }

  follow(flowField) {
    const x = Math.floor(this.pos.x / resolution);
    const y = Math.floor(this.pos.y / resolution);
    const index = x + y * cols;
    const force = Vector.fromAngle(flowField[index]);
    force.setMag(0.1);
    this.applyForce(force);
  }

  applyForce(force) {
    this.acc.add(force);
  }

  edges() {
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.y > height) this.pos.y = 0;
    if (this.pos.y < 0) this.pos.y = height;
    
    // Ensure the particle is always within bounds
    this.pos.x = Math.max(0, Math.min(width, this.pos.x));
    this.pos.y = Math.max(0, Math.min(height, this.pos.y));
  }

  show() {
    // Ensure particle is within bounds before drawing
    this.edges();
    
    ctx.strokeStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.pos.x, this.pos.y);
    ctx.lineTo(this.pos.x + this.vel.x, this.pos.y + this.vel.y);
    ctx.stroke();
  }
}

class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
  }

  mult(n) {
    this.x *= n;
    this.y *= n;
  }

  setMag(mag) {
    this.normalize();
    this.mult(mag);
  }

  normalize() {
    const len = this.mag();
    if (len !== 0) this.mult(1 / len);
  }

  mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  limit(max) {
    if (this.mag() > max) {
      this.normalize();
      this.mult(max);
    }
  }

  static fromAngle(angle) {
    return new Vector(Math.cos(angle), Math.sin(angle));
  }
}

function noise(x, y, z) {
  // Simple Perlin noise implementation
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  z -= Math.floor(z);
  const u = fade(x);
  const v = fade(y);
  const w = fade(z);
  const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z;
  const B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
  return lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z), 
                                 grad(p[BA], x - 1, y, z)),
                         lerp(u, grad(p[AB], x, y - 1, z),
                                 grad(p[BB], x - 1, y - 1, z))),
                 lerp(v, lerp(u, grad(p[AA + 1], x, y, z - 1),
                                 grad(p[BA + 1], x - 1, y, z - 1)),
                         lerp(u, grad(p[AB + 1], x, y - 1, z - 1),
                                 grad(p[BB + 1], x - 1, y - 1, z - 1))));
}

function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(t, a, b) { return a + t * (b - a); }
function grad(hash, x, y, z) {
  const h = hash & 15;
  const u = h < 8 ? x : y,
        v = h < 4 ? y : h == 12 || h == 14 ? x : z;
  return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
}

const p = new Array(512);
for (let i = 0; i < 256; i++) p[i] = p[i + 256] = Math.floor(Math.random() * 256);

let frameCount = 0;

function onMouseMove(event) {
  mouseX = event.clientX - canvas.offsetLeft;
  mouseY = event.clientY - canvas.offsetTop;
  mouseObstacle.x = mouseX;
  mouseObstacle.y = mouseY;
}

function createTopLeftParticles() {
  for (let i = 0; i < 3100; i++) {
    particles.push(new Particle(Math.random() * 200, Math.random() * 200)); // Random position within 50x50 pixels in top left
  }
  console.log(`Added 5000 particles. New count: ${particles.length}`);
}

let lastParticleAddTime = 0;


setup();
requestAnimationFrame(animate);
