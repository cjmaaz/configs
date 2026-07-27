import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LessonCard from './components/LessonCard.jsx';
import TerminalFrame from './components/TerminalFrame.jsx';
import TopicMenu from './components/TopicMenu.jsx';
import {
  activeLessons,
  alternativesFor,
  curriculumStats,
  lessonsForTopics,
  topics,
} from './data/curriculum/index.js';
import {
  buildSession,
  evaluateSequence,
  nextSimulatedMode,
  resolvePressedLesson,
} from './lib/gameEngine.js';
import {
  loadProgress,
  masteryByTopic,
  prioritizedPractice,
  recordAnswer,
  resetProgress,
} from './lib/progress.js';
import { useKeySequence } from './lib/useKeySequence.js';

const activeTopicIds = topics.filter((topic) => !topic.inactive).map((topic) => topic.id);

function modeForLesson(lesson) {
  if (lesson?.mode === 'INSERT') return 'INSERT';
  if (lesson?.mode === 'VISUAL') return 'VISUAL';
  if (lesson?.mode === 'TERMINAL') return 'TERMINAL';
  return 'NORMAL';
}

function trainingTimeout(sequence) {
  // Real Neovim uses timeoutlen=300. The trainer deliberately extends valid
  // leader prefixes indefinitely so learners can read which-key. Escape
  // explicitly cancels an unfinished chord.
  if (sequence.startsWith('<leader>')) return null;
  return 1200;
}

export default function App() {
  const [screen, setScreen] = useState('menu');
  const [gameMode, setGameMode] = useState('learn');
  const [selectedTopics, setSelectedTopics] = useState(activeTopicIds);
  const [session, setSession] = useState([]);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [pressedLesson, setPressedLesson] = useState(null);
  const [hint, setHint] = useState('');
  const [simulatedMode, setSimulatedMode] = useState('NORMAL');
  const [focusZone, setFocusZone] = useState('terminal');
  const [progress, setProgress] = useState(loadProgress);
  const [sessionStats, setSessionStats] = useState({ correct: 0, answered: 0, xpStart: 0 });
  const terminalRef = useRef(null);
  const lessonPanelRef = useRef(null);
  const requeuedRef = useRef(new Set());

  const lesson = session[index];
  const mastery = useMemo(
    () => masteryByTopic(progress, topics, activeLessons),
    [progress],
  );
  const alternatives = useMemo(() => (lesson ? alternativesFor(lesson) : []), [lesson]);

  const finishAnswer = useCallback(
    (evaluation, rawInput) => {
      if (!lesson || result) return;

      if (gameMode === 'learn' && evaluation.status === 'wrong') {
        setHint(`That sequence is not ${lesson.label}. Follow the displayed chord and try again.`);
        resetKeys();
        return;
      }

      const correct = evaluation.status === 'correct';
      const matched = resolvePressedLesson(rawInput, activeLessons, simulatedMode);
      const nextProgress = recordAnswer(progress, lesson, correct);
      setProgress(nextProgress);
      setPressedLesson(matched || null);
      setResult({ ...evaluation, rawInput });
      setHint('');
      setSessionStats((stats) => ({
        ...stats,
        correct: stats.correct + (correct ? 1 : 0),
        answered: stats.answered + 1,
      }));
      if (correct) {
        setSimulatedMode((mode) => nextSimulatedMode(mode, lesson));
      } else if (!requeuedRef.current.has(lesson.id)) {
        requeuedRef.current.add(lesson.id);
        setSession((items) => [...items, lesson]);
      }
      resetKeys();
    },
    // resetKeys is initialized by the hook below before this callback is invoked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameMode, lesson, progress, result, simulatedMode],
  );

  const handleInput = useCallback(
    (sequence) => {
      if (!lesson || result) return;
      const evaluation = evaluateSequence(sequence, lesson, activeLessons);
      if (evaluation.status !== 'pending') {
        finishAnswer(evaluation, sequence);
      } else {
        setHint('');
      }
    },
    [finishAnswer, lesson, result],
  );

  const handleTimeout = useCallback(
    (sequence) => {
      if (!lesson || result || !sequence) return;
      finishAnswer(evaluateSequence(sequence, lesson, activeLessons, { force: true }), sequence);
    },
    [finishAnswer, lesson, result],
  );

  const {
    sequence,
    handleKeyDown,
    reset: resetKeys,
  } = useKeySequence({
    enabled: screen === 'game' && !result,
    timeoutMs: trainingTimeout,
    onInput: handleInput,
    onTimeout: handleTimeout,
  });

  useEffect(() => {
    if (screen === 'game') {
      window.requestAnimationFrame(() => {
        terminalRef.current?.focus();
        setFocusZone('terminal');
      });
    }
  }, [screen, index]);

  useEffect(() => {
    if (screen === 'game' && result && result.status !== 'pending') {
      window.requestAnimationFrame(() => {
        lessonPanelRef.current?.focus();
        setFocusZone('sidebar');
      });
    }
  }, [result, screen]);

  const startGame = (mode) => {
    const pool = lessonsForTopics(selectedTopics);
    const nextSession =
      mode === 'practice'
        ? prioritizedPractice(pool, progress, 12)
        : buildSession(pool, mode, 12);
    if (!nextSession.length) return;

    setGameMode(mode);
    setSession(nextSession);
    setIndex(0);
    setResult(null);
    setPressedLesson(null);
    setHint('');
    setSimulatedMode(modeForLesson(nextSession[0]));
    setSessionStats({ correct: 0, answered: 0, xpStart: progress.xp });
    requeuedRef.current = new Set();
    resetKeys();
    setScreen('game');
  };

  const nextLesson = () => {
    if (index + 1 >= session.length) {
      setScreen('results');
      return;
    }
    const next = session[index + 1];
    setIndex((value) => value + 1);
    setResult(null);
    setPressedLesson(null);
    setHint('');
    setSimulatedMode(modeForLesson(next));
    resetKeys();
  };

  const skipLesson = () => {
    if (gameMode === 'practice' && lesson) {
      const nextProgress = recordAnswer(progress, lesson, false);
      setProgress(nextProgress);
      setSessionStats((stats) => ({ ...stats, answered: stats.answered + 1 }));
    }
    nextLesson();
  };

  const returnToMenu = () => {
    resetKeys();
    setScreen('menu');
    setResult(null);
    setHint('');
  };

  const toggleTopic = (topicId) => {
    setSelectedTopics((current) =>
      current.includes(topicId)
        ? current.filter((id) => id !== topicId)
        : [...current, topicId],
    );
  };

  const clearProgress = () => {
    setProgress(resetProgress());
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">NVIM</span>
          <span>DOJO</span>
        </div>
        <div className="topbar-actions">
          <span className="score-card">Lv {progress.level}</span>
          <span className="score-card">{progress.xp} XP</span>
          {screen !== 'menu' && (
            <button className="button ghost" type="button" onClick={returnToMenu}>
              Exit session
            </button>
          )}
        </div>
      </header>

      <main className="main-content">
        {screen === 'menu' && (
          <>
            <section className="menu-hero">
              <p className="eyebrow">
                {curriculumStats.total} challenges · {curriculumStats.topics} active arenas
              </p>
              <h1>Build muscle memory.</h1>
              <p>
                A keyboard-first terminal simulation of the exact Neovim configuration in
                this repository. Learn with visible chords, then remove the hints and prove
                the mapping from memory.
              </p>
            </section>

            <div className="mode-grid">
              <button className="mode-card" type="button" onClick={() => startGame('learn')}>
                <span className="mode-icon">01</span>
                <h2>Learn mode</h2>
                <p>See the goal and exact chord, replay it, and watch the matching Neovim pane react.</p>
                <span className="cta">Start guided training →</span>
              </button>
              <button className="mode-card" type="button" onClick={() => startGame('practice')}>
                <span className="mode-icon">02</span>
                <h2>Practice mode</h2>
                <p>Receive only the task. Recall the chord, then compare it with nearby mappings and settings.</p>
                <span className="cta">Start blind recall →</span>
              </button>
            </div>

            <TopicMenu
              topics={topics}
              selected={selectedTopics}
              mastery={mastery}
              onToggle={toggleTopic}
              onSelectAll={() =>
                setSelectedTopics((current) =>
                  activeTopicIds.every((topicId) => current.includes(topicId))
                    ? []
                    : activeTopicIds,
                )
              }
            />

            <div style={{ marginTop: 20 }}>
              <button className="button ghost" type="button" onClick={clearProgress}>
                Reset saved progress
              </button>
            </div>
          </>
        )}

        {screen === 'game' && lesson && (
          <>
            {hint && <div className="capture-state error" style={{ marginBottom: 12 }}>{hint}</div>}
            <div className="game-layout">
              <TerminalFrame
                ref={terminalRef}
                lesson={lesson}
                mode={simulatedMode}
                sequence={sequence}
                result={result}
                lessons={activeLessons}
                onKeyDown={handleKeyDown}
                isFocused={focusZone === 'terminal'}
                onFocus={() => setFocusZone('terminal')}
                onBlur={() => setFocusZone('sidebar')}
              />
              <LessonCard
                ref={lessonPanelRef}
                gameMode={gameMode}
                lesson={lesson}
                result={result}
                pressedLesson={pressedLesson}
                alternatives={alternatives}
                sequence={sequence}
                progress={progress}
                index={index}
                total={session.length}
                onNext={nextLesson}
                onSkip={skipLesson}
                onEnter={result ? nextLesson : skipLesson}
                isFocused={focusZone === 'sidebar'}
                onFocus={() => setFocusZone('sidebar')}
              />
            </div>
          </>
        )}

        {screen === 'results' && (
          <section className="panel results-screen">
            <p className="eyebrow">Session complete</p>
            <h1>Training logged.</h1>
            <div className="result-stats">
              <div className="stat">
                <span className="stat-value">{sessionStats.correct}</span>
                correct
              </div>
              <div className="stat">
                <span className="stat-value">{sessionStats.answered}</span>
                answered
              </div>
              <div className="stat">
                <span className="stat-value">{progress.xp - sessionStats.xpStart}</span>
                XP gained
              </div>
            </div>
            <button className="button primary" type="button" onClick={returnToMenu}>
              Return to dojo
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
