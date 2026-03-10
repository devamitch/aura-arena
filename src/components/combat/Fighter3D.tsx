// Aura Arena — 3D Fighter (React Three Fiber)
// A humanoid made of primitive Three.js geometries.
// Supports full XYZ movement, 14 pose states, per-zone damage marks,
// hit flash, lethal hit glow, frustration visual degradation.

import type { DamageMap, OpponentPosition3D, OpponentState } from "@/lib/combat/combatEngine";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import {
  BoxGeometry,
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
} from "three";

// three.js declares classes as class+namespace merges, so using them directly
// as generic type params causes TS2709. Use InstanceType<typeof X> instead.
type TGroup = InstanceType<typeof Group>;
type TMesh  = InstanceType<typeof Mesh>;
type TMSM   = InstanceType<typeof MeshStandardMaterial>;
type TColor = InstanceType<typeof Color>;

// ── Skin / outfit palette ────────────────────────────────────────────────────
const SKIN     = new Color(0xc68642);
const SHIRT    = new Color(0x1e3a8a);
const SHORTS   = new Color(0x1e3a8a);
const GLOVE    = new Color(0xcc2200);
const SHOE     = new Color(0x111111);
const HEADGEAR = new Color(0xcc2200);

// ── Joint angle pose definitions ─────────────────────────────────────────────
interface Angles { x: number; y: number; z: number }
interface Pose3D {
  torso:     Angles;
  head:      Angles;
  lShoulder: Angles; lElbow: Angles;
  rShoulder: Angles; rElbow: Angles;
  lHip:      Angles; lKnee:  Angles;
  rHip:      Angles; rKnee:  Angles;
}

const A0: Angles = { x: 0, y: 0, z: 0 };

const POSES: Record<OpponentState, Pose3D> = {
  idle: {
    torso:     { x:  0.05, y: 0, z: 0 },
    head:      A0,
    lShoulder: { x:  0.1,  y: 0,    z: -0.4 },
    lElbow:    { x:  0,    y: 0,    z:  0.9 },
    rShoulder: { x:  0.1,  y: 0,    z:  0.4 },
    rElbow:    { x:  0,    y: 0,    z: -0.9 },
    lHip:      { x:  0.1,  y: 0,    z: -0.1 },
    lKnee:     { x: -0.2,  y: 0,    z:  0 },
    rHip:      { x:  0.1,  y: 0,    z:  0.1 },
    rKnee:     { x: -0.2,  y: 0,    z:  0 },
  },
  bob: {
    torso:     { x:  0.08, y: 0, z: 0 },
    head:      A0,
    lShoulder: { x:  0.15, y: 0.05, z: -0.45 },
    lElbow:    { x:  0,    y: 0,    z:  0.85 },
    rShoulder: { x:  0.15, y:-0.05, z:  0.45 },
    rElbow:    { x:  0,    y: 0,    z: -0.85 },
    lHip:      { x:  0.15, y: 0,    z: -0.12 },
    lKnee:     { x: -0.25, y: 0,    z:  0 },
    rHip:      { x:  0.15, y: 0,    z:  0.12 },
    rKnee:     { x: -0.25, y: 0,    z:  0 },
  },
  advance: {
    torso:     { x:  0.15, y: 0, z: 0 },
    head:      { x: -0.1,  y: 0, z: 0 },
    lShoulder: { x:  0.3,  y: 0,    z: -0.3 },
    lElbow:    { x:  0,    y: 0,    z:  0.7 },
    rShoulder: { x:  0.3,  y: 0,    z:  0.3 },
    rElbow:    { x:  0,    y: 0,    z: -0.7 },
    lHip:      { x:  0.3,  y: 0,    z: -0.1 },
    lKnee:     { x: -0.4,  y: 0,    z:  0 },
    rHip:      { x:  0.3,  y: 0,    z:  0.1 },
    rKnee:     { x: -0.4,  y: 0,    z:  0 },
  },
  retreat: {
    torso:     { x: -0.1,  y: 0, z: 0 },
    head:      { x:  0.05, y: 0, z: 0 },
    lShoulder: { x:  0.0,  y: 0,    z: -0.5 },
    lElbow:    { x:  0,    y: 0,    z:  1.0 },
    rShoulder: { x:  0.0,  y: 0,    z:  0.5 },
    rElbow:    { x:  0,    y: 0,    z: -1.0 },
    lHip:      { x: -0.1,  y: 0,    z: -0.1 },
    lKnee:     { x: -0.1,  y: 0,    z:  0 },
    rHip:      { x: -0.1,  y: 0,    z:  0.1 },
    rKnee:     { x: -0.1,  y: 0,    z:  0 },
  },
  jab: {
    torso:     { x:  0.1, y: -0.2, z: 0 },
    head:      { x:  0,   y: -0.1, z: 0 },
    lShoulder: { x:  0.0, y:  0.3, z: -0.2 },
    lElbow:    { x:  0,   y:  0,   z:  0.05 },
    rShoulder: { x:  0.1, y:  0,   z:  0.5 },
    rElbow:    { x:  0,   y:  0,   z: -0.9 },
    lHip:      { x:  0.1, y: 0,    z: -0.1 },
    lKnee:     { x: -0.2, y: 0,    z:  0 },
    rHip:      { x:  0.1, y: 0,    z:  0.1 },
    rKnee:     { x: -0.2, y: 0,    z:  0 },
  },
  cross: {
    torso:     { x:  0.1, y:  0.25, z: 0 },
    head:      { x:  0,   y:  0.1,  z: 0 },
    lShoulder: { x:  0.1, y:  0,    z: -0.5 },
    lElbow:    { x:  0,   y:  0,    z:  0.9 },
    rShoulder: { x:  0.0, y: -0.3,  z:  0.2 },
    rElbow:    { x:  0,   y:  0,    z: -0.05 },
    lHip:      { x:  0.1, y:  0,    z: -0.1 },
    lKnee:     { x: -0.2, y:  0,    z:  0 },
    rHip:      { x:  0.1, y:  0,    z:  0.1 },
    rKnee:     { x: -0.2, y:  0,    z:  0 },
  },
  hook_l: {
    torso:     { x:  0.05, y: -0.3, z: 0 },
    head:      { x:  0,    y: -0.2, z: 0 },
    lShoulder: { x:  0.3,  y:  0.4, z:  0.3 },
    lElbow:    { x:  0,    y:  0,   z:  1.2 },
    rShoulder: { x:  0.1,  y:  0,   z:  0.5 },
    rElbow:    { x:  0,    y:  0,   z: -0.9 },
    lHip:      { x:  0.1,  y:  0,   z: -0.1 },
    lKnee:     { x: -0.2,  y:  0,   z:  0 },
    rHip:      { x:  0.1,  y:  0,   z:  0.1 },
    rKnee:     { x: -0.2,  y:  0,   z:  0 },
  },
  hook_r: {
    torso:     { x:  0.05, y:  0.3, z: 0 },
    head:      { x:  0,    y:  0.2, z: 0 },
    lShoulder: { x:  0.1,  y:  0,   z: -0.5 },
    lElbow:    { x:  0,    y:  0,   z:  0.9 },
    rShoulder: { x:  0.3,  y: -0.4, z: -0.3 },
    rElbow:    { x:  0,    y:  0,   z: -1.2 },
    lHip:      { x:  0.1,  y:  0,   z: -0.1 },
    lKnee:     { x: -0.2,  y:  0,   z:  0 },
    rHip:      { x:  0.1,  y:  0,   z:  0.1 },
    rKnee:     { x: -0.2,  y:  0,   z:  0 },
  },
  uppercut: {
    torso:     { x:  0.2, y: -0.15, z: 0 },
    head:      { x: -0.2, y: -0.1,  z: 0 },
    lShoulder: { x: -0.3, y:  0.2,  z: -0.2 },
    lElbow:    { x:  1.2, y:  0,    z:  0.6 },
    rShoulder: { x:  0.1, y:  0,    z:  0.5 },
    rElbow:    { x:  0,   y:  0,    z: -0.9 },
    lHip:      { x:  0.3, y:  0,    z: -0.15 },
    lKnee:     { x: -0.4, y:  0,    z:  0 },
    rHip:      { x:  0.1, y:  0,    z:  0.1 },
    rKnee:     { x: -0.2, y:  0,    z:  0 },
  },
  roundhouse: {
    torso:     { x:  0.05, y:  0.5, z: 0 },
    head:      { x:  0,    y:  0.3, z: 0 },
    lShoulder: { x:  0.1,  y:  0,   z: -0.4 },
    lElbow:    { x:  0,    y:  0,   z:  0.9 },
    rShoulder: { x:  0.2,  y:  0,   z:  0.4 },
    rElbow:    { x:  0,    y:  0,   z: -0.8 },
    lHip:      { x:  0.1,  y:  0,   z: -0.1 },
    lKnee:     { x: -0.1,  y:  0,   z:  0 },
    rHip:      { x: -0.5,  y:  0.6, z:  1.3 },
    rKnee:     { x: -0.8,  y:  0,   z:  0 },
  },
  front_kick: {
    torso:     { x: -0.05, y: 0, z: 0 },
    head:      { x:  0,    y: 0, z: 0 },
    lShoulder: { x:  0.1,  y: 0, z: -0.4 },
    lElbow:    { x:  0,    y: 0, z:  0.9 },
    rShoulder: { x:  0.1,  y: 0, z:  0.4 },
    rElbow:    { x:  0,    y: 0, z: -0.9 },
    lHip:      { x: -0.8,  y: 0, z: -0.1 },
    lKnee:     { x: -1.0,  y: 0, z:  0 },
    rHip:      { x:  0.1,  y: 0, z:  0.1 },
    rKnee:     { x: -0.2,  y: 0, z:  0 },
  },
  block_high: {
    torso:     { x:  0.1,  y: 0, z: 0 },
    head:      { x:  0.15, y: 0, z: 0 },
    lShoulder: { x: -0.4,  y: 0, z:  0.05 },
    lElbow:    { x:  0,    y: 0, z:  1.4 },
    rShoulder: { x: -0.4,  y: 0, z: -0.05 },
    rElbow:    { x:  0,    y: 0, z: -1.4 },
    lHip:      { x:  0.1,  y: 0, z: -0.1 },
    lKnee:     { x: -0.2,  y: 0, z:  0 },
    rHip:      { x:  0.1,  y: 0, z:  0.1 },
    rKnee:     { x: -0.2,  y: 0, z:  0 },
  },
  block_body: {
    torso:     { x:  0.2,  y: 0, z: 0 },
    head:      { x:  0.1,  y: 0, z: 0 },
    lShoulder: { x:  0.1,  y: 0, z: -0.1 },
    lElbow:    { x:  0,    y: 0, z:  1.1 },
    rShoulder: { x:  0.1,  y: 0, z:  0.1 },
    rElbow:    { x:  0,    y: 0, z: -1.1 },
    lHip:      { x:  0.2,  y: 0, z: -0.1 },
    lKnee:     { x: -0.3,  y: 0, z:  0 },
    rHip:      { x:  0.2,  y: 0, z:  0.1 },
    rKnee:     { x: -0.3,  y: 0, z:  0 },
  },
  dodge_l: {
    torso:     { x:  0.05, y: 0, z:  0.15 },
    head:      { x:  0,    y: 0, z:  0.15 },
    lShoulder: { x:  0.1,  y: 0, z: -0.4 },
    lElbow:    { x:  0,    y: 0, z:  0.9 },
    rShoulder: { x:  0.1,  y: 0, z:  0.4 },
    rElbow:    { x:  0,    y: 0, z: -0.9 },
    lHip:      { x:  0.2,  y: 0, z: -0.3 },
    lKnee:     { x: -0.4,  y: 0, z:  0 },
    rHip:      { x:  0.1,  y: 0, z:  0.1 },
    rKnee:     { x: -0.2,  y: 0, z:  0 },
  },
  dodge_r: {
    torso:     { x:  0.05, y: 0, z: -0.15 },
    head:      { x:  0,    y: 0, z: -0.15 },
    lShoulder: { x:  0.1,  y: 0, z: -0.4 },
    lElbow:    { x:  0,    y: 0, z:  0.9 },
    rShoulder: { x:  0.1,  y: 0, z:  0.4 },
    rElbow:    { x:  0,    y: 0, z: -0.9 },
    lHip:      { x:  0.1,  y: 0, z: -0.1 },
    lKnee:     { x: -0.2,  y: 0, z:  0 },
    rHip:      { x:  0.2,  y: 0, z:  0.3 },
    rKnee:     { x: -0.4,  y: 0, z:  0 },
  },
  duck: {
    torso:     { x:  0.5,  y: 0, z: 0 },
    head:      { x:  0.3,  y: 0, z: 0 },
    lShoulder: { x:  0.2,  y: 0, z: -0.3 },
    lElbow:    { x:  0,    y: 0, z:  0.9 },
    rShoulder: { x:  0.2,  y: 0, z:  0.3 },
    rElbow:    { x:  0,    y: 0, z: -0.9 },
    lHip:      { x:  0.6,  y: 0, z: -0.15 },
    lKnee:     { x: -0.8,  y: 0, z:  0 },
    rHip:      { x:  0.6,  y: 0, z:  0.15 },
    rKnee:     { x: -0.8,  y: 0, z:  0 },
  },
  hurt: {
    torso:     { x: -0.2,  y:  0.1, z: 0 },
    head:      { x: -0.3,  y:  0.2, z: 0 },
    lShoulder: { x:  0.0,  y:  0,   z: -0.3 },
    lElbow:    { x:  0,    y:  0,   z:  0.6 },
    rShoulder: { x:  0.0,  y:  0,   z:  0.3 },
    rElbow:    { x:  0,    y:  0,   z: -0.6 },
    lHip:      { x: -0.1,  y:  0,   z: -0.1 },
    lKnee:     { x: -0.1,  y:  0,   z:  0 },
    rHip:      { x: -0.1,  y:  0,   z:  0.1 },
    rKnee:     { x: -0.1,  y:  0,   z:  0 },
  },
  stagger: {
    torso:     { x: -0.4,  y:  0.3,  z: 0 },
    head:      { x: -0.5,  y:  0.35, z: 0 },
    lShoulder: { x: -0.3,  y:  0.2,  z: -0.1 },
    lElbow:    { x:  0,    y:  0,    z:  0.4 },
    rShoulder: { x: -0.3,  y: -0.2,  z:  0.1 },
    rElbow:    { x:  0,    y:  0,    z: -0.4 },
    lHip:      { x: -0.3,  y:  0.1,  z: -0.2 },
    lKnee:     { x:  0.1,  y:  0,    z:  0 },
    rHip:      { x: -0.3,  y: -0.1,  z:  0.2 },
    rKnee:     { x:  0.1,  y:  0,    z:  0 },
  },
  ko: {
    torso:     { x: -1.4,  y:  0,    z: 0 },
    head:      { x: -1.6,  y:  0,    z: 0 },
    lShoulder: { x:  0.0,  y:  0,    z: -0.3 },
    lElbow:    { x:  0,    y:  0,    z:  0.3 },
    rShoulder: { x:  0.0,  y:  0,    z:  0.3 },
    rElbow:    { x:  0,    y:  0,    z: -0.3 },
    lHip:      { x: -0.8,  y:  0.2,  z: -0.3 },
    lKnee:     { x:  0.6,  y:  0,    z:  0 },
    rHip:      { x: -0.8,  y: -0.2,  z:  0.3 },
    rKnee:     { x:  0.6,  y:  0,    z:  0 },
  },
};

// ── Lerp helpers ─────────────────────────────────────────────────────────────
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpA = (a: Angles, b: Angles, t: number): Angles => ({
  x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t),
});

// ── Material factory ─────────────────────────────────────────────────────────
function mat(color: TColor, roughness = 0.6, metalness = 0.05) {
  return new MeshStandardMaterial({ color: color.clone(), roughness, metalness });
}

// Damage zone → body part index mapping
const ZONE_PART: Record<string, string> = {
  head: "head", chin: "head", left_face: "head", right_face: "head",
  solar_plexus: "torso", body_left: "torso", body_right: "torso",
  left_arm: "lArm", right_arm: "rArm",
  left_leg: "lLeg", right_leg: "rLeg",
};

// ── React component ───────────────────────────────────────────────────────────
interface Fighter3DProps {
  state: OpponentState;
  position: OpponentPosition3D;
  damageMap: DamageMap;
  hitFlash: boolean;
  frustration: 0 | 1 | 2 | 3;
}

export function Fighter3D({ state, position, damageMap, hitFlash, frustration }: Fighter3DProps) {
  // ── Joint refs ──
  const rootRef   = useRef<TGroup>(null);
  const hipsRef   = useRef<TGroup>(null);
  const torsoRef  = useRef<TGroup>(null);
  const headRef   = useRef<TGroup>(null);
  const lShldrRef = useRef<TGroup>(null);
  const lElbRef   = useRef<TGroup>(null);
  const rShldrRef = useRef<TGroup>(null);
  const rElbRef   = useRef<TGroup>(null);
  const lHipRef   = useRef<TGroup>(null);
  const lKneeRef  = useRef<TGroup>(null);
  const rHipRef   = useRef<TGroup>(null);
  const rKneeRef  = useRef<TGroup>(null);

  // ── Body part mesh refs (for damage colorization) ──
  const headMeshRef  = useRef<TMesh>(null);
  const torsoMeshRef = useRef<TMesh>(null);
  const lArmMeshRef  = useRef<TMesh>(null);
  const rArmMeshRef  = useRef<TMesh>(null);
  const lLegMeshRef  = useRef<TMesh>(null);
  const rLegMeshRef  = useRef<TMesh>(null);

  // ── Current interpolated angles ──
  const curAngles = useRef<Pose3D>(POSES.idle);
  const bobOffset = useRef(0);
  const hitFlashRef = useRef(hitFlash);
  hitFlashRef.current = hitFlash;

  // ── Materials (created once, mutated for damage) ──
  const mats = useRef({
    head:  mat(SKIN),
    torso: mat(SHIRT),
    lArm:  mat(SKIN),
    rArm:  mat(SKIN),
    lLeg:  mat(SKIN),
    rLeg:  mat(SKIN),
    glove: mat(GLOVE, 0.4, 0.2),
    shoe:  mat(SHOE, 0.8, 0.1),
    short: mat(SHORTS),
    gear:  mat(HEADGEAR, 0.4, 0.3),
  });

  useFrame((_, delta) => {
    const target = POSES[state] ?? POSES.idle;
    const t = 1 - Math.pow(0.02, delta);

    const c = curAngles.current;
    c.torso     = lerpA(c.torso,     target.torso,     t);
    c.head      = lerpA(c.head,      target.head,      t);
    c.lShoulder = lerpA(c.lShoulder, target.lShoulder, t);
    c.lElbow    = lerpA(c.lElbow,    target.lElbow,    t);
    c.rShoulder = lerpA(c.rShoulder, target.rShoulder, t);
    c.rElbow    = lerpA(c.rElbow,    target.rElbow,    t);
    c.lHip      = lerpA(c.lHip,      target.lHip,      t);
    c.lKnee     = lerpA(c.lKnee,     target.lKnee,     t);
    c.rHip      = lerpA(c.rHip,      target.rHip,      t);
    c.rKnee     = lerpA(c.rKnee,     target.rKnee,     t);

    const isBob = state === "bob" || state === "idle" || state === "advance";
    bobOffset.current += delta * (isBob ? 3.5 : 0.5);
    const bobY = isBob ? Math.sin(bobOffset.current) * 0.025 : 0;

    if (rootRef.current) {
      rootRef.current.position.set(position.x, position.y + bobY, position.z);
      rootRef.current.rotation.y = Math.PI;
    }

    const apply = (ref: React.RefObject<TGroup | null>, a: Angles) => {
      if (ref.current) ref.current.rotation.set(a.x, a.y, a.z);
    };
    if (torsoRef.current) apply(torsoRef, c.torso);
    if (headRef.current)  apply(headRef,  c.head);
    apply(lShldrRef, c.lShoulder);
    apply(lElbRef,   c.lElbow);
    apply(rShldrRef, c.rShoulder);
    apply(rElbRef,   c.rElbow);
    apply(lHipRef,   c.lHip);
    apply(lKneeRef,  c.lKnee);
    apply(rHipRef,   c.rHip);
    apply(rKneeRef,  c.rKnee);

    // ── Damage colorization ──
    const meshMap: Record<string, TMesh | null> = {
      head:  headMeshRef.current,
      torso: torsoMeshRef.current,
      lArm:  lArmMeshRef.current,
      rArm:  rArmMeshRef.current,
      lLeg:  lLegMeshRef.current,
      rLeg:  rLegMeshRef.current,
    };

    const partDmg: Record<string, number> = {};
    for (const [zone, mark] of Object.entries(damageMap)) {
      const part = ZONE_PART[zone];
      if (part) partDmg[part] = Math.max(partDmg[part] ?? 0, mark.intensity);
    }

    for (const [part, mesh] of Object.entries(meshMap)) {
      if (!mesh) continue;
      const m = mesh.material as TMSM;
      const dmg = partDmg[part] ?? 0;
      if (hitFlashRef.current && dmg > 0) {
        m.emissive.set(0xffffff);
        m.emissiveIntensity = 0.8;
      } else if (dmg > 0) {
        const r = Math.min(1, dmg * 2);
        const g = Math.max(0, 0.5 - dmg);
        const b = Math.max(0, 1 - dmg * 2);
        m.emissive.setRGB(r, g, b);
        m.emissiveIntensity = dmg * 0.65;
      } else {
        m.emissive.set(0x000000);
        m.emissiveIntensity = 0;
      }
    }

    if (frustration >= 2) {
      const fIntensity = (frustration - 1) * 0.12;
      for (const mesh of Object.values(meshMap)) {
        if (!mesh) continue;
        const m = mesh.material as TMSM;
        m.emissiveIntensity = Math.max(m.emissiveIntensity, fIntensity);
        if (m.emissiveIntensity === fIntensity) {
          m.emissive.setRGB(0.8, 0.1, 0.1);
        }
      }
    }
  });

  // ── Geometries (created once) ─────────────────────────────────────────────
  const geo = useRef({
    head:      new SphereGeometry(0.17, 18, 14),
    neck:      new CylinderGeometry(0.07, 0.09, 0.14, 10),
    torso:     new BoxGeometry(0.42, 0.50, 0.22),
    shorts:    new BoxGeometry(0.40, 0.20, 0.20),
    upperArm:  new CapsuleGeometry(0.065, 0.26, 6, 10),
    lowerArm:  new CapsuleGeometry(0.055, 0.22, 6, 10),
    fist:      new SphereGeometry(0.095, 14, 10),
    thigh:     new CapsuleGeometry(0.085, 0.32, 6, 10),
    shin:      new CapsuleGeometry(0.07, 0.28, 6, 10),
    foot:      new BoxGeometry(0.13, 0.07, 0.25),
    headgear:  new TorusGeometry(0.175, 0.04, 8, 20, Math.PI * 1.6),
  });

  useEffect(() => {
    return () => {
      Object.values(geo.current).forEach((g) => g.dispose());
      Object.values(mats.current).forEach((m) => m.dispose());
    };
  }, []);

  const m = mats.current;
  const g = geo.current;

  // suppress unused ref warning for hipsRef (structural, no direct rotation)
  void hipsRef;

  return (
    <group ref={rootRef}>
      <group ref={hipsRef}>

        {/* ── Torso ── */}
        <group ref={torsoRef} position={[0, 0.35, 0]}>
          <mesh ref={torsoMeshRef} geometry={g.torso} material={m.torso} position={[0, 0.1, 0]} />
          <mesh geometry={g.shorts} material={m.short} position={[0, -0.18, 0]} />

          {/* ── Head ── */}
          <group ref={headRef} position={[0, 0.42, 0]}>
            <mesh geometry={g.neck} material={m.head} position={[0, -0.08, 0]} />
            <mesh ref={headMeshRef} geometry={g.head} material={m.head} />
            <mesh geometry={g.headgear} material={m.gear}
              position={[0, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]} />
          </group>

          {/* ── Left arm ── */}
          <group ref={lShldrRef} position={[-0.23, 0.28, 0]}>
            <mesh ref={lArmMeshRef} geometry={g.upperArm} material={m.lArm} position={[0, -0.15, 0]} />
            <group ref={lElbRef} position={[0, -0.32, 0]}>
              <mesh geometry={g.lowerArm} material={m.lArm} position={[0, -0.13, 0]} />
              <mesh geometry={g.fist} material={m.glove} position={[0, -0.28, 0]} />
            </group>
          </group>

          {/* ── Right arm ── */}
          <group ref={rShldrRef} position={[0.23, 0.28, 0]}>
            <mesh ref={rArmMeshRef} geometry={g.upperArm} material={m.rArm} position={[0, -0.15, 0]} />
            <group ref={rElbRef} position={[0, -0.32, 0]}>
              <mesh geometry={g.lowerArm} material={m.rArm} position={[0, -0.13, 0]} />
              <mesh geometry={g.fist} material={m.glove} position={[0, -0.28, 0]} />
            </group>
          </group>
        </group>

        {/* ── Left leg ── */}
        <group ref={lHipRef} position={[-0.13, 0, 0]}>
          <mesh ref={lLegMeshRef} geometry={g.thigh} material={m.lLeg} position={[0, -0.20, 0]} />
          <group ref={lKneeRef} position={[0, -0.42, 0]}>
            <mesh geometry={g.shin} material={m.lLeg} position={[0, -0.17, 0]} />
            <mesh geometry={g.foot} material={m.shoe} position={[0, -0.38, 0.06]} />
          </group>
        </group>

        {/* ── Right leg ── */}
        <group ref={rHipRef} position={[0.13, 0, 0]}>
          <mesh ref={rLegMeshRef} geometry={g.thigh} material={m.rLeg} position={[0, -0.20, 0]} />
          <group ref={rKneeRef} position={[0, -0.42, 0]}>
            <mesh geometry={g.shin} material={m.rLeg} position={[0, -0.17, 0]} />
            <mesh geometry={g.foot} material={m.shoe} position={[0, -0.38, 0.06]} />
          </group>
        </group>

      </group>
    </group>
  );
}
