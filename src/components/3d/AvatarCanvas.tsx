import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { AvatarModel } from "./AvatarModel";

export function AvatarCanvas() {
  return (
    <div className="w-full h-full relative" style={{ minHeight: "60vh" }}>
      <Canvas
        camera={{ position: [0, 1.2, 2.5], fov: 40 }}
        shadows
        gl={{ alpha: true, antialias: true }}
      >
        <color attach="background" args={["#040914"]} />
        <fog attach="fog" args={["#040914", 5, 10]} />

        <ambientLight intensity={0.4} />
        <directionalLight
          position={[2, 5, 2]}
          intensity={1.5}
          castShadow
          shadow-mapSize={1024}
        />
        <spotLight
          position={[-2, 2, 2]}
          intensity={2}
          angle={0.5}
          penumbra={1}
          color="#00f0ff"
        />

        <Suspense fallback={null}>
          {/* We position the avatar and scale it appropriately */}
          <group position={[0, -0.9, 0]}>
            <AvatarModel />
            <ContactShadows
              resolution={512}
              scale={2}
              blur={2}
              opacity={0.6}
              far={1.5}
              color="#00f0ff"
            />
          </group>
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={1}
          maxDistance={4}
          target={[0, 1.2, 0]}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
        />
        <Environment preset="city" />
      </Canvas>

      {/* Fallback Loader Overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10">
        <div className="w-8 h-8 rounded-full border-t-2 border-[var(--ac)] animate-spin" />
      </div>
    </div>
  );
}
