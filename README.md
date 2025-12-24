# Neo-Futuristic 3D Portfolio

A cutting-edge personal web portfolio featuring WebGL (Three.js) and advanced animation orchestration (GSAP). This project creates a futuristic, cinematic, and high-performance user experience with Neo-Futurism/Cyberpunk Ethereal aesthetics.

## Features

### Visual Experience
- **Fragmented Data Cube**: 3D model that transforms based on scroll position
- **Custom Shaders**: Holographic material with Fresnel effects, chromatic aberration
- **Post-Processing**: UnrealBloomPass for neon glow effects
- **Particle System**: 5000 particles creating ambient atmosphere

### 3-Stage Scroll Animation
1. **Stage 1 (0-30%)**: Initial View - Solid cube with passive rotation and mouse parallax
2. **Stage 2 (30-70%)**: Fragmentation - Model explodes into 800 floating fragments with project stats
3. **Stage 3 (70-100%)**: Reassembly - Fragments converge into a minimalist logo

### Micro-Animations
- Text glitch/typewriter effects
- 3D button hover effects (z-axis lift with glow)
- Counter animations for stats
- Smooth section transitions

### Performance
- InstancedMesh for efficient rendering (single draw call for 800 fragments)
- Level of Detail (LOD) system
- FPS monitoring with Stats.js
- Optimized shader code

## Tech Stack

```
- Three.js: WebGL 3D rendering
- GSAP + ScrollTrigger: Scroll-based animations
- Lenis: Smooth scrolling
- Vite: Development server and build tool
- Custom GLSL Shaders
```

## Project Structure

```
portfolio-3d/
├── public/
│   └── index.html          # Main HTML file
├── src/
│   ├── css/
│   │   └── style.css       # Neo-Futurism styling
│   ├── js/
│   │   └── main.js         # Main application logic
│   └── shaders/
│       ├── holographicVertex.glsl
│       ├── holographicFragment.glsl
│       ├── glowVertex.glsl
│       └── glowFragment.glsl
├── package.json
├── vite.config.js
└── README.md
```

## Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run serve
```

## Development

The application runs on `http://localhost:3000` by default.

### Configuration

Edit `CONFIG` object in `src/js/main.js` to customize:

```javascript
const CONFIG = {
    colors: {
        electricBlue: new THREE.Color(0x00F0FF),
        vaporwavePink: new THREE.Color(0xFF006E),
        cyberPurple: new THREE.Color(0x8338EC),
        background: new THREE.Color(0x0A0A0F)
    },
    fragments: {
        count: 800,              // Number of fragments
        baseSize: 0.15,          // Base fragment size
        explosionRadius: 4       // Stage 2 explosion radius
    },
    animation: {
        scrollDuration: 1,       // Scrub smoothing (seconds)
        rotationSpeed: 0.001,
        floatAmplitude: 0.2,
        floatFrequency: 0.5
    }
};
```

## Key Components

### SceneManager
Handles Three.js scene, camera, renderer, and post-processing setup.

### FragmentSystem
Manages the InstancedMesh fragments with position calculation and stage-based transformations.

### ParticleSystem
Creates and animates background particle effects.

### ScrollAnimation
Sets up GSAP ScrollTrigger timelines for the 3-stage scroll animation.

### SmoothScroll (Lenis)
Provides smooth, buttery scrolling experience.

### CustomCursor
Interactive cursor with hover effects for links and buttons.

## Color Palette

```
Background:     #0A0A0F (Deep Space Black)
Electric Blue:  #00F0FF (Primary Accent)
Vaporwave Pink: #FF006E (Secondary Accent)
Cyber Purple:   #8338EC (Tertiary Accent)
Text Primary:   #F0F0F0
Text Secondary: #B0B0B0
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Requires WebGL support

## Performance Optimization

- InstancedMesh reduces draw calls to 1 for all fragments
- LOD system adjusts detail based on camera distance
- Frustum and occlusion culling enabled
- Pixel ratio capped at 2 for high-DPI displays
- Stats.js integration for performance monitoring

## License

MIT License - feel free to use this project as inspiration or starting point for your own portfolio.

## Credits

### References
- [Bruno Simon - Three.js Journey](https://threejs-journey.com/)
- [Garden Eight](https://gardeneight.com/) - Floating 3D inspiration
- [Codrops - Scroll-Based Animations](https://tympanus.net/codrops/2022/01/05/crafting-scroll-based-animations-in-three-js/)

### Libraries
- [Three.js](https://threejs.org/)
- [GSAP](https://gsap.com/)
- [Lenis](https://github.com/studio-freight/lenis)
- [Stats.js](https://github.com/mrdoob/stats.js)

## Future Enhancements

- [ ] Add audio reactive elements
- [ ] Implement WebXR for VR support
- [ ] Add more 3D model variations
- [ ] Implement physics-based fragment collisions
- [ ] Add social sharing functionality
- [ ] Create admin panel for content management
