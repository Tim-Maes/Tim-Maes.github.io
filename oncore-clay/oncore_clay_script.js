// oncore_script.js

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const svg = document.getElementById('logo');
    const ctx = canvas.getContext('2d');
  
    const svgData = new XMLSerializer().serializeToString(svg);
  
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
  
    const img = new Image();
    img.onload = function() {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  
    let isMouseDown = false;
    let lastX, lastY;
  
    canvas.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      [lastX, lastY] = getMousePos(canvas, e);
    });
  
    canvas.addEventListener('mousemove', (e) => {
      if (!isMouseDown) return;
      const [currentX, currentY] = getMousePos(canvas, e);
      smudge(lastX, lastY, currentX, currentY);
      lastX = currentX;
      lastY = currentY;
    });
  
    canvas.addEventListener('mouseup', () => {
      isMouseDown = false;
    });
  
    canvas.addEventListener('mouseleave', () => {
      isMouseDown = false;
    });
  
    function getMousePos(canvas, evt) {
      const rect = canvas.getBoundingClientRect();
      return [
        (evt.clientX - rect.left) * (canvas.width / rect.width),
        (evt.clientY - rect.top) * (canvas.height / rect.height)
      ];
    }
  
    function smudge(x1, y1, x2, y2) {
      const brushSize = 50; 
  
      const dx = x2 - x1;
      const dy = y2 - y1;
  
      const steps = Math.ceil(Math.hypot(dx, dy) / 2);
  
      for (let i = 0; i < steps; i++) {
        const progress = i / steps;
        const x = x1 + dx * progress;
        const y = y1 + dy * progress;
  
        const imageData = ctx.getImageData(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
  
        ctx.putImageData(imageData, x - brushSize / 2 + dx * 0.05, y - brushSize / 2 + dy * 0.05);
      }
    }
  });
  