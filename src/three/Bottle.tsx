/* ==========================================================================
   The bottle.

   Built procedurally from a lathe profile so every page works today. When the
   supplied GLB arrives, swap the body of <BottleMesh> for a useGLTF call and
   nothing else in the app changes.

   Art direction follows PLAN.md Part 7:
   - asymmetric soft key at 45 degrees for one long vertical specular strip
   - fill one stop down
   - hard rim behind, mandatory on a translucent vessel
   - PET plastic roughness, not glass refraction, because the bottle is plastic
   - tight contact shadow, no depth of field on the hero
   ========================================================================== */

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, PresentationControls } from "@react-three/drei";
import * as THREE from "three";

const THEME_COLOR: Record<string, string> = {
  glow: "#ff836b",
  burn: "#e59c06",
  volume: "#94bd43",
};

/** Squat 60ml shot bottle: wide body, short shoulder, screw neck, white cap. */
function bottleProfile() {
  const p: THREE.Vector2[] = [];
  const add = (x: number, y: number) => p.push(new THREE.Vector2(x, y));
  // The real DASH bottle is squat: the body is nearly as wide as it is tall,
  // with a fast shoulder and a short neck. Measured off product photography.
  add(0, -0.72);
  add(0.68, -0.72);
  add(0.74, -0.66);
  add(0.74, 0.10);      // straight body wall
  add(0.72, 0.24);
  add(0.58, 0.44);      // fast shoulder
  add(0.38, 0.56);
  add(0.31, 0.62);
  add(0.31, 0.76);      // short neck
  return p;
}

function BottleMesh({ theme = "glow" }: { theme?: string }) {
  const group = useRef<THREE.Group>(null);
  const profile = useMemo(bottleProfile, []);
  const color = THEME_COLOR[theme] ?? THEME_COLOR.glow;

  // Liquid sits slightly inside the wall with a headspace, so the meniscus reads.
  const liquidProfile = useMemo(() => {
    const p: THREE.Vector2[] = [];
    p.push(new THREE.Vector2(0, -0.68));
    p.push(new THREE.Vector2(0.69, -0.68));
    p.push(new THREE.Vector2(0.69, 0.04));
    p.push(new THREE.Vector2(0.0, 0.06));
    return p;
  }, []);

  useFrame((state) => {
    if (!group.current) return;
    // A slow idle drift, not a constant-rate spin. A constant spin with no
    // easing and no hold is one of the five cheapness tells.
    const t = state.clock.elapsedTime;
    group.current.rotation.y = Math.sin(t * 0.18) * 0.32;
    group.current.position.y = Math.sin(t * 0.5) * 0.015;
  });

  return (
    <group ref={group}>
      {/* body */}
      <mesh castShadow position={[0, 0, 0]}>
        <latheGeometry args={[profile, 96]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.28}
          metalness={0}
          clearcoat={0.85}
          clearcoatRoughness={0.22}
          sheen={0.2}
        />
      </mesh>

      {/* liquid, a shade deeper so it reads as volume rather than flat colour */}
      <mesh position={[0, 0, 0]}>
        <latheGeometry args={[liquidProfile, 64]} />
        <meshStandardMaterial
          color={new THREE.Color(color).multiplyScalar(0.78)}
          roughness={0.2}
        />
      </mesh>

      {/* cap */}
      <mesh castShadow position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.2, 64]} />
        <meshStandardMaterial color="#f7f5ef" roughness={0.45} />
      </mesh>
      {/* cap knurl ring */}
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.365, 0.365, 0.15, 64, 1, true]} />
        <meshStandardMaterial color="#ece9e0" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* label band, knocked back so the wordmark can sit on it */}
      <mesh position={[0, -0.28, 0]}>
        <cylinderGeometry args={[0.745, 0.745, 0.72, 64, 1, true]} />
        <meshStandardMaterial
          color={new THREE.Color(color).multiplyScalar(1.06)}
          roughness={0.62}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export function BottleScene({
  theme = "glow",
  interactive = true,
  className,
}: {
  theme?: string;
  interactive?: boolean;
  className?: string;
}) {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const content = (
    <>
      {/* Key at 45 degrees, one long vertical specular strip. */}
      <directionalLight position={[3, 4, 3]} intensity={2.2} castShadow />
      {/* Fill, one stop down. */}
      <directionalLight position={[-3, 1.5, 2]} intensity={1.1} />
      {/* Hard rim behind for silhouette separation. */}
      <directionalLight position={[0, 2, -4]} intensity={2.6} />
      <ambientLight intensity={0.35} />

      {/* Inline environment. drei's `preset` fetches an HDR from a CDN, which
          measured 22 to 25 seconds here and blocked the mesh behind the same
          Suspense boundary. Lightformers cost no network and give us direct
          control of the one long vertical specular strip the art direction asks
          for. */}
      <Environment resolution={64} frames={1}>
        {/* the long vertical strip down the bottle wall */}
        <Lightformer
          form="rect"
          intensity={2.4}
          position={[2.4, 0.6, 1.6]}
          rotation-y={-Math.PI / 4}
          scale={[0.6, 4, 1]}
        />
        {/* soft wrap on the shadow side */}
        <Lightformer
          form="rect"
          intensity={0.7}
          position={[-2.6, 0.2, 1.2]}
          rotation-y={Math.PI / 4}
          scale={[2.4, 3, 1]}
        />
        {/* top bounce, keeps the cap from going dead */}
        <Lightformer
          form="circle"
          intensity={1.1}
          position={[0, 3.2, 0]}
          rotation-x={Math.PI / 2}
          scale={3}
        />
      </Environment>

      <BottleMesh theme={theme} />

      {/* Tight contact shadow, short soft cast. Long casts read as spirits. */}
      <ContactShadows
        position={[0, -0.74, 0]}
        opacity={0.42}
        scale={4}
        blur={2.1}
        far={1.6}
        resolution={512}
      />
    </>
  );

  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <Canvas
        camera={{ position: [0, 0.35, 4.4], fov: 32 }}
        // Clamp device pixel ratio. A phone reporting 3 would otherwise render
        // nine times the pixels.
        dpr={[1, 1.5]}
        frameloop={reduced ? "demand" : "always"}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          {interactive && !reduced ? (
            <PresentationControls
              global={false}
              snap
              rotation={[0, 0, 0]}
              polar={[-0.25, 0.25]}
              azimuth={[-0.7, 0.7]}
            >
              {content}
            </PresentationControls>
          ) : (
            content
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
