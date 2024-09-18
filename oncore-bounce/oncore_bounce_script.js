window.onload = () => {
    const svgs = document.querySelectorAll('.logo');
    const container = document.getElementById('container');
    const bounceCounterDisplay = document.getElementById('bounce-counter');

    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    let bounceCount = 0;

    const svgObjects = [];

    svgs.forEach((svg) => {
        const svgRect = svg.getBoundingClientRect();

        const svgWidth = svgRect.width;
        const svgHeight = svgRect.height;

        let svgX = Math.random() * (containerWidth - svgWidth);
        let svgY = Math.random() * (containerHeight - svgHeight);
        let vx = (Math.random() - 0.5) * 10; // Random initial velocity
        let vy = (Math.random() - 0.5) * 10;

        svg.style.left = `${svgX}px`;
        svg.style.top = `${svgY}px`;

        svgObjects.push({
            svg,
            svgX,
            svgY,
            vx,
            vy,
            width: svgWidth,
            height: svgHeight,
            lastCollision: null, // To prevent multiple counts for the same collision
        });
    });

    container.addEventListener('mousemove', onMouseMove);

    function onMouseMove(event) {
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        svgObjects.forEach((obj) => {
            const { svgX, svgY, width, height } = obj;

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
        for (let i = 0; i < svgObjects.length; i++) {
            for (let j = i + 1; j < svgObjects.length; j++) {
                const objA = svgObjects[i];
                const objB = svgObjects[j];

                const dx = (objA.svgX + objA.width / 2) - (objB.svgX + objB.width / 2);
                const dy = (objA.svgY + objA.height / 2) - (objB.svgY + objB.height / 2);
                const distance = Math.hypot(dx, dy);

                const minDist = (objA.width + objB.width) / 2;

                if (distance < minDist) {
                    const nx = dx / distance;
                    const ny = dy / distance;

                    const vxRel = objA.vx - objB.vx;
                    const vyRel = objA.vy - objB.vy;

                    const vnRel = vxRel * nx + vyRel * ny;

                    if (vnRel < 0) {
                        const impulse = (2 * vnRel) / (1 + 1); 

                        objA.vx -= impulse * nx;
                        objA.vy -= impulse * ny;
                        objB.vx += impulse * nx;
                        objB.vy += impulse * ny;

                        // Increment bounce counter if this pair hasn't collided recently
                        const currentTime = Date.now();
                        const collisionKey = `${i}-${j}`;
                        const minTimeBetweenCollisions = 100; 

                        if (
                            !objA.lastCollision ||
                            !objB.lastCollision ||
                            currentTime - objA.lastCollision[collisionKey] > minTimeBetweenCollisions
                        ) {
                            bounceCount++;
                            bounceCounterDisplay.textContent = `Bounces: ${bounceCount}`;

                            objA.lastCollision = objA.lastCollision || {};
                            objB.lastCollision = objB.lastCollision || {};

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

    function animate() {
        handleCollisions();

        svgObjects.forEach((obj) => {
            obj.svgX += obj.vx;
            obj.svgY += obj.vy;

            obj.vx *= 0.98;
            obj.vy *= 0.98;

            if (obj.svgX < 0) {
                obj.svgX = 0;
                obj.vx = -obj.vx;
            } else if (obj.svgX + obj.width > containerWidth) {
                obj.svgX = containerWidth - obj.width;
                obj.vx = -obj.vx;
            }

            if (obj.svgY < 0) {
                obj.svgY = 0;
                obj.vy = -obj.vy;
            } else if (obj.svgY + obj.height > containerHeight) {
                obj.svgY = containerHeight - obj.height;
                obj.vy = -obj.vy;
            }

            obj.svg.style.left = `${obj.svgX}px`;
            obj.svg.style.top = `${obj.svgY}px`;
        });

        requestAnimationFrame(animate);
    }

    animate();
};
