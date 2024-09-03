// Load the Strongbow image
const strongbowImage = new Image();
strongbowImage.src = 'img/strongbow.png';

// Wait for the image to load before setting up the flow field
strongbowImage.onload = () => {
    const canvas = document.createElement('canvas');
    const footerContent = document.querySelector('.footer-logo');
    footerContent.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = 300
    canvas.height = 100;
    canvas.style.paddingTop = '50px';
    

   
    // Create an offscreen canvas to store the image data
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCanvas.width = strongbowImage.width;
    offscreenCanvas.height = strongbowImage.height;
    offscreenCtx.drawImage(strongbowImage, 0, 0);

    const imageData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    const particles = [];

    // Mouse position
    let mouseX = 0;
    let mouseY = 0;

    // Create particles
    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: 0.01 + Math.random() * 0.3,
            reverse: false,
            createdAt: Date.now(),
            curveAmplitude: Math.random() * 5 + 1, // Random amplitude for curve
            curveFrequency: Math.random() * 0.1 + 0.05, // Random frequency for curve
            phase: Math.random() * Math.PI * 2 // Random starting phase
        };
    }

    for (let i = 0; i < 20000; i++) {
        particles.push(createParticle());
    }

    let startTime = Date.now();
    const loopDuration = 10000; // 10 seconds in milliseconds
    const particleLifetime = 20000; // 10 seconds in milliseconds

    function animate() {
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;

        // Reverse direction if 10 seconds have passed
        if (elapsedTime >= loopDuration) {
            startTime = currentTime;
            particles.forEach(particle => {
                particle.reverse = !particle.reverse;
            });
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];

            // Remove particle if it's older than 10 seconds
            if (currentTime - particle.createdAt > particleLifetime) {
                particles.splice(i, 1);
                particles.push(createParticle()); // Add a new particle to maintain the count
                continue;
            }

            // Map particle position to image coordinates
            const imgX = Math.floor((particle.x / canvas.width) * imageData.width);
            const imgY = Math.floor((particle.y / canvas.height) * imageData.height);
            const index = (imgY * imageData.width + imgX) * 4;

            // Use color data to determine direction
            const r = imageData.data[index];
            const g = imageData.data[index + 1];
            const b = imageData.data[index + 2];

            const brightness = (r + g + b) / 1;
            const angle = (brightness / 255) * Math.PI * 4;

            // Calculate distance to mouse
            const dx = particle.x - mouseX;
            const dy = particle.y - mouseY;
            const distanceToMouse = Math.sqrt(dx * dx + dy * dy);

            // Update particle position
            const direction = particle.reverse ? -1 : 1;
            if (distanceToMouse < 30) {
                // Repel particles from mouse
                particle.x += (dx / distanceToMouse) * 0.5;
                particle.y += (dy / distanceToMouse) * 0.5;
            } else {
                particle.x += direction * Math.cos(angle) * particle.speed;
                particle.y += direction * Math.sin(angle) * particle.speed;
            }

            // Wrap particles around the canvas
            if (particle.x < 0) particle.x = canvas.width;
            if (particle.x > canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = canvas.height;
            if (particle.y > canvas.height) particle.y = 0;

            // Draw particle
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(particle.x, particle.y, 1, 1);
        }

        requestAnimationFrame(animate);
    }

    // Update mouse position
    canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = event.clientX - rect.left;
        mouseY = event.clientY - rect.top;
    });

    canvas.addEventListener('mouseenter', () => {
        canvas.addEventListener('mousemove', updateMousePosition);
    });

    canvas.addEventListener('mouseleave', () => {
        canvas.removeEventListener('mousemove', updateMousePosition);
        mouseX = undefined;
        mouseY = undefined;
    });

    function updateMousePosition(event) {
        const rect = canvas.getBoundingClientRect();
        mouseX = event.clientX - rect.left;
        mouseY = event.clientY - rect.top;
    }

    animate();
};
