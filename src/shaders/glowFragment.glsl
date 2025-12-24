// Fragment Shader for Wireframe Glow Effect
// Creates pulsing neon glow with color shift

uniform float uTime;
uniform vec3 uColor1;    // Electric Blue
uniform vec3 uColor2;    // Vaporwave Pink
uniform float uGlowIntensity;

varying vec3 vPosition;
varying vec3 vNormal;
varying float vIntensity;
varying vec2 vUv;

void main() {
    // Create pulsing effect
    float pulse = sin(uTime * 2.0) * 0.3 + 0.7;
    float glow = vIntensity * pulse * uGlowIntensity;

    // Color shift based on position and time
    float colorShift = sin(vPosition.y * 2.0 + uTime) * 0.5 + 0.5;
    vec3 finalColor = mix(uColor1, uColor2, colorShift);

    // Apply glow intensity
    finalColor *= glow;

    // Add white core for hot spots
    finalColor += vec3(1.0) * pow(glow, 3.0) * 0.5;

    gl_FragColor = vec4(finalColor, 1.0);
}
