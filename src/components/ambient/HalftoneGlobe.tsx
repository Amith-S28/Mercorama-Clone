"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import type { Pass } from "three/examples/jsm/postprocessing/Pass.js";

/* ─── Halftone Post-Processing Shader ──────────────────────────────────────
   Renders a crisp dot-matrix halftone pattern.
   Landmasses produce sharp, bright dots; oceans render delicate micro-dots.
   Mouse hover highlights region in vivid accent color.
──────────────────────────────────────────────────────────────────────────── */
const HalftoneShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2(1, 1) },
    cellSize: { value: 3.0 },
    dotSize: { value: 2.6 },
    mousePos: { value: new THREE.Vector2(0.5, 0.5) },
    mouseRadius: { value: 0.35 },
    accentColor: { value: new THREE.Vector3(1.0, 0.3, 0.0) }, // orange default
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
    uniform vec2 resolution;
    uniform float cellSize;
    uniform float dotSize;
    uniform vec2 mousePos;
    uniform float mouseRadius;
    uniform vec3 accentColor;

    varying vec2 vUv;

    void main() {
      // Snap to high-density grid cell
      vec2 pixelCoord = vUv * resolution;
      vec2 cellCenter = (floor(pixelCoord / cellSize) + 0.5) * cellSize;
      vec2 sampleUV = cellCenter / resolution;

      // Sample rendered globe
      vec4 texColor = texture2D(tDiffuse, sampleUV);

      // Calculate luminance
      float luminance = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));

      // Distance from pixel to cell center
      float dist = distance(pixelCoord, cellCenter);

      // Mouse influence — radial falloff from cursor
      float mouseDist = distance(sampleUV, mousePos);
      float influence = 1.0 - smoothstep(0.0, mouseRadius, mouseDist);

      // Luminance mapping
      float boostedLum = luminance + (influence * 0.45);
      boostedLum = clamp(boostedLum, 0.05, 1.0);

      // Dot radius
      float radius = boostedLum * dotSize;
      float circle = 1.0 - smoothstep(radius - 0.4, radius + 0.4, dist);

      // Color lerp: silver-white -> vivid accent near cursor
      vec3 monoColor = vec3(clamp(luminance * 1.2 + 0.3, 0.3, 1.0));
      vec3 accentTinted = accentColor * (boostedLum * 1.4);
      vec3 dotColor = mix(monoColor, accentTinted, influence * 0.95);

      // Output
      float alpha = circle * step(0.01, texColor.a);
      gl_FragColor = vec4(dotColor * circle, alpha);
    }
  `,
};

/* ─── Globe Mesh — Sharp Vector Earth Map ──────────────────────────────── */
function GlobeMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Generate 2048x1024 crisp vector continent map
  const texture = useMemo(() => {
    const width = 2048;
    const height = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    // Dark ocean background (value = 0.08)
    ctx.fillStyle = "#141414";
    ctx.fillRect(0, 0, width, height);

    // Draw 15-degree Latitude / Longitude Grid Lines
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 1.5;

    for (let i = 1; i < 12; i++) {
      const y = (height / 12) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    for (let j = 0; j < 24; j++) {
      const x = (width / 24) * j;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Helper to convert longitude (-180..180) & latitude (-90..90) to canvas (x, y)
    const mapCoords = (coords: [number, number][]): [number, number][] => {
      return coords.map(([lon, lat]) => [
        ((lon + 180) / 360) * width,
        ((90 - lat) / 180) * height,
      ]);
    };

    const drawPolygon = (coords: [number, number][]) => {
      const pts = mapCoords(coords);
      if (pts.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i][0], pts[i][1]);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    // Sharp Landmass Polygon Definitions
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;

    // North America
    drawPolygon([
      [-168, 65],
      [-140, 70],
      [-120, 75],
      [-80, 74],
      [-60, 60],
      [-65, 45],
      [-75, 35],
      [-80, 25],
      [-90, 16],
      [-105, 20],
      [-120, 34],
      [-125, 48],
      [-140, 60],
      [-160, 58],
    ]);

    // South America
    drawPolygon([
      [-80, 10],
      [-60, 10],
      [-35, -5],
      [-38, -20],
      [-55, -34],
      [-68, -55],
      [-75, -45],
      [-80, -18],
      [-80, 0],
    ]);

    // Europe
    drawPolygon([
      [-10, 36],
      [0, 42],
      [15, 40],
      [30, 42],
      [30, 60],
      [20, 70],
      [5, 60],
      [-5, 50],
    ]);

    // Scandinavia
    drawPolygon([
      [5, 58],
      [15, 56],
      [28, 62],
      [28, 70],
      [15, 70],
      [5, 62],
    ]);

    // Africa
    drawPolygon([
      [-17, 32],
      [10, 37],
      [32, 31],
      [43, 12],
      [51, 11],
      [40, -10],
      [33, -34],
      [18, -34],
      [12, -6],
      [-17, 15],
    ]);

    // Asia & Russia
    drawPolygon([
      [30, 42],
      [45, 30],
      [60, 25],
      [70, 20],
      [80, 10],
      [100, 5],
      [105, 20],
      [120, 25],
      [125, 38],
      [140, 35],
      [145, 50],
      [170, 65],
      [180, 70],
      [140, 75],
      [80, 75],
      [50, 60],
      [38, 55],
    ]);

    // India
    drawPolygon([
      [68, 24],
      [78, 30],
      [88, 22],
      [80, 8],
      [73, 15],
    ]);

    // Australia
    drawPolygon([
      [113, -22],
      [130, -12],
      [142, -12],
      [153, -28],
      [148, -38],
      [138, -35],
      [115, -34],
    ]);

    // Greenland
    drawPolygon([
      [-55, 60],
      [-40, 65],
      [-20, 70],
      [-30, 82],
      [-60, 78],
    ]);

    // Antarctica
    drawPolygon([
      [-180, -70],
      [180, -70],
      [180, -90],
      [-180, -90],
    ]);

    // Islands (UK, Japan, Madagascar, Indonesia)
    const islands: [number, number, number][] = [
      [-4, 54, 18], // UK
      [138, 36, 22], // Japan
      [47, -20, 24], // Madagascar
      [105, -2, 20], // Sumatra
      [115, -4, 22], // Java
      [114, 4, 25], // Borneo
    ];

    islands.forEach(([lon, lat, sizePx]) => {
      const x = ((lon + 180) / 360) * width;
      const y = ((90 - lat) / 180) * height;
      ctx.beginPath();
      ctx.arc(x, y, sizePx, 0, Math.PI * 2);
      ctx.fill();
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    return tex;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Smooth rotation
    meshRef.current.rotation.y += 0.001;

    // Mouse tilt parallax
    const { x, y } = state.pointer;
    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      y * 0.1,
      0.02,
    );
    meshRef.current.rotation.z = THREE.MathUtils.lerp(
      meshRef.current.rotation.z,
      -x * 0.05,
      0.02,
    );
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[2.3, 96, 96]} />
      <meshStandardMaterial
        map={texture}
        emissive="#ffffff"
        emissiveMap={texture}
        emissiveIntensity={0.35}
        roughness={0.4}
        metalness={0.0}
        transparent
        opacity={1.0}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

/* ─── Post-Processing Pipeline ─────────────────────────────────────────── */
function PostProcessing({
  accentColor,
}: {
  accentColor: [number, number, number];
}) {
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);
  const halftonePassRef = useRef<ShaderPass | null>(null);

  useEffect(() => {
    const composer = new EffectComposer(gl);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const halftonePass = new ShaderPass(HalftoneShader);
    composer.addPass(halftonePass as unknown as Pass);

    composerRef.current = composer;
    halftonePassRef.current = halftonePass;

    return () => {
      composer.dispose();
    };
  }, [gl, scene, camera]);

  useEffect(() => {
    if (composerRef.current) {
      composerRef.current.setSize(size.width, size.height);
    }
    if (halftonePassRef.current) {
      halftonePassRef.current.uniforms.resolution.value.set(
        size.width,
        size.height,
      );
      halftonePassRef.current.uniforms.accentColor.value.set(
        accentColor[0],
        accentColor[1],
        accentColor[2],
      );
      const dpr = Math.min(window.devicePixelRatio, 2);
      halftonePassRef.current.uniforms.cellSize.value = 3.0 * dpr;
      halftonePassRef.current.uniforms.dotSize.value = 2.6 * dpr;
    }
  }, [size, accentColor]);

  useFrame((state) => {
    if (!halftonePassRef.current || !composerRef.current) return;

    halftonePassRef.current.uniforms.mousePos.value.set(
      (state.pointer.x + 1) / 2,
      (state.pointer.y + 1) / 2,
    );

    composerRef.current.render();
  }, 1);

  return null;
}

/* ─── Scene Setup ──────────────────────────────────────────────────────── */
function GlobeScene({
  accentColor,
}: {
  accentColor: [number, number, number];
}) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[6, 4, 6]} intensity={1.0} color="#ffffff" />
      <directionalLight
        position={[-6, -4, -6]}
        intensity={0.4}
        color="#ffffff"
      />

      <GlobeMesh />

      <PostProcessing accentColor={accentColor} />
    </>
  );
}

/* ─── Exported Component ───────────────────────────────────────────────── */
interface HalftoneGlobeProps {
  className?: string;
  accentColor?: [number, number, number]; // RGB 0-1
}

export function HalftoneGlobe({
  className = "",
  accentColor = [1.0, 0.3, 0.0], // orange default
}: HalftoneGlobeProps) {
  return (
    <div
      className={className}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1, // Behind app content (z-index 2)
        pointerEvents: "none",
      }}
    >
      <Canvas
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 4.8], fov: 45 }}
        style={{ pointerEvents: "auto" }}
        dpr={[1, 2]}
      >
        <GlobeScene accentColor={accentColor} />
      </Canvas>
    </div>
  );
}
