// Fragment Shader for Holographic Material
// Creates holographic transparency, fresnel glow, and color shifting

uniform float uTime;
uniform float uHover;
uniform vec3 uColor1;     // Electric Blue
uniform vec3 uColor2;     // Vaporwave Pink
uniform float uOpacity;
uniform float uFresnelPower;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying float vDisplacement;
varying vec3 vViewPosition;

// Fresnel calculation
float fresnel(vec3 normal, vec3 viewDir) {
    return pow(1.0 - abs(dot(normal, normalize(viewDir))), uFresnelPower);
}

void main() {
    // Calculate fresnel effect
    vec3 viewDir = normalize(vViewPosition);
    float fresnelValue = fresnel(vNormal, viewDir);

    // Mix colors based on displacement and time
    float colorMix = sin(vDisplacement * 3.0 + uTime) * 0.5 + 0.5;
    vec3 baseColor = mix(uColor1, uColor2, colorMix);

    // Add fresnel glow
    vec3 glowColor = baseColor * fresnelValue * 2.0;

    // Holographic transparency gradient
    float alpha = uOpacity * (0.3 + fresnelValue * 0.7);

    // Add scanline effect
    float scanline = sin(vUv.y * 100.0 + uTime * 5.0) * 0.1;
    alpha += scanline * fresnelValue;

    // Edge glow effect
    float edge = 1.0 - abs(dot(vNormal, viewDir));
    vec3 edgeColor = baseColor * pow(edge, 3.0);

    // Combine all effects
    vec3 finalColor = glowColor + edgeColor;

    // Add hover effect - increase brightness
    finalColor += baseColor * uHover * 0.3;
    alpha += uHover * 0.2;

    gl_FragColor = vec4(finalColor, clamp(alpha, 0.0, 1.0));
}
