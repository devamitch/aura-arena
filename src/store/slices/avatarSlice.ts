import { StateCreator } from "zustand";

export interface AvatarConfig {
  skinTone: string;
  hairColor: string;
  eyeColor: string;
  clothingStyle: string;
  prompt: string;
  modelUrl?: string;
}

export interface AvatarSlice {
  avatarConfig: AvatarConfig;
  setAvatarConfig: (config: Partial<AvatarConfig>) => void;
  resetAvatarConfig: () => void;
}

const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  skinTone: "#ffdfc4",
  hairColor: "#222222",
  eyeColor: "#00f0ff",
  clothingStyle: "cyberpunk",
  prompt: "",
};

export const createAvatarSlice: StateCreator<
  AvatarSlice,
  [["zustand/immer", never]],
  [],
  AvatarSlice
> = (set) => ({
  avatarConfig: { ...DEFAULT_AVATAR_CONFIG },

  setAvatarConfig: (config) =>
    set((state) => {
      state.avatarConfig = { ...state.avatarConfig, ...config };
    }),

  resetAvatarConfig: () =>
    set((state) => {
      state.avatarConfig = { ...DEFAULT_AVATAR_CONFIG };
    }),
});
