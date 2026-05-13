# Interview Session State Machine

## State Diagram

```
                    ┌──────────────────────────────────────────────────┐
                    │                    FINISH (global)               │
                    ▼                                                  │
┌──────┐  MEDIA_READY  ┌───────┐  START  ┌──────────┐  QUESTION_ARRIVED  ┌─────────────┐
│ idle │──────────────▶│ ready │────────▶│ starting │���─────────────────▶│ tts_playing │
└──────┘               └───────┘         └──────────┘                   └──────┬──────┘
    │                                                                          │
    │  RESUME                                                          TTS_DONE│
    └──────────────────────────────────────────────────────────────────────┐    │
                                                                          │    │
                                                              ┌───────────┴────┴──────────────┐
                                                              │         isRealMode?            │
                                                              ├───────────────┬────────────────┤
                                                              │ true          │ false          │
                                                              ▼               ▼                │
                                                        ┌───────────┐  ┌────────────────┐     │
                                                        │ countdown │  │ awaiting_start │     │
                                                        └─────┬─────┘  └───────┬────────┘     │
                                                  COUNTDOWN   │  PRACTICE      │               │
                                                  _TICK(→0)   │  _START        │               │
                                                              ▼                ▼               │
                                                        ┌──────────┐                          │
                                                        │ speaking │                          │
                                                        └────┬─────┘                          │
                                                     SUBMIT  │                                │
                                                             ▼                                │
                                                      ┌────────────┐  ANSWER_ACCEPTED         │
                                                      │ submitting │──────────────────────────┘
                                                      └─────┬──────┘
                                                    FINISH  │
                                                            ▼
                                                      ┌──────────┐
                                                      │ finished │
                                                      └──────────┘
```

## States

| Phase | Description | Entry Side Effects |
|---|---|---|
| `idle` | Page mounted, waiting for session data + media device access | None |
| `ready` | Media ready, session loaded — Start button enabled | None |
| `starting` | `startInterview` API call in-flight | `startVideoAnalysis()`, `resetWarnings()` |
| `tts_playing` | Question audio playing via TTS + avatar speaking | `resetText()`, `avatarSpeak(question)`, `playTtsText(question)` |
| `countdown` | Real mode only — random 5-30s countdown before auto-start | Timer: 1s interval dispatching `COUNTDOWN_TICK` |
| `awaiting_start` | Practice mode only — waiting for user to click "말하기 시작" | None |
| `speaking` | STT listening + video recording active | `startStt()`, `startRecording(turnId)` |
| `submitting` | Answer submitted to backend, awaiting response | `stopStt()`, `stopRecording()` (called in handler before dispatch) |
| `finished` | Interview complete, navigating to results | `stopStt()`, `stopRecording()`, `destroyTts()`, `cleanupMedia()`, `stopVideoAnalysis()`, then `navigate("/interview/results")` after 1.5s |
| `error` | Unrecoverable error occurred | None |

## Events

| Event | Payload | Accepted In | Transitions To |
|---|---|---|---|
| `MEDIA_READY` | — | `idle` | `ready` |
| `RESUME` | `turnId`, `question` | `idle` | `tts_playing` |
| `START` | — | `ready` | `starting` |
| `QUESTION_ARRIVED` | `turnId`, `question` | `starting` | `tts_playing` |
| `TTS_DONE` | — | `tts_playing` | `countdown` (real) / `awaiting_start` (practice) |
| `COUNTDOWN_TICK` | — | `countdown` | `countdown` (decrement) / `speaking` (when 0) |
| `PRACTICE_START` | — | `awaiting_start` | `speaking` |
| `SUBMIT` | — | `speaking` | `submitting` |
| `ANSWER_ACCEPTED` | `nextTurnId`, `nextQuestion` | `submitting` | `tts_playing` |
| `FINISH` | ��� | **any** (global) | `finished` |
| `ERROR` | `message` | **any** (global) | `error` |
| `SET_REAL_MODE` | `isRealMode` | **any** (global) | same phase (context update) |

## Context (MachineState)

```typescript
interface MachineState {
  phase: MachinePhase;
  isRealMode: boolean;      // real → countdown after TTS, practice → awaiting_start
  turnId: number | null;    // current question turn ID
  question: string | null;  // current question text
  countdown: number | null; // countdown remaining seconds (real mode only)
  error: string | null;     // error message
}
```

## Two Interview Modes

The state machine handles **followup** (꼬리질문형) and **full_process** (전체프로세스형) identically at the flow level. The branching happens inside the Zustand store's `submitInterviewAnswer` action:

- **followup**: Backend generates follow-up questions based on the answer. Response includes `turns[]` and `followupExhausted` flag.
- **full_process**: Backend returns the next pre-generated question, or signals completion.

Both paths result in either `ANSWER_ACCEPTED` (next question) or `FINISH` (interview done). The machine reads the store state after `submitInterviewAnswer` completes to decide which event to dispatch.

## Session Resume (Page Refresh)

When the user refreshes the page mid-interview:

1. `loadInterviewSession` loads session data, finds the first unanswered turn, sets `interviewPhase: "listening"`
2. `setupMedia()` initializes camera/mic
3. When both `mediaReady` and `storePhase === "listening"` become true, the machine dispatches `RESUME`
4. `RESUME` transitions `idle → tts_playing`, replaying the current question's TTS

## File Structure

```
pages/interview-session/
├── model/
│   ├── machine.ts        # Pure reducer + types (no side effects)
│   └── DESIGN.md         # This file
├── hooks/
│   ├── useInterviewMachine.ts  # Hook: useReducer + side effects + handlers
│   ├── useMediaSetup.ts        # Camera/mic/STT (imperative API)
│   ├── useVideoAnalysis.ts     # Face detection (imperative API)
│   ├── usePermissionMonitor.ts # Permission polling
│   └── useScreenSize.ts        # Responsive check
└── ui/
    ├── InterviewSessionPage.tsx  # Page: wires machine + hooks + UI
    ├── SessionActionPanel.tsx    # Action buttons: derives mode from machine phase
    └── ...
```

## Architecture Rationale

**Why `useReducer` over xstate**: No new dependency. The state machine is simple enough (10 states, 12 events) that a switch-case reducer with TypeScript discrimination is clear and testable. xstate would add value for parallel states or history nodes, neither of which apply here.

**Why side effects in the hook, not the reducer**: React's `useReducer` must be pure. Side effects (TTS playback, STT start/stop, recording, navigation) are triggered by `useEffect` hooks keyed on `[state.phase, state.turnId]` in `useInterviewMachine`. Each effect maps to a state machine entry action.

**Why the Zustand store is kept**: The store manages server-side data (session metadata, turns, API calls). The state machine manages client-side flow (when to play TTS, when to record, UI state). They interact via: machine reads store state after async actions, store changes can trigger machine events via `useEffect` watchers.
