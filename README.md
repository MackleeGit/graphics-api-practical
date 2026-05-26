# Canvas Graphics Pipeline Demo: Catch the Stars

This project is a 2D interactive web game built entirely using **HTML5 Canvas, CSS, and Vanilla JavaScript** to demonstrate the core concepts of the Computer Graphics Pipeline. 

## Features
- **No External Libraries**: 100% vanilla JavaScript.
- **Multiple Objects**: Player basket, animated stars, and procedural asteroids.
- **Interactive**: Move the basket using the Left and Right arrow keys.
- **Creativity Implementations**:
  - **Dynamic Difficulty**: Object speed increases as you level up.
  - **Real-time Audio**: Uses the Web Audio API to synthesize sound effects dynamically.
  - **Visual Effects**: Glowing shadows, stroke outlines, and layered transparency.

## Graphics Pipeline Stages Documented
The source code (`script.js`) is heavily commented to explicitly map the logic to the three core stages of the graphics pipeline:
1. **Application Stage**: Where objects are defined, user input is handled, and game rules (score, speed, audio) are applied.
2. **Geometry Stage**: Where coordinate transformations (translation, rotation) and collision math occur.
3. **Rasterization Stage**: Where paths are assembled into polygons, pixels are mapped, and visual effects like transparency and colors are rendered.

## How to Run
1. Clone or download this repository.
2. Open `index.html` directly in any modern web browser.
3. Click "Start Game" and play!

## Controls
- `Left Arrow`: Move Left
- `Right Arrow`: Move Right
