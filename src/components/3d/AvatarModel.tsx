import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { MODELS } from "@utils/assets";
import * as THREE from "three";

export function AvatarModel({ url = MODELS.XBOT }: { url?: string }) {
  // Load the standard GLTF model directly
  const { scene } = useGLTF(url);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Simple floating animation for generic GLB
    scene.position.y = -1 + Math.sin(t * 2) * 0.05;

    // Face the mouse slightly
    const targetX = (state.pointer.x * Math.PI) / 16;
    scene.rotation.y = THREE.MathUtils.lerp(scene.rotation.y, targetX, 0.1);
  });

  return <primitive object={scene} />;
}
