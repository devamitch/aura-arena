// Aura Arena — Frame Scoring Worker (pure CPU scoring, JSON-driven)
import type { DisciplineId } from '@/types';
import { scoreFrame, type ScoreFrameInput } from '@/lib/score/frame';
import { createRhythmState, type RhythmState } from '@/lib/score/rhythm';
import disciplineConfig from '@/data/discipline-config.json';

type Config = Record<string, { bpm: number }>;
const DC = disciplineConfig as Config;

let discipline = 'fitness' as DisciplineId;
let rhythmState: RhythmState | null = null;
const post = (data: unknown) => (self as unknown as Worker).postMessage(data);

self.addEventListener('message', (e: MessageEvent) => {
  const msg = e.data as Record<string, unknown>;

  if (msg['type'] === 'INIT') {
    discipline  = (msg['discipline'] as DisciplineId) ?? 'fitness';
    const bpm   = DC[discipline]?.bpm ?? 90;
    rhythmState = createRhythmState(bpm);
    post({ type: 'READY' });
    return;
  }

  if (msg['type'] === 'SCORE_FRAME') {
    const input: ScoreFrameInput = {
      landmarks:         (msg['landmarks']     as ScoreFrameInput['landmarks'])      ?? [],
      previousLandmarks: (msg['prevLandmarks'] as ScoreFrameInput['previousLandmarks']) ?? [],
      frameWindow:       (msg['frameWindow']   as ScoreFrameInput['frameWindow'])    ?? [],
      discipline:        (msg['discipline']    as DisciplineId)                      ?? discipline,
      subDiscipline:     msg['subDiscipline']  as ScoreFrameInput['subDiscipline'],
      elapsedMs:         (msg['elapsedMs']     as number)                            ?? 0,
      rhythmState:       (msg['rhythmState']   as RhythmState)                       ?? rhythmState ?? createRhythmState(90),
      currentCombo:      (msg['combo']         as number)                            ?? 0,
      lastComboTime:     (msg['lastComboTime'] as number)                            ?? 0,
      gestures:          msg['gestures']       as ScoreFrameInput['gestures'],
    };
    const result = scoreFrame(input);
    rhythmState  = result.updatedRhythmState;
    post({ type: 'FRAME_SCORED', ...result });
    return;
  }

  if (msg['type'] === 'DESTROY') { rhythmState = null; }
});
