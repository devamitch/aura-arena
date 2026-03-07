/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useAvatarConfig } from "@store";
import { MODELS } from "@utils/assets";
import { useEffect, useState } from "react";
import * as THREE from "three";

export function AvatarModel({ url = MODELS.XBOT }: { url?: string }) {
  const config = useAvatarConfig();
  const [modelType, setModelType] = useState<"vrm" | "glb">("glb");
  const [vrm, setVrm] = useState<VRM | null>(null);

  // allow the Zustand state to override the default prop URL
  const modelUrl = (config as any).modelUrl || url;

  // Load the standard GLTF but attach the VRM plugin
  const gltf = useGLTF(modelUrl, true, true, (loader: any) => {
    loader.register((parser: any) => new VRMLoaderPlugin(parser));
  });

  useEffect(() => {
    if (gltf) {
      const gltfAny = gltf as any;
      if (modelUrl.endsWith(".vrm") && gltfAny.userData?.vrm) {
        setModelType("vrm");
        const vrmData = gltfAny.userData.vrm;

        VRMUtils.removeUnnecessaryVertices(gltfAny.scene);
        VRMUtils.removeUnnecessaryJoints(gltfAny.scene);
        vrmData.scene.rotation.y = Math.PI; // Face camera

        applyAvatarConfig(vrmData, config);
        setVrm(vrmData);
      } else {
        setModelType("glb");
        // Center and scale generic GLB models (like Xbot)
        gltfAny.scene.position.set(0, -1, 0);

        // Add minimal rotation/sway manually since there's no VRM humanoid
        setVrm(null);
      }
    }
  }, [gltf, config, modelUrl]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    if (modelType === "vrm" && vrm) {
      // Basic idle animation: breathing / sway
      const chest = vrm.humanoid?.getRawBoneNode("chest");
      if (chest) {
        chest.scale.set(
          1 + Math.sin(t * 2) * 0.02,
          1 + Math.sin(t * 2) * 0.02,
          1 + Math.sin(t * 2) * 0.02,
        );
      }

      // Gentle head lookat mouse
      const head = vrm.humanoid?.getRawBoneNode("head");
      if (head) {
        const targetX = (state.pointer.x * Math.PI) / 8;
        const targetY = (state.pointer.y * Math.PI) / 16;
        head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, -targetX, 0.1);
        head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, targetY, 0.1);
      }

      vrm.update(delta);
    } else if (modelType === "glb" && gltf) {
      // Simple floating animation for generic GLB
      const gltfAny = gltf as any;
      gltfAny.scene.position.y = -1 + Math.sin(t * 2) * 0.05;

      // Face the mouse slightly
      const targetX = (state.pointer.x * Math.PI) / 16;
      gltfAny.scene.rotation.y = THREE.MathUtils.lerp(
        gltfAny.scene.rotation.y,
        targetX,
        0.1,
      );
    }
  });

  if (!gltf) return null;

  const gltfAny = gltf as any;
  return (
    <primitive object={modelType === "vrm" ? vrm?.scene : gltfAny.scene} />
  );
}

// ── Materials Configuration ──
// Manipulate the VRM meshes to apply AI-generated styles
function applyAvatarConfig(vrm: VRM, config: any) {
  vrm.scene.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial;

      if (mat && mat.name) {
        const matName = mat.name.toLowerCase();

        // Skin
        if (
          matName.includes("face") ||
          matName.includes("body") ||
          matName.includes("skin")
        ) {
          mat.color.set(config.skinTone);
        }

        // Hair
        if (matName.includes("hair")) {
          mat.color.set(config.hairColor);
        }

        // Clothes
        if (
          matName.includes("cloth") ||
          matName.includes("top") ||
          matName.includes("bottom")
        ) {
          // If the AI says "Cyberpunk", tint it neon
          if (config.clothingStyle.includes("cyberpunk")) {
            mat.color.set("#00f0ff");
            mat.emissive.set("#00f0ff");
            mat.emissiveIntensity = 0.5;
          } else {
            mat.color.set("#222222"); // Default stealth
            mat.emissiveIntensity = 0;
          }
        }
      }
    }
  });
}
