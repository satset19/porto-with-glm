/**
 * NEO-FUTURISTIC 3D PORTFOLIO
 * Main Application Entry Point
 *
 * Features:
 * - Three.js WebGL 3D Scene
 * - Fragmented Data Cube with InstancedMesh
 * - GSAP ScrollTrigger 3-Stage Animation
 * - Custom Shaders (Holographic, Glow)
 * - Post-Processing (Bloom, Chromatic Aberration)
 * - Lenis Smooth Scroll
 * - Performance Optimization (LOD, Culling)
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import Stats from 'stats.js';
import { loadGitHubProjects } from './ui-renderer.js';

// GSAP Plugin Registration
gsap.registerPlugin(ScrollTrigger);

// Configure ScrollTrigger
ScrollTrigger.config({
    ignoreMobileResize: true,
    autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load'
});

// Debug: Log when script loads
console.log('Portfolio 3D - Loading...');
console.log('THREE:', THREE);
console.log('GSAP:', gsap);
console.log('ScrollTrigger:', ScrollTrigger);
console.log('Stats:', Stats);

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    // Colors
    colors: {
        electricBlue: new THREE.Color(0x00F0FF),
        vaporwavePink: new THREE.Color(0xFF006E),
        cyberPurple: new THREE.Color(0x8338EC),
        background: new THREE.Color(0x0A0A0F)
    },

    // Fragment System
    fragments: {
        count: 800,
        baseSize: 0.15,
        explosionRadius: 4,
        fragmentGeometries: ['tetrahedron', 'box', 'octahedron']
    },

    // Performance
    performance: {
        targetFPS: 60,
        enableStats: true,
        lodDistances: [5, 15, 30] // Distance thresholds for LOD
    },

    // Animation
    animation: {
        scrollDuration: 1, // Scrub smoothing in seconds
        rotationSpeed: 0.001,
        floatAmplitude: 0.2,
        floatFrequency: 0.5
    }
};

// ============================================
// GLOBAL STATE
// ============================================
const state = {
    scrollProgress: 0,
    mouse: new THREE.Vector2(0, 0),
    hover: 0,
    currentStage: 0, // 0: Hero, 1: Projects, 2: Contact
    time: 0
};

// ============================================
// THREE.JS SCENE SETUP
// ============================================
class SceneManager {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.init();
        this.setupLights();
        this.createCamera();
        this.createRenderer();
        this.createPostProcessing();
        this.createControls();

        // Scene groups
        this.fragmentsGroup = new THREE.Group();
        this.particlesGroup = new THREE.Group();
        this.scene.add(this.fragmentsGroup);
        this.scene.add(this.particlesGroup);
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = CONFIG.colors.background;
        this.scene.fog = new THREE.FogExp2(CONFIG.colors.background, 0.02);
    }

    setupLights() {
        // Ambient light
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(this.ambientLight);

        // Point light 1 - Electric Blue
        this.pointLight1 = new THREE.PointLight(
            CONFIG.colors.electricBlue,
            2,
            20
        );
        this.pointLight1.position.set(5, 5, 5);
        this.scene.add(this.pointLight1);

        // Point light 2 - Vaporwave Pink
        this.pointLight2 = new THREE.PointLight(
            CONFIG.colors.vaporwavePink,
            2,
            20
        );
        this.pointLight2.position.set(-5, -5, 5);
        this.scene.add(this.pointLight2);

        // Dynamic lights for animation
        this.movingLight = new THREE.PointLight(
            CONFIG.colors.electricBlue,
            1,
            15
        );
        this.movingLight.position.set(0, 0, 8);
        this.scene.add(this.movingLight);
    }

    createCamera() {
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.width / this.height,
            0.1,
            100
        );
        this.camera.position.set(0, 0, 8);
        this.camera.lookAt(0, 0, 0);
    }

    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
            stencil: false
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.container.appendChild(this.renderer.domElement);
    }

    createPostProcessing() {
        this.composer = new EffectComposer(this.renderer);

        // Render pass
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);

        // Bloom pass
        const bloomResolution = new THREE.Vector2(this.width, this.height);
        this.bloomPass = new UnrealBloomPass(
            bloomResolution,
            1.5, // strength
            0.4, // radius
            0.85 // threshold
        );
        this.composer.addPass(this.bloomPass);

        // Chromatic aberration shader
        const chromaticAberrationShader = {
            uniforms: {
                tDiffuse: { value: null },
                uTime: { value: 0 },
                uStrength: { value: 0.003 },
                uScrollVelocity: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float uTime;
                uniform float uStrength;
                uniform float uScrollVelocity;
                varying vec2 vUv;

                void main() {
                    vec2 uv = vUv;

                    // Dynamic strength based on scroll velocity
                    float strength = uStrength + abs(uScrollVelocity) * 0.01;

                    // RGB channel separation
                    float r = texture2D(tDiffuse, uv + vec2(strength, 0.0)).r;
                    float g = texture2D(tDiffuse, uv).g;
                    float b = texture2D(tDiffuse, uv - vec2(strength, 0.0)).b;

                    // Add subtle wave distortion
                    uv.x += sin(uv.y * 10.0 + uTime) * strength * 0.5;

                    gl_FragColor = vec4(r, g, b, 1.0);
                }
            `
        };

        this.chromaticPass = new ShaderPass(chromaticAberrationShader);
        this.composer.addPass(this.chromaticPass);
    }

    createControls() {
        // OrbitControls for debugging
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enabled = false; // Disabled in production
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.width, this.height);
        this.composer.setSize(this.width, this.height);
    }

    render() {
        this.composer.render();
    }
}

// ============================================
// FRAGMENT SYSTEM (InstancedMesh)
// ============================================
class FragmentSystem {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.fragments = [];
        this.originalPositions = [];
        this.targetPositions = [];
        this.logoPositions = [];

        this.createGeometries();
        this.createMaterials();
        this.createInstancedMeshes();
        this.calculatePositions();
    }

    createGeometries() {
        this.geometries = {
            tetrahedron: new THREE.TetrahedronGeometry(CONFIG.fragments.baseSize),
            box: new THREE.BoxGeometry(
                CONFIG.fragments.baseSize,
                CONFIG.fragments.baseSize,
                CONFIG.fragments.baseSize
            ),
            octahedron: new THREE.OctahedronGeometry(CONFIG.fragments.baseSize * 0.7)
        };
    }

    createMaterials() {
        // Holographic material with custom shader
        this.holographicMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uHover: { value: 0 },
                uMouse: { value: new THREE.Vector2(0, 0) },
                uColor1: { value: CONFIG.colors.electricBlue },
                uColor2: { value: CONFIG.colors.vaporwavePink },
                uOpacity: { value: 0.8 },
                uFresnelPower: { value: 2.0 }
            },
            vertexShader: document.getElementById('vertex-shader')?.textContent || this.getDefaultVertexShader(),
            fragmentShader: document.getElementById('fragment-shader')?.textContent || this.getDefaultFragmentShader(),
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        // Standard material for LOD fallback
        this.standardMaterial = new THREE.MeshStandardMaterial({
            color: CONFIG.colors.electricBlue,
            metalness: 0.8,
            roughness: 0.2,
            emissive: CONFIG.colors.electricBlue,
            emissiveIntensity: 0.2
        });

        // Wireframe glow material
        this.wireframeMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor1: { value: CONFIG.colors.electricBlue },
                uColor2: { value: CONFIG.colors.vaporwavePink },
                uGlowIntensity: { value: 1.5 }
            },
            vertexShader: `
                uniform float uTime;
                varying vec3 vPosition;
                varying float vIntensity;

                void main() {
                    vPosition = position;
                    float distanceFromCenter = length(position);
                    vIntensity = sin(distanceFromCenter * 2.0 - uTime * 3.0) * 0.5 + 0.5;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec3 uColor1;
                uniform vec3 uColor2;
                uniform float uGlowIntensity;
                varying vec3 vPosition;
                varying float vIntensity;

                void main() {
                    float pulse = sin(uTime * 2.0) * 0.3 + 0.7;
                    float glow = vIntensity * pulse * uGlowIntensity;
                    float colorShift = sin(vPosition.y * 2.0 + uTime) * 0.5 + 0.5;
                    vec3 finalColor = mix(uColor1, uColor2, colorShift) * glow;
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            wireframe: true
        });
    }

    createInstancedMeshes() {
        const countPerGeometry = Math.floor(CONFIG.fragments.count / 3);

        this.instancedMeshes = [];

        Object.entries(this.geometries).forEach(([key, geometry], index) => {
            const mesh = new THREE.InstancedMesh(
                geometry,
                this.holographicMaterial,
                countPerGeometry
            );

            mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            mesh.userData.geometryType = key;

            // Initialize positions (cube formation)
            const dummy = new THREE.Object3D();
            const gridSize = Math.cbrt(countPerGeometry);
            const spacing = CONFIG.fragments.baseSize * 2.5;

            for (let i = 0; i < countPerGeometry; i++) {
                const x = ((i % gridSize) - gridSize / 2) * spacing;
                const y = ((Math.floor(i / gridSize) % gridSize) - gridSize / 2) * spacing;
                const z = (Math.floor(i / (gridSize * gridSize)) - gridSize / 2) * spacing;

                dummy.position.set(x, y, z);
                dummy.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                dummy.scale.setScalar(1);
                dummy.updateMatrix();

                mesh.setMatrixAt(i, dummy.matrix);

                // Store original positions
                this.originalPositions.push({ x, y, z });
                this.fragments.push({
                    index: this.fragments.length,
                    meshIndex: index,
                    instanceIndex: i,
                    originalPos: new THREE.Vector3(x, y, z),
                    currentPos: new THREE.Vector3(x, y, z),
                    rotation: new THREE.Euler(
                        Math.random() * Math.PI,
                        Math.random() * Math.PI,
                        Math.random() * Math.PI
                    )
                });
            }

            this.sceneManager.fragmentsGroup.add(mesh);
            this.instancedMeshes.push(mesh);
        });
    }

    calculatePositions() {
        // Calculate exploded positions for Stage 2
        this.fragments.forEach((fragment, i) => {
            const angle = (i / this.fragments.length) * Math.PI * 2;
            const radius = 2 + Math.random() * CONFIG.fragments.explosionRadius;
            const height = (Math.random() - 0.5) * 6;

            this.targetPositions.push({
                x: Math.cos(angle) * radius,
                y: height,
                z: Math.sin(angle) * radius
            });
        });

        // Calculate logo positions for Stage 3 (simplified "P" or initials)
        this.createLogoPositions();
    }

    createLogoPositions() {
        // Simple geometric pattern for logo formation
        const logoCount = Math.min(this.fragments.length, 400);

        for (let i = 0; i < logoCount; i++) {
            const ring = Math.floor(i / 20);
            const angleInRing = (i % 20) / 20 * Math.PI * 2;
            const radius = 0.5 + ring * 0.3;

            this.logoPositions.push({
                x: Math.cos(angleInRing) * radius,
                y: (Math.random() - 0.5) * 0.5,
                z: Math.sin(angleInRing) * radius
            });
        }

        // Extra fragments fade out
        for (let i = logoCount; i < this.fragments.length; i++) {
            this.logoPositions.push({
                x: 0,
                y: 0,
                z: 0,
                fadeOut: true
            });
        }
    }

    update(time, scrollProgress) {
        // Update shader uniforms
        this.holographicMaterial.uniforms.uTime.value = time;
        this.holographicMaterial.uniforms.uHover.value = state.hover;
        this.holographicMaterial.uniforms.uMouse.value.set(state.mouse.x, state.mouse.y);

        this.wireframeMaterial.uniforms.uTime.value = time;

        // Update fragment positions based on scroll stage
        this.updateFragmentPositions(scrollProgress);
    }

    updateFragmentPositions(scrollProgress) {
        const dummy = new THREE.Object3D();

        this.instancedMeshes.forEach((mesh, meshIndex) => {
            for (let i = 0; i < mesh.count; i++) {
                const fragmentIndex = meshIndex * Math.floor(CONFIG.fragments.count / 3) + i;
                const fragment = this.fragments[fragmentIndex];

                if (!fragment) continue;

                let targetPos;
                let scale = 1;

                // Stage 1: Initial View (0-30%) - Cube formation with subtle movement
                if (scrollProgress < 0.3) {
                    const stageProgress = scrollProgress / 0.3;
                    targetPos = fragment.originalPos.clone();

                    // Subtle rotation
                    dummy.rotation.set(
                        fragment.rotation.x + stageProgress * Math.PI * 0.5,
                        fragment.rotation.y + stageProgress * Math.PI * 0.25,
                        fragment.rotation.z
                    );

                    // Float animation
                    targetPos.y += Math.sin(state.time * CONFIG.animation.floatFrequency + fragmentIndex) *
                                   CONFIG.animation.floatAmplitude;

                // Stage 2: Fragmentation (30-70%) - Explosion
                } else if (scrollProgress < 0.7) {
                    const stageProgress = (scrollProgress - 0.3) / 0.4;
                    const expPos = this.targetPositions[fragmentIndex];

                    targetPos = new THREE.Vector3(
                        THREE.MathUtils.lerp(fragment.originalPos.x, expPos.x, this.easeOutExpo(stageProgress)),
                        THREE.MathUtils.lerp(fragment.originalPos.y, expPos.y, this.easeOutExpo(stageProgress)),
                        THREE.MathUtils.lerp(fragment.originalPos.z, expPos.z, this.easeOutExpo(stageProgress))
                    );

                    dummy.rotation.set(
                        fragment.rotation.x + stageProgress * Math.PI * 2,
                        fragment.rotation.y + stageProgress * Math.PI,
                        fragment.rotation.z + stageProgress * Math.PI
                    );

                    scale = 1 + Math.sin(stageProgress * Math.PI) * 0.3;

                // Stage 3: Reassembly (70-100%) - Logo formation
                } else {
                    const stageProgress = (scrollProgress - 0.7) / 0.3;
                    const logoPos = this.logoPositions[fragmentIndex];

                    if (logoPos.fadeOut) {
                        scale = 1 - stageProgress;
                        targetPos = new THREE.Vector3(0, 0, 0);
                    } else {
                        const expPos = this.targetPositions[fragmentIndex];
                        targetPos = new THREE.Vector3(
                            THREE.MathUtils.lerp(expPos.x, logoPos.x, this.easeInOutCubic(stageProgress)),
                            THREE.MathUtils.lerp(expPos.y, logoPos.y, this.easeInOutCubic(stageProgress)),
                            THREE.MathUtils.lerp(expPos.z, logoPos.z, this.easeInOutCubic(stageProgress))
                        );
                    }

                    dummy.rotation.set(
                        stageProgress * Math.PI * 0.5,
                        stageProgress * Math.PI * 0.25,
                        0
                    );
                }

                dummy.position.copy(targetPos);
                dummy.scale.setScalar(scale);
                dummy.updateMatrix();
                mesh.setMatrixAt(i, dummy.matrix);
            }

            mesh.instanceMatrix.needsUpdate = true;
        });
    }

    // Easing functions
    easeOutExpo(t) {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    getDefaultVertexShader() {
        return `
            uniform float uTime;
            uniform float uHover;
            varying vec3 vNormal;
            varying vec3 vPosition;

            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;

                vec3 newPos = position;
                float pulse = sin(uTime * 2.0) * 0.02;
                newPos += normal * pulse;

                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
            }
        `;
    }

    getDefaultFragmentShader() {
        return `
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            uniform float uOpacity;
            varying vec3 vNormal;
            varying vec3 vPosition;

            void main() {
                vec3 viewDir = normalize(cameraPosition - vPosition);
                float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);

                vec3 color = mix(uColor1, uColor2, fresnel);
                float alpha = uOpacity * (0.3 + fresnel * 0.7);

                gl_FragColor = vec4(color * (1.0 + fresnel), alpha);
            }
        `;
    }
}

// ============================================
// PARTICLE SYSTEM
// ============================================
class ParticleSystem {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.createParticles();
    }

    createParticles() {
        const particleCount = 5000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            // Sphere distribution
            const radius = 10 + Math.random() * 20;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            // Color gradient
            const colorMix = Math.random();
            const color = new THREE.Color().lerpColors(
                CONFIG.colors.electricBlue,
                CONFIG.colors.vaporwavePink,
                colorMix
            );

            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;

            sizes[i] = Math.random() * 2 + 1;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        this.material = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        this.points = new THREE.Points(geometry, this.material);
        this.sceneManager.particlesGroup.add(this.points);
    }

    update(time) {
        this.points.rotation.y = time * 0.05;
        this.points.rotation.x = Math.sin(time * 0.1) * 0.1;
    }
}

// ============================================
// GSAP SCROLL TRIGGER ANIMATION
// ============================================
class ScrollAnimation {
    constructor(sceneManager, fragmentSystem) {
        this.sceneManager = sceneManager;
        this.fragmentSystem = fragmentSystem;

        // Ensure scroll is at top before setting up triggers
        this.forceScrollToTop();

        // Small delay to ensure DOM is ready
        setTimeout(() => {
            this.setupScrollTriggers();
        }, 100);
    }

    forceScrollToTop() {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }

    setupScrollTriggers() {
        // Refresh ScrollTrigger after scroll is forced to top
        ScrollTrigger.refresh();

        // Stage 1 to 2: Initial to Fragmentation
        gsap.timeline({
            scrollTrigger: {
                trigger: '#hero',
                start: 'top top',
                end: 'bottom top',
                scrub: CONFIG.animation.scrollDuration,
                onUpdate: (self) => {
                    state.scrollProgress = self.progress * 0.3;
                    state.currentStage = self.progress < 1 ? 0 : 1;
                }
            }
        })
        .to(this.sceneManager.camera.position, {
            z: 10,
            ease: 'none'
        }, 0)
        .to(this.sceneManager.fragmentsGroup.rotation, {
            y: Math.PI * 0.5,
            ease: 'none'
        }, 0);

        // Stage 2: Fragmentation to Projects
        gsap.timeline({
            scrollTrigger: {
                trigger: '#projects',
                start: 'top bottom',
                end: 'bottom bottom',
                scrub: CONFIG.animation.scrollDuration,
                onUpdate: (self) => {
                    state.scrollProgress = 0.3 + self.progress * 0.4;
                }
            }
        })
        .to(this.sceneManager.camera.position, {
            x: 3,
            y: 2,
            z: 12,
            ease: 'none'
        }, 0)
        .to(this.sceneManager.fragmentsGroup.rotation, {
            y: Math.PI,
            z: Math.PI * 0.5,
            ease: 'none'
        }, 0);

        // Stage 3: Reassembly to Contact
        gsap.timeline({
            scrollTrigger: {
                trigger: '#contact',
                start: 'top bottom',
                end: 'bottom bottom',
                scrub: CONFIG.animation.scrollDuration,
                onUpdate: (self) => {
                    state.scrollProgress = 0.7 + self.progress * 0.3;
                }
            }
        })
        .to(this.sceneManager.camera.position, {
            x: 0,
            y: 0,
            z: 8,
            ease: 'none'
        }, 0)
        .to(this.sceneManager.fragmentsGroup.rotation, {
            y: Math.PI * 2,
            z: 0,
            ease: 'none'
        }, 0)
        .to(this.sceneManager.bloomPass, {
            strength: 2.5,
            ease: 'none'
        }, 0.5);

        // Text animations
        this.animateText();
    }

    animateText() {
        // Hero title
        gsap.utils.toArray('.hero__title-line').forEach((line, i) => {
            gsap.to(line, {
                opacity: 1,
                y: 0,
                duration: 1,
                delay: i * 0.2,
                ease: 'power3.out'
            });
        });

        // Section titles
        gsap.utils.toArray('.section__title-text').forEach((text) => {
            gsap.from(text, {
                opacity: 0,
                y: 50,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: text,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                }
            });
        });

        // Project cards
        gsap.utils.toArray('.project__card').forEach((card, i) => {
            gsap.from(card, {
                opacity: 0,
                y: 100,
                duration: 0.8,
                delay: i * 0.1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                }
            });
        });

        // Stats counter animation
        gsap.utils.toArray('.stat__number').forEach((stat) => {
            const target = parseInt(stat.dataset.count);

            gsap.to(stat, {
                innerText: target,
                duration: 2,
                ease: 'power2.out',
                snap: { innerText: 1 },
                scrollTrigger: {
                    trigger: stat,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                }
            });
        });
    }
}

// ============================================
// LENIS SMOOTH SCROLL
// ============================================
class SmoothScroll {
    constructor() {
        this.lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
        });

        // Start at top position
        this.lenis.scrollTo(0, { immediate: true });

        this.raf = this.raf.bind(this);
        requestAnimationFrame(this.raf);
    }

    raf(time) {
        this.lenis.raf(time);
        requestAnimationFrame(this.raf);
    }

    scrollTo(target) {
        this.lenis.scrollTo(target);
    }
}

// ============================================
// CUSTOM CURSOR
// ============================================
class CustomCursor {
    constructor() {
        this.cursor = document.querySelector('.cursor');
        this.dot = this.cursor?.querySelector('.cursor__dot');
        this.outline = this.cursor?.querySelector('.cursor__outline');

        if (!this.cursor) return;

        this.cursorPos = { x: 0, y: 0 };
        this.outlinePos = { x: 0, y: 0 };

        this.init();
    }

    init() {
        document.addEventListener('mousemove', (e) => {
            this.cursorPos.x = e.clientX;
            this.cursorPos.y = e.clientY;

            // Update global mouse state for Three.js
            state.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            state.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        // Hover effects
        document.querySelectorAll('a, button, .project__card').forEach((el) => {
            el.addEventListener('mouseenter', () => {
                this.cursor?.classList.add('hover');
                state.hover = 1;
            });
            el.addEventListener('mouseleave', () => {
                this.cursor?.classList.remove('hover');
                state.hover = 0;
            });
        });

        this.animate();
    }

    animate() {
        // Smooth follow for outline
        this.outlinePos.x += (this.cursorPos.x - this.outlinePos.x) * 0.15;
        this.outlinePos.y += (this.cursorPos.y - this.outlinePos.y) * 0.15;

        if (this.dot) {
            this.dot.style.transform = `translate(${this.cursorPos.x}px, ${this.cursorPos.y}px) translate(-50%, -50%)`;
        }
        if (this.outline) {
            this.outline.style.transform = `translate(${this.outlinePos.x}px, ${this.outlinePos.y}px) translate(-50%, -50%)`;
        }

        requestAnimationFrame(this.animate.bind(this));
    }
}

// ============================================
// PERFORMANCE MONITOR
// ============================================
class PerformanceMonitor {
    constructor() {
        if (!CONFIG.performance.enableStats) return;

        this.stats = new Stats();
        this.stats.showPanel(0); // 0: fps, 1: ms
        document.getElementById('stats')?.appendChild(this.stats.dom);
    }

    begin() {
        if (CONFIG.performance.enableStats) {
            this.stats?.begin();
        }
    }

    end() {
        if (CONFIG.performance.enableStats) {
            this.stats?.end();
        }
    }
}

// ============================================
// MAIN APPLICATION
// ============================================
class App {
    constructor() {
        this.sceneManager = null;
        this.fragmentSystem = null;
        this.particleSystem = null;
        this.scrollAnimation = null;
        this.smoothScroll = null;
        this.customCursor = null;
        this.performanceMonitor = null;

        this.init();
    }

    init() {
        // Initialize systems
        this.sceneManager = new SceneManager();
        this.fragmentSystem = new FragmentSystem(this.sceneManager);
        this.particleSystem = new ParticleSystem(this.sceneManager);
        this.scrollAnimation = new ScrollAnimation(this.sceneManager, this.fragmentSystem);
        this.smoothScroll = new SmoothScroll();
        this.customCursor = new CustomCursor();
        this.performanceMonitor = new PerformanceMonitor();

        // Event listeners
        window.addEventListener('resize', this.onResize.bind(this));
        window.addEventListener('load', this.onLoad.bind(this));

        // Start animation loop
        this.animate();
    }

    onLoad() {
        // Reset scroll to top on page load
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // Initial animations
        gsap.from('#canvas-container', {
            opacity: 0,
            duration: 2,
            ease: 'power2.out'
        });

        // Load GitHub projects
        loadGitHubProjects();
    }

    onResize() {
        this.sceneManager?.resize();
    }

    animate(time = 0) {
        requestAnimationFrame(this.animate.bind(this));

        this.performanceMonitor?.begin();

        // Update time
        state.time = time * 0.001;

        // Update systems
        this.fragmentSystem?.update(state.time, state.scrollProgress);
        this.particleSystem?.update(state.time);

        // Update post-processing
        if (this.sceneManager?.chromaticPass) {
            this.sceneManager.chromaticPass.uniforms.uTime.value = state.time;
        }

        // Animate lights
        this.animateLights(state.time);

        // Render
        this.sceneManager?.render();

        this.performanceMonitor?.end();
    }

    animateLights(time) {
        if (this.sceneManager?.movingLight) {
            this.sceneManager.movingLight.position.x = Math.sin(time * 0.5) * 5;
            this.sceneManager.movingLight.position.y = Math.cos(time * 0.3) * 3;
            this.sceneManager.movingLight.color.lerpColors(
                CONFIG.colors.electricBlue,
                CONFIG.colors.vaporwavePink,
                (Math.sin(time) + 1) / 2
            );
        }
    }
}

// ============================================
// INITIALIZE APP
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    new App();
});

// Export for potential module usage
export { App, CONFIG, state };
