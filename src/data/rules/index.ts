import bodybuildingRules from "./bodybuilding.json";
import boxingMmaRules from "./boxing-mma.json";
import calisthenicsRules from "./calisthenics.json";
import danceRules from "./dance.json";
import fitnessRules from "./fitness.json";
import gymnasticsRules from "./gymnastics.json";
import martialartsRules from "./martialarts.json";
import wrestlingRules from "./wrestling.json";
import yogaRules from "./yoga.json";

export const POSE_RULES: Record<string, any> = {
  ...boxingMmaRules,
  ...danceRules,
  ...fitnessRules,
  ...gymnasticsRules,
  ...martialartsRules,
  ...yogaRules,
  calisthenics: calisthenicsRules,
  wrestling: wrestlingRules,
  bodybuilding: bodybuildingRules,
};

export function getPoseRules(subDiscipline?: string) {
  if (!subDiscipline || !POSE_RULES[subDiscipline]) {
    return POSE_RULES["boxing"];
  }
  return POSE_RULES[subDiscipline];
}
