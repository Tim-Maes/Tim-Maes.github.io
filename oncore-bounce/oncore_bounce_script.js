window.onload = () => {
    const svgs = document.querySelectorAll('.logo');
    const container = document.getElementById('container');
    const progressBar = document.getElementById('progress-bar');
    const startButton = document.getElementById('start-button');
    const timerDisplay = document.getElementById('timer');
    const messageDisplay = document.getElementById('message');

    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    let bounceCount = 0;
    const bounceGoal = 50; 
    let startTime = null;
    let elapsedTime = 0;
    let timerInterval = null;

    let gameState = 'notStarted'; 

    const svgObjects = [];

    svgs.forEach((svg) => {
        const svgRect = svg.getBoundingClientRect();

        const svgWidth = svgRect.width;
        const svgHeight = svgRect.height;

        const radius = svgWidth * 0.4; // Adjust multiplier based on visible area

        let svgX = Math.random() * (containerWidth - svgWidth);
        let svgY = Math.random() * (containerHeight - svgHeight);
        let vx = 0; // Start with zero velocity
        let vy = 0;

        svg.style.left = `${svgX}px`;
        svg.style.top = `${svgY}px`;

        // Add to the array
        svgObjects.push({
            svg,
            svgX,
            svgY,
            vx,
            vy,
            width: svgWidth,
            height: svgHeight,
            radius,
            lastCollision: {},
        });
    });

    timerDisplay.style.display = 'none';
    progressBar.style.width = '0%';

    startButton.addEventListener('click', startGame);

    function startGame() {
        gameState = 'running';

        startButton.style.display = 'none';

        timerDisplay.style.display = 'block';

        bounceCount = 0;
        progressBar.style.width = '0%';

        startTime = Date.now();
        elapsedTime = 0;

        timerInterval = setInterval(updateTimer, 100); // Update every 100ms

        svgObjects.forEach((obj) => {
            obj.vx = (Math.random() - 0.5) * 10;
            obj.vy = (Math.random() - 0.5) * 10;
            obj.lastCollision = {};
        });
    }

    function updateTimer() {
        if (gameState === 'running') {
            elapsedTime = (Date.now() - startTime) / 1000; // In seconds
            timerDisplay.textContent = `Time: ${elapsedTime.toFixed(2)}s`;
        }
    }

    container.addEventListener('mousemove', onMouseMove);

    function onMouseMove(event) {
        if (gameState !== 'running') return; // Ignore mouse movements unless game is running

        const mouseX = event.clientX;
        const mouseY = event.clientY;

        svgObjects.forEach((obj) => {
            const { svgX, svgY, width, height, radius } = obj;

            const svgCenterX = svgX + width / 2;
            const svgCenterY = svgY + height / 2;

            const dx = mouseX - svgCenterX;
            const dy = mouseY - svgCenterY;
            const distance = Math.hypot(dx, dy);

            const threshold = 200;

            if (distance < threshold) {
                const nx = dx / distance;
                const ny = dy / distance;

                const force = (threshold - distance) / threshold;
                const maxForce = 10;

                obj.vx -= nx * force * maxForce;
                obj.vy -= ny * force * maxForce;
            }
        });
    }

    function handleCollisions() {
        if (gameState !== 'running') return; // No collision handling unless game is running

        for (let i = 0; i < svgObjects.length; i++) {
            for (let j = i + 1; j < svgObjects.length; j++) {
                const objA = svgObjects[i];
                const objB = svgObjects[j];

                const dx = (objA.svgX + objA.width / 2) - (objB.svgX + objB.width / 2);
                const dy = (objA.svgY + objA.height / 2) - (objB.svgY + objB.height / 2);
                const distance = Math.hypot(dx, dy);

                const minDist = objA.radius + objB.radius;

                if (distance < minDist) {
                    const nx = dx / distance;
                    const ny = dy / distance;

                    const vxRel = objA.vx - objB.vx;
                    const vyRel = objA.vy - objB.vy;

                    const vnRel = vxRel * nx + vyRel * ny;

                    if (vnRel < 0) {
                        const impulse = (2 * vnRel) / (1 + 1); // masses are equal

                        objA.vx -= impulse * nx;
                        objA.vy -= impulse * ny;
                        objB.vx += impulse * nx;
                        objB.vy += impulse * ny;

                        const currentTime = Date.now();
                        const collisionKey = `${i}-${j}`;
                        const minTimeBetweenCollisions = 100; // milliseconds

                        if (
                            !objA.lastCollision[collisionKey] ||
                            currentTime - objA.lastCollision[collisionKey] > minTimeBetweenCollisions
                        ) {
                            bounceCount++;
                            if (bounceCount > bounceGoal) bounceCount = bounceGoal; // Cap at goal

                            const progressPercentage = (bounceCount / bounceGoal) * 100;
                            progressBar.style.width = `${progressPercentage}%`;

                            if (bounceCount >= bounceGoal) {
                                endGame();
                            }

                            objA.lastCollision[collisionKey] = currentTime;
                            objB.lastCollision[collisionKey] = currentTime;
                        }
                    }

                    const overlap = (minDist - distance) / 2;
                    objA.svgX += nx * overlap;
                    objA.svgY += ny * overlap;
                    objB.svgX -= nx * overlap;
                    objB.svgY -= ny * overlap;
                }
            }
        }
    }

    function endGame() {
        gameState = 'finished';

        clearInterval(timerInterval);

        // Display the final time
        messageDisplay.textContent = `Congratulations!\nYour time: ${elapsedTime.toFixed(2)} seconds`;
        messageDisplay.style.display = 'block';

        svgObjects.forEach((obj) => {
            obj.vx = 0;
            obj.vy = 0;
        });

        setTimeout(() => {
            resetGame();
        }, 5000); // Reset the game after 5 seconds
    }

    function resetGame() {
        messageDisplay.style.display = 'none';

        gameState = 'notStarted';

        bounceCount = 0;
        progressBar.style.width = '0%';

        timerDisplay.style.display = 'none';
        timerDisplay.textContent = 'Time: 0.00s';

        svgObjects.forEach((obj) => {
            obj.svgX = Math.random() * (containerWidth - obj.width);
            obj.svgY = Math.random() * (containerHeight - obj.height);
            obj.vx = 0;
            obj.vy = 0;
            obj.lastCollision = {};

            obj.svg.style.left = `${obj.svgX}px`;
            obj.svg.style.top = `${obj.svgY}px`;
        });

        startButton.style.display = 'block';
    }

    function animate() {
        handleCollisions();

        svgObjects.forEach((obj) => {
            obj.svgX += obj.vx;
            obj.svgY += obj.vy;

            obj.vx *= 0.98;
            obj.vy *= 0.98;

            const leftBound = 0;
            const rightBound = containerWidth;
            const topBound = 0;
            const bottomBound = containerHeight;

            const centerX = obj.svgX + obj.width / 2;
            const centerY = obj.svgY + obj.height / 2;

            if (centerX - obj.radius < leftBound) {
                obj.svgX = leftBound + obj.radius - obj.width / 2;
                obj.vx = -obj.vx;
            } else if (centerX + obj.radius > rightBound) {
                obj.svgX = rightBound - obj.radius - obj.width / 2;
                obj.vx = -obj.vx;
            }

            if (centerY - obj.radius < topBound) {
                obj.svgY = topBound + obj.radius - obj.height / 2;
                obj.vy = -obj.vy;
            } else if (centerY + obj.radius > bottomBound) {
                obj.svgY = bottomBound - obj.radius - obj.height / 2;
                obj.vy = -obj.vy;
            }

            obj.svg.style.left = `${obj.svgX}px`;
            obj.svg.style.top = `${obj.svgY}px`;
        });

        requestAnimationFrame(animate);
    }

    animate();
};
