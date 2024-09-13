const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const svg = document.getElementById('logo');
const container = document.getElementById('container');

let particles = [];
let isMouseDown = false;
let isDragging = false;
let mouse = { x: 0, y: 0 };

function initCanvas() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;

    drawSVGToCanvas();
}

function drawSVGToCanvas() {
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = function () {
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;

        ctx.drawImage(
            img,
            (canvas.width - imgWidth) / 2,
            (canvas.height - imgHeight) / 2,
            imgWidth,
            imgHeight
        );
        URL.revokeObjectURL(url);
        createParticles();
        svg.style.display = 'none'; // Hide the SVG after rendering
        animate();
    };

    img.src = url;
}

function createParticles() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const data = imageData.data;
    const particleSize = 2;
    for (let y = 0; y < canvas.height; y += 2) {
        for (let x = 0; x < canvas.width; x += 2) {
            const index = (y * canvas.width + x) * 4;
            const alpha = data[index + 3];
            if (alpha > 0) {
                particles.push({
                    x: x,
                    y: y,
                    originalX: x,
                    originalY: y,
                    vx: 0,
                    vy: 0,
                    size: particleSize,
                    color: `rgba(${data[index]}, ${data[index + 1]}, ${data[index + 2]}, ${alpha / 255})`
                });
            }
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle) => {
        if (isDragging) {
            // Interaction logic: Pull particles towards the mouse
            const dx = mouse.x - particle.x;
            const dy = mouse.y - particle.y;
            const distSquared = dx * dx + dy * dy;
            const interactionRadius = 100 * 100; // Adjust the radius as needed
            if (distSquared < interactionRadius) {
                const force = (interactionRadius - distSquared) / interactionRadius;
                const acceleration = force * 0.2; // Adjust this value for effect strength
                particle.vx += dx * acceleration;
                particle.vy += dy * acceleration;
            }
        } else {
            // Move particles back to original position
            const dx = particle.originalX - particle.x;
            const dy = particle.originalY - particle.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0.5) {
                // Apply a spring force toward the original position
                particle.vx += dx * 0.1;
                particle.vy += dy * 0.1;

                // Apply friction to create smooth movement
                particle.vx *= 0.9;
                particle.vy *= 0.9;
            } else {
                // Snap particle back to original position if close enough
                particle.x = particle.originalX;
                particle.y = particle.originalY;
                particle.vx = 0;
                particle.vy = 0;
            }
        }

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Draw particle
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    });
}

canvas.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    isDragging = true; // Start dragging immediately
    updateMousePosition(e);
});

canvas.addEventListener('mousemove', (e) => {
    if (isMouseDown) {
        isDragging = true;
        updateMousePosition(e);
    }
});

canvas.addEventListener('mouseup', () => {
    isMouseDown = false;
    isDragging = false;
});

canvas.addEventListener('mouseleave', () => {
    isMouseDown = false;
    isDragging = false;
});

function updateMousePosition(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
}

window.addEventListener('resize', () => {
    // Handle window resize
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    particles = [];
    svg.style.display = 'block';
    initCanvas();
});

window.onload = initCanvas;
