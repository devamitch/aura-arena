import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { ReactNode } from "react";
import { Component, Suspense } from "react";
import { AvatarModel } from "./AvatarModel";

// Error boundary to catch 3D loading failures gracefully
class Canvas3DErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#040914]">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl">
            🤖
          </div>
          <p className="text-sm text-white/40 font-mono">
            3D Avatar unavailable
          </p>
          <p className="text-xs text-white/20">
            Model will load when assets are ready
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AvatarCanvas() {
  return (
    <div className="w-full h-full relative" style={{ minHeight: "60vh" }}>
      <Canvas3DErrorBoundary>
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
      </Canvas3DErrorBoundary>

      {/* Fallback Loader Overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10">
        <div className="w-8 h-8 rounded-full border-t-2 border-[var(--ac)] animate-spin" />
      </div>
    </div>
  );
}
