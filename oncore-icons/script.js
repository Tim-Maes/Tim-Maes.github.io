document.addEventListener('DOMContentLoaded', () => {
  const iconContainer = document.getElementById('icon-container');

  const buildGrid = () => {
    // Clear existing icons
    iconContainer.innerHTML = '';

    const iconHTML = `
      <span class="icon">
        <svg xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 2000 2000"
          preserveAspectRatio="xMidYMid meet">
          <g fill="#1b453b" stroke="none">
            <path d="M1256.129,1080.309l137.227,137.227-256.127,256.125-79.106-79.105c-32.075-32.076-84.17-32.076-116.245,0l-79.106,79.105-336.437-336.434,79.103-79.105c32.075-32.076,32.075-84.169,0-116.245l-79.103-79.103,336.437-336.434,79.106,79.105c31.834,32.075,83.687,32.075,116.003.24l79.347-79.345,256.127,256.124-137.227,137.227-198.006-198.002c-32.075-32.075-84.17-32.075-116.245,0l-220.195,220.19c-32.072,32.076-32.072,83.929-.241,116.003l220.678,220.672c32.075,31.593,83.204,31.593,115.282.241l198.728-198.485ZM1000,100c-496.268,0-900,403.738-900,900s403.732,900,900,900,900-403.738,900-900S1496.268,100,1000,100ZM1000,1712.527c-392.898,0-712.525-319.634-712.525-712.527S607.102,287.473,1000,287.473s712.525,319.634,712.525,712.527-319.627,712.527-712.525,712.527Z"/>
          </g>
        </svg>
      </span>
    `;

    // Calculate icons per row and number of rows
    const iconSize = 60; // Adjust this value as needed
    const iconsPerRow = Math.floor(window.innerWidth / iconSize);
    const numberOfRows = Math.floor(window.innerHeight / iconSize);

    // Set grid styles
    iconContainer.style.gridTemplateColumns = `repeat(${iconsPerRow}, 1fr)`;
    iconContainer.style.gridTemplateRows = `repeat(${numberOfRows}, 1fr)`;

    const totalIcons = iconsPerRow * numberOfRows;

    for (let i = 0; i < totalIcons; i++) {
      iconContainer.insertAdjacentHTML('beforeend', iconHTML);
    }

    // Attach event listeners to icons
    document.querySelectorAll('.icon').forEach(icon => {
      let animationFrame;
      let rotation = 0;
      let scale = 1;
      let speed = 0;
      let targetSpeed = 0;
      let targetScale = 1;

      const update = () => {
        // Smoothly adjust speed towards target speed
        speed += (targetSpeed - speed) * 0.1;
        // Update rotation
        rotation = (rotation + speed) % 360;
        // Smoothly adjust scale towards target scale
        scale += (targetScale - scale) * 0.1;

        // Apply transformations
        icon.style.transform = `rotate(${rotation}deg) scale(${scale})`;

        // Continue the animation if needed
        if (Math.abs(speed) > 0.01 || Math.abs(scale - targetScale) > 0.01) {
          animationFrame = requestAnimationFrame(update);
        } else {
          cancelAnimationFrame(animationFrame);
          animationFrame = null;
        }
      };

      icon.addEventListener('mouseover', () => {
        speed = 5;
        targetSpeed = speed;
        scale = 2;
        targetScale = scale;

        rotation = rotation % 360;
        icon.style.transform = `rotate(${rotation}deg) scale(${scale})`;

        icon.style.transitionDuration = '0.08s';

        if (!animationFrame) {
          animationFrame = requestAnimationFrame(update);
        }
      });

      icon.addEventListener('mouseout', () => {
        targetSpeed = 0;
        targetScale = 1;

        icon.style.transitionDuration = '0.1s';

        if (!animationFrame) {
          animationFrame = requestAnimationFrame(update);
        }
      });
    });
  };

  // Build the grid initially
  buildGrid();

  // Rebuild the grid on window resize
  window.addEventListener('resize', buildGrid);
});
