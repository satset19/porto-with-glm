// Vertex Shader for Wireframe Glow Effect
// Prepares data for glowing edges and vertex-based animation

uniform float uTime;
uniform float uScrollProgress;

varying vec3 vPosition;
varying vec3 vNormal;
varying float vIntensity;
varying vec2 vUv;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;

    // Calculate intensity based on position and time
    float distanceFromCenter = length(position);
    vIntensity = sin(distanceFromCenter * 2.0 - uTime * 3.0) * 0.5 + 0.5;

    // Add scroll-based animation
    float scrollWave = sin(position.y * 3.0 + uScrollProgress * 10.0) * 0.5 + 0.5;
    vIntensity *= (0.5 + scrollWave * 0.5);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
