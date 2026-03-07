// Aura Arena — Scoring Worker Hook (frame scoring + pose correctness + session)
import { useCallback, useEffect, useRef, useState } from 'react';
import { WorkerBridge } from '@/lib/workerBridge';
import { bus } from '@/lib/eventBus';
import type { FrameScore } from '@/types';
import type { PoseCorrectness } from '@/lib/poseCorrectness';
import { zeroScore } from '@/lib/score/session';

export interface ScoringState {
  frameReady:       boolean;
  correctnessReady: boolean;
  sessionReady:     boolean;
}

export function useScoringWorker(discipline: string, _subDiscipline?: string): ScoringState & {
  scoreFrame:          (payload: Record<string, unknown>) => void;
  checkForm:           (landmarks: unknown[], discipline: string, subDiscipline?: string) => void;
  getSessionSummary:   () => Promise<unknown>;
  addFrame:            (frameScore: FrameScore) => void;
  resetSession:        () => void;
  lastScore:           React.MutableRefObject<FrameScore>;
  lastCorrectness:     React.MutableRefObject<PoseCorrectness>;
} {
  const [state, setState] = useState<ScoringState>({ frameReady: false, correctnessReady: false, sessionReady: false });
  const frameRef       = useRef<WorkerBridge | null>(null);
  const correctRef     = useRef<WorkerBridge | null>(null);
  const sessionRef     = useRef<WorkerBridge | null>(null);
  const summaryResolve = useRef<((v: unknown) => void) | null>(null);
  const lastScore       = useRef<FrameScore>(zeroScore());
  const lastCorrectness = useRef<PoseCorrectness>({ isCorrect: true, score: 100, feedback: [], jointAngles: [], exercise: 'idle' });

  useEffect(() => {
    setState({ frameReady: false, correctnessReady: false, sessionReady: false });

    frameRef.current = new WorkerBridge(
      new URL('../workers/scoring/frame.worker.ts', import.meta.url),
      { onMessage: (e) => {
          const m = e.data as Record<string,unknown>;
          if (m['type']==='READY') setState(s=>({...s,frameReady:true}));
          else if (m['type']==='FRAME_SCORED') { lastScore.current = m['frameScore'] as FrameScore; bus.emit('frame:scored', m as Parameters<typeof bus.emit<'frame:scored'>>[1]); }
        }, onError: ()=>{} },
    );
    frameRef.current.post({ type: 'INIT', discipline });

    correctRef.current = new WorkerBridge(
      new URL('../workers/scoring/correctness.worker.ts', import.meta.url),
      { onMessage: (e) => {
          const m = e.data as Record<string,unknown>;
          if (m['type']==='READY') setState(s=>({...s,correctnessReady:true}));
          else if (m['type']==='FORM_RESULT') { lastCorrectness.current = m['poseCorrectness'] as PoseCorrectness; bus.emit('form:result', { poseCorrectness: m['poseCorrectness'] }); }
        }, onError: ()=>{} },
    );
    correctRef.current.post({ type: 'INIT' });

    sessionRef.current = new WorkerBridge(
      new URL('../workers/scoring/session.worker.ts', import.meta.url),
      { onMessage: (e) => {
          const m = e.data as Record<string,unknown>;
          if (m['type']==='READY') setState(s=>({...s,sessionReady:true}));
          else if (m['type']==='SUMMARY') { summaryResolve.current?.(m['summary']); summaryResolve.current=null; bus.emit('session:summary',{summary:m['summary']}); }
        }, onError: ()=>{} },
    );
    sessionRef.current.post({ type: 'INIT' });

    return () => {
      frameRef.current?.destroy(); correctRef.current?.destroy(); sessionRef.current?.destroy();
      frameRef.current = correctRef.current = sessionRef.current = null;
    };
  }, [discipline]);

  const scoreFrame   = useCallback((payload: Record<string, unknown>) => frameRef.current?.post({ type: 'SCORE_FRAME', ...payload }), []);
  const checkForm    = useCallback((lms: unknown[], disc: string, sub?: string) => correctRef.current?.post({ type: 'CHECK_FORM', landmarks: lms, discipline: disc, subDiscipline: sub }), []);
  const addFrame     = useCallback((fs: FrameScore) => sessionRef.current?.post({ type: 'ADD_FRAME', frameScore: fs }), []);
  const resetSession = useCallback(() => sessionRef.current?.post({ type: 'RESET' }), []);
  const getSessionSummary = useCallback(() => new Promise<unknown>(resolve => {
    summaryResolve.current = resolve;
    sessionRef.current?.post({ type: 'GET_SUMMARY' });
    setTimeout(() => { if (summaryResolve.current) { summaryResolve.current(null); summaryResolve.current=null; } }, 2000);
  }), []);

  return { ...state, scoreFrame, checkForm, addFrame, resetSession, getSessionSummary, lastScore, lastCorrectness };
}
