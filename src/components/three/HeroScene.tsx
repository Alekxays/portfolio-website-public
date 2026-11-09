"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useTheme } from "@/components/ThemeProvider";

function DisplacementGrid({
  color,
  mobile,
}: {
  color: string;
  mobile: boolean;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();
  const pointer = useRef(new THREE.Vector2(0, 0));
  const target = useRef(new THREE.Vector2(0, 0));
  const scroll = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: mobile ? 0.28 : 0.38 },
    }),
    [color, mobile],
  );

  useEffect(() => {
    uniforms.uColor.value.set(color);
  }, [color, uniforms]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      target.current.set(x, y);
    };
    const onScroll = () => {
      scroll.current = Math.min(window.scrollY / window.innerHeight, 1.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useFrame((_, delta) => {
    if (!mesh.current || !material.current) return;
    pointer.current.lerp(target.current, 1 - Math.exp(-delta * 4));
    uniforms.uTime.value += delta;
    uniforms.uPointer.value.copy(pointer.current);
    uniforms.uScroll.value +=
      (scroll.current - uniforms.uScroll.value) * (1 - Math.exp(-delta * 3));
    mesh.current.rotation.x = -0.42 + uniforms.uScroll.value * 0.12;
    mesh.current.rotation.z = pointer.current.x * 0.08;
    mesh.current.position.y = -0.15 - uniforms.uScroll.value * 0.25;
  });

  const segs = mobile ? 28 : 48;
  const width = Math.max(viewport.width * 1.35, 8);
  const height = Math.max(viewport.height * 1.1, 6);

  return (
    <mesh ref={mesh} rotation={[-0.42, 0, 0]} position={[0, -0.15, 0]}>
      <planeGeometry args={[width, height, segs, segs]} />
      <shaderMaterial
        ref={material}
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          uniform float uTime;
          uniform vec2 uPointer;
          uniform float uScroll;
          varying float vElev;
          varying vec2 vUv;

          void main() {
            vUv = uv;
            vec3 pos = position;
            float dist = distance(uv, uPointer * 0.5 + 0.5);
            float ripple = sin(dist * 18.0 - uTime * 1.6) * exp(-dist * 3.2);
            float wave = sin((uv.x + uv.y) * 6.0 + uTime * 0.7) * 0.08;
            float elev = ripple * 0.55 + wave + uScroll * 0.12 * (1.0 - uv.y);
            pos.z += elev;
            vElev = elev;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          uniform float uOpacity;
          varying float vElev;
          varying vec2 vUv;

          void main() {
            float gridX = abs(fract(vUv.x * 36.0) - 0.5);
            float gridY = abs(fract(vUv.y * 24.0) - 0.5);
            float line = 1.0 - smoothstep(0.0, 0.04, min(gridX, gridY));
            float fade = smoothstep(0.0, 0.18, vUv.y) * (1.0 - smoothstep(0.75, 1.0, vUv.y));
            float elevGlow = smoothstep(0.0, 0.35, abs(vElev));
            float alpha = line * fade * (uOpacity + elevGlow * 0.18);
            if (alpha < 0.01) discard;
            gl_FragColor = vec4(uColor, alpha);
          }
        `}
      />
    </mesh>
  );
}

function SceneContent({ mobile }: { mobile: boolean }) {
  const { theme } = useTheme();
  const color = theme === "dark" ? "#f5f5f5" : "#111111";

  return (
    <>
      <ambientLight intensity={0.4} />
      <DisplacementGrid color={color} mobile={mobile} />
    </>
  );
}

export function HeroScene() {
  const [enabled, setEnabled] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [visible, setVisible] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const mq = window.matchMedia("(max-width: 768px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);

    const idle = window.setTimeout(() => setEnabled(true), 80);
    return () => {
      window.clearTimeout(idle);
      mq.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!enabled) {
    return <div ref={wrapRef} className="absolute inset-0 -z-10" aria-hidden />;
  }

  return (
    <div ref={wrapRef} className="absolute inset-0 -z-10" aria-hidden>
      <Canvas
        dpr={mobile ? [1, 1.25] : [1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0.2, 4.2], fov: 42, near: 0.1, far: 40 }}
        frameloop={visible ? "always" : "never"}
        style={{ width: "100%", height: "100%" }}
      >
        <SceneContent mobile={mobile} />
      </Canvas>
    </div>
  );
}
