import { uiElements } from './domUtils.js';

export function renderDot(x, y, color, id) {
    const dotElement = document.createElement('div');
    dotElement.classList.add('dot');
    dotElement.classList.add('dot-appear'); // For animation
    dotElement.id = id;
    dotElement.style.backgroundColor = color;

    if (!uiElements.coordinatePlane) {
        console.error('Coordinate plane element not found for rendering dot.');
        return null;
    }

    // Get coordinate plane dimensions in pixels
    const planeWidth = uiElements.coordinatePlane.clientWidth;
    const planeHeight = uiElements.coordinatePlane.clientHeight;

    if (planeWidth === 0 || planeHeight === 0) {
        console.warn('Coordinate plane has zero dimensions. Dot rendering might be off.');
        // Potentially defer rendering or add to a queue if this is a common issue on init
    }

    // Convert relative coordinates to absolute pixels
    const xPixels = x * planeWidth;
    const yPixels = y * planeHeight;

    dotElement.style.left = `${xPixels}px`;
    dotElement.style.top = `${yPixels}px`;
    uiElements.coordinatePlane.appendChild(dotElement);
    return dotElement;
}

export function clearDots() {
    if (!uiElements.coordinatePlane) return;
    const existingDots = uiElements.coordinatePlane.querySelectorAll('.dot');
    existingDots.forEach(dot => dot.remove());
}

export function clearDistanceLine() {
    if (!uiElements.coordinatePlane) return;
    const existingLine = uiElements.coordinatePlane.querySelector('.distance-line');
    if (existingLine) {
        existingLine.remove();
    }
}

export function clearProblemGraphics() {
    clearDots();
    clearDistanceLine();
}

export function renderDistanceLine(p1, p2, isCorrectGuess) {
    if (!uiElements.coordinatePlane) {
        console.error('Coordinate plane element not found for rendering line.');
        return;
    }

    const lineElement = document.createElement('div');
    lineElement.classList.add('distance-line');

    const planeWidth = uiElements.coordinatePlane.clientWidth;
    const planeHeight = uiElements.coordinatePlane.clientHeight;

    if (planeWidth === 0 || planeHeight === 0) {
        console.warn('Coordinate plane has zero dimensions. Line rendering might be off.');
    }

    const x1 = p1.x * planeWidth;
    const y1 = p1.y * planeHeight;
    const x2 = p2.x * planeWidth;
    const y2 = p2.y * planeHeight;

    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    lineElement.style.width = `${length}px`;
    lineElement.style.position = 'absolute';
    lineElement.style.left = `${x1}px`;
    lineElement.style.top = `${y1}px`;
    lineElement.style.transformOrigin = '0 50%';
    lineElement.style.transform = `translateY(-1.5px) rotate(${angle}deg)`; // Adjust for line thickness

    if (isCorrectGuess) {
        lineElement.style.backgroundColor = 'rgba(76, 175, 80, 0.7)'; // Greenish
        lineElement.classList.add('line-correct-animation');
    } else {
        lineElement.style.backgroundColor = 'rgba(255, 152, 0, 0.7)'; // Orangeish
        lineElement.classList.add('line-incorrect-animation');
    }
    lineElement.style.height = '3px'; // Line thickness

    uiElements.coordinatePlane.appendChild(lineElement);
}
