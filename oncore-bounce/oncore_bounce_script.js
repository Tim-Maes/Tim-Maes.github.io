window.onload = () => {
    // Get references to the SVG elements and container
    const svgs = document.querySelectorAll('.logo');
    const container = document.getElementById('container');
    const progressBar = document.getElementById('progress-bar');

    // Get container dimensions
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // Variable to keep track of the number of bounces
    let bounceCount = 0;
    const bounceGoal = 100; // Goal for the progress bar

    // Array to hold SVG objects with position and velocity
    const svgObjects = [];

    // Initialize each SVG's position, velocity, and radius
    svgs.forEach((svg) => {
        // Get accurate dimensions
        const svgRect = svg.getBoundingClientRect();

        // Extract dimensions
        const svgWidth = svgRect.width;
        const svgHeight = svgRect.height;

        // Define the effective radius (adjust as needed)
        const radius = svgWidth * 0.4; // Adjust multiplier based on visible area

        // Random initial position within container bounds
        let svgX = Math.random() * (containerWidth - svgWidth);
        let svgY = Math.random() * (containerHeight - svgHeight);
        let vx = (Math.random() - 0.5) * 10; // Random initial velocity
        let vy = (Math.random() - 0.5) * 10;

        // Set the initial position of the SVG
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

    // Add mousemove event listener to the container
    container.addEventListener('mousemove', onMouseMove);

    function onMouseMove(event) {
        // Get mouse coordinates
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        svgObjects.forEach((obj) => {
            const { svgX, svgY, width, height, radius } = obj;

            // Get SVG center coordinates
            const svgCenterX = svgX + width / 2;
            const svgCenterY = svgY + height / 2;

            // Calculate distance between mouse and SVG center
            const dx = mouseX - svgCenterX;
            const dy = mouseY - svgCenterY;
            const distance = Math.hypot(dx, dy);

            // Threshold distance to start moving the SVG
            const threshold = 200;

            if (distance < threshold) {
                // Normalize the direction vector
                const nx = dx / distance;
                const ny = dy / distance;

                // Calculate force
                const force = (threshold - distance) / threshold;
                const maxForce = 10;

                // Update velocity
                obj.vx -= nx * force * maxForce;
                obj.vy -= ny * force * maxForce;
            }
        });
    }

    // Function to detect and handle collisions between SVGs using circle collision detection
    function handleCollisions() {
        for (let i = 0; i < svgObjects.length; i++) {
            for (let j = i + 1; j < svgObjects.length; j++) {
                const objA = svgObjects[i];
                const objB = svgObjects[j];

                const dx = (objA.svgX + objA.width / 2) - (objB.svgX + objB.width / 2);
                const dy = (objA.svgY + objA.height / 2) - (objB.svgY + objB.height / 2);
                const distance = Math.hypot(dx, dy);

                const minDist = objA.radius + objB.radius;

                if (distance < minDist) {
                    // Normalize the collision normal vector
                    const nx = dx / distance;
                    const ny = dy / distance;

                    // Compute the relative velocity
                    const vxRel = objA.vx - objB.vx;
                    const vyRel = objA.vy - objB.vy;

                    // Compute the relative velocity along the normal
                    const vnRel = vxRel * nx + vyRel * ny;

                    // Only proceed if objects are moving towards each other
                    if (vnRel < 0) {
                        // Compute impulse scalar
                        const impulse = (2 * vnRel) / (1 + 1); // masses are equal

                        // Update velocities based on impulse and normal vector
                        objA.vx -= impulse * nx;
                        objA.vy -= impulse * ny;
                        objB.vx += impulse * nx;
                        objB.vy += impulse * ny;

                        // Increment bounce counter if this pair hasn't collided recently
                        const currentTime = Date.now();
                        const collisionKey = `${i}-${j}`;
                        const minTimeBetweenCollisions = 100; // milliseconds

                        if (
                            !objA.lastCollision[collisionKey] ||
                            currentTime - objA.lastCollision[collisionKey] > minTimeBetweenCollisions
                        ) {
                            // Increment the bounce counter
                            bounceCount++;
                            if (bounceCount > bounceGoal) bounceCount = bounceGoal; // Cap at 100

                            // Update the progress bar
                            const progressPercentage = (bounceCount / bounceGoal) * 100;
                            progressBar.style.width = `${progressPercentage}%`;

                            // Update last collision times
                            objA.lastCollision[collisionKey] = currentTime;
                            objB.lastCollision[collisionKey] = currentTime;
                        }
                    }

                    // Separate overlapping objects equally
                    const overlap = (minDist - distance) / 2;
                    objA.svgX += nx * overlap;
                    objA.svgY += ny * overlap;
                    objB.svgX -= nx * overlap;
                    objB.svgY -= ny * overlap;
                }
            }
        }
    }

    // Animation loop to update positions and handle bouncing
    function animate() {
        // Handle collisions between SVGs
        handleCollisions();

        svgObjects.forEach((obj) => {
            // Update position based on velocity
            obj.svgX += obj.vx;
            obj.svgY += obj.vy;

            // Apply friction to slow down over time
            obj.vx *= 0.98;
            obj.vy *= 0.98;

            // Bounce off the edges of the container using circle boundaries
            const leftBound = 0;
            const rightBound = containerWidth;
            const topBound = 0;
            const bottomBound = containerHeight;

            const centerX = obj.svgX + obj.width / 2;
            const centerY = obj.svgY + obj.height / 2;

            // Left and right walls
            if (centerX - obj.radius < leftBound) {
                obj.svgX = leftBound + obj.radius - obj.width / 2;
                obj.vx = -obj.vx;
            } else if (centerX + obj.radius > rightBound) {
                obj.svgX = rightBound - obj.radius - obj.width / 2;
                obj.vx = -obj.vx;
            }

            // Top and bottom walls
            if (centerY - obj.radius < topBound) {
                obj.svgY = topBound + obj.radius - obj.height / 2;
                obj.vy = -obj.vy;
            } else if (centerY + obj.radius > bottomBound) {
                obj.svgY = bottomBound - obj.radius - obj.height / 2;
                obj.vy = -obj.vy;
            }

            // Update the SVG's position
            obj.svg.style.left = `${obj.svgX}px`;
            obj.svg.style.top = `${obj.svgY}px`;
        });

        // Continue the animation loop
        requestAnimationFrame(animate);
    }

    // Start the animation
    animate();
};
