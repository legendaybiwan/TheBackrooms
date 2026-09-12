import React, { useState, useRef, useEffect } from 'react';
import './Room.css';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';

const PALETTE = [
  '#8b5cf6', // Neon Violet
  '#10b981', // Neon Mint
  '#f59e0b', // Amber Glow
  '#f43f5e', // Rose Pink
  '#06b6d4', // Cyan Sky
  '#181c24', // Obsidian Dark
  '#ffffff', // Pure White
  '#facc15'  // Neon Yellow
];

const EMOJI_REACTIONS = ['💜', '☕', '🌿', '🔥', '😭', '🫂', '✨', '🏆'];

export default function RoomView({
  socket,
  roomId,
  userProfile,
  onLeaveRoom,
  theme = 'light',
  onToggleTheme
}) {
  // Room state
  const [roomData, setRoomData] = useState({
    name: 'Virtual Lounge',
    category: 'General',
    selectedGame: 'scribble',
    description: '',
    tags: []
  });
  const [activeUsers, setActiveUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isEphemeral, setIsEphemeral] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [floatingParticles, setFloatingParticles] = useState([]);
  const [isPanicActive, setIsPanicActive] = useState(false);
  const [activeTab, setActiveTab] = useState('game'); // 'game' | 'freedraw'

  // Multi-Game State
  const [gameState, setGameState] = useState({
    type: 'scribble', // 'scribble' | 'trivia' | 'wordchain' | 'emojipop' | 'truthvent'
    isActive: false,
    timeLeft: 30,
    scores: {},
    
    // Scribble
    isDrawer: false,
    word: '',
    maskedWord: '',
    drawer: null,

    // Trivia
    question: '',
    options: [],
    category: '',
    selectedAnswerIdx: null,
    resolvedAnswer: null,

    // Word Chain
    lastWord: 'Campus',
    currentLetter: 'C',
    streakCount: 1,
    wordHistory: ['Campus'],

    // Truth / Vent
    prompt: { type: 'Vent', text: 'What campus rumor drove you crazy recently?' },

    // Emoji Pop
    targets: []
  });

  // Canvas
  const canvasRef = useRef(null);
  const [brushColor, setBrushColor] = useState('#8b5cf6');
  const [brushWidth, setBrushWidth] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const strokeHistoryRef = useRef([]);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket
  useEffect(() => {
    if (!socket) return;

    socket.emit('join_room', { roomId, user: userProfile });

    socket.on('room_joined_data', (data) => {
      setRoomData(data.room);
      setActiveUsers(data.activeUsers || []);
      setMessages(data.recentMessages || []);
      if (data.gameState) {
        setGameState(prev => ({ ...prev, ...data.gameState }));
      }
      if (data.canvasStrokes && data.canvasStrokes.length > 0) {
        setTimeout(() => replayStrokes(data.canvasStrokes), 150);
      }
    });

    socket.on('user_joined', ({ user, activeUsers: usersList }) => {
      setActiveUsers(usersList);
      sounds.playChime();
    });

    socket.on('user_left', ({ user, activeUsers: usersList }) => {
      setActiveUsers(usersList);
    });

    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
      if (msg.sender?.name !== userProfile.name) {
        sounds.playPop();
      }
    });

    socket.on('stroke_received', (stroke) => {
      drawRemoteStroke(stroke);
    });

    socket.on('canvas_cleared', () => {
      clearLocalCanvas();
      sounds.playPop();
    });

    socket.on('user_typing_update', ({ userName, isTyping }) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        if (isTyping) next.add(userName);
        else next.delete(userName);
        return next;
      });
    });

    socket.on('reaction_burst', ({ emoji }) => {
      triggerReactionParticle(emoji);
      sounds.playPop();
    });

    // Multi-Game Sync
    socket.on('game_state_sync', (syncData) => {
      setGameState(prev => ({
        ...prev,
        ...syncData,
        selectedAnswerIdx: null,
        resolvedAnswer: null
      }));
      clearLocalCanvas();
      sounds.playSuccess();
    });

    socket.on('game_timer_tick', ({ timeLeft }) => {
      setGameState(prev => ({ ...prev, timeLeft }));
    });

    socket.on('game_score_update', ({ scores }) => {
      setGameState(prev => ({ ...prev, scores }));
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      sounds.playSuccess();
    });

    socket.on('game_round_ended', ({ word, scores }) => {
      setGameState(prev => ({ ...prev, word, scores: scores || prev.scores }));
    });

    socket.on('game_stopped', () => {
      setGameState(prev => ({ ...prev, isActive: false }));
    });

    // Trivia
    socket.on('trivia_answer_acknowledged', ({ answerIndex }) => {
      setGameState(prev => ({ ...prev, selectedAnswerIdx: answerIndex }));
      sounds.playBoing();
    });

    socket.on('trivia_round_resolved', ({ correctIndex, correctAnswer, winners, scores }) => {
      setGameState(prev => ({
        ...prev,
        resolvedAnswer: { correctIndex, correctAnswer, winners },
        scores
      }));
      if (winners && winners.includes(userProfile.name)) {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
        sounds.playSuccess();
      }
    });

    // Word Chain
    socket.on('word_chain_update', ({ lastWord, currentLetter, streakCount, scores }) => {
      setGameState(prev => ({
        ...prev,
        lastWord,
        currentLetter,
        streakCount,
        scores,
        wordHistory: [...prev.wordHistory, lastWord]
      }));
      sounds.playSuccess();
    });

    // Emoji Pop
    socket.on('emoji_targets_respawn', ({ targets }) => {
      setGameState(prev => ({ ...prev, targets }));
    });

    socket.on('emoji_target_popped', ({ targetId, poppedBy, scores }) => {
      setGameState(prev => ({
        ...prev,
        targets: (prev.targets || []).filter(t => t.id !== targetId),
        scores
      }));
      triggerReactionParticle('💥');
    });

    return () => {
      socket.off('room_joined_data');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('new_message');
      socket.off('stroke_received');
      socket.off('canvas_cleared');
      socket.off('user_typing_update');
      socket.off('reaction_burst');
      socket.off('game_state_sync');
      socket.off('game_timer_tick');
      socket.off('game_score_update');
      socket.off('game_round_ended');
      socket.off('game_stopped');
      socket.off('trivia_answer_acknowledged');
      socket.off('trivia_round_resolved');
      socket.off('word_chain_update');
      socket.off('emoji_targets_respawn');
      socket.off('emoji_target_popped');
      socket.emit('leave_room', { roomId });
    };
  }, [socket, roomId, userProfile]);

  const triggerReactionParticle = (emoji) => {
    const newParticle = {
      id: Math.random(),
      emoji,
      left: `${20 + Math.random() * 60}%`,
      bottom: '120px'
    };
    setFloatingParticles(prev => [...prev.slice(-15), newParticle]);
    setTimeout(() => {
      setFloatingParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, 2200);
  };

  const handleSendReaction = (emoji) => {
    if (!socket) return;
    socket.emit('send_reaction', { emoji });
  };

  // Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      if (strokeHistoryRef.current.length > 0) {
        replayStrokes(strokeHistoryRef.current);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [activeTab, gameState.type]);

  const replayStrokes = (strokes) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    strokeHistoryRef.current = strokes;
    strokes.forEach(stroke => {
      drawSegment(ctx, stroke.x1, stroke.y1, stroke.x2, stroke.y2, stroke.color, stroke.width, stroke.isEraser);
    });
  };

  const drawSegment = (ctx, x1, y1, x2, y2, color, width, isErase) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = isErase ? (theme === 'dark' ? '#090b10' : '#f5f6fa') : color;
    ctx.lineWidth = isErase ? width * 2.5 : width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const drawRemoteStroke = (stroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    strokeHistoryRef.current.push(stroke);
    drawSegment(ctx, stroke.x1, stroke.y1, stroke.x2, stroke.y2, stroke.color, stroke.width, stroke.isEraser);
  };

  const clearLocalCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokeHistoryRef.current = [];
  };

  const handleClearCanvasClick = () => {
    clearLocalCanvas();
    if (socket) socket.emit('clear_canvas');
  };

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e) => {
    if (gameState.isActive && gameState.type === 'scribble' && !gameState.isDrawer && activeTab === 'game') return;
    isDrawingRef.current = true;
    lastPointRef.current = getCanvasCoords(e);
  };

  const draw = (e) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;
    if (gameState.isActive && gameState.type === 'scribble' && !gameState.isDrawer && activeTab === 'game') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const coords = getCanvasCoords(e);

    const stroke = {
      x1: lastPointRef.current.x,
      y1: lastPointRef.current.y,
      x2: coords.x,
      y2: coords.y,
      color: brushColor,
      width: brushWidth,
      isEraser: isEraser
    };

    drawSegment(ctx, stroke.x1, stroke.y1, stroke.x2, stroke.y2, stroke.color, stroke.width, stroke.isEraser);
    strokeHistoryRef.current.push(stroke);
    if (socket) socket.emit('draw_stroke', stroke);

    lastPointRef.current = coords;
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const exportCanvasSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `soulnook-art-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    sounds.playSuccess();
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !socket) return;

    socket.emit('send_message', { text, isEphemeral });
    sounds.playSend();
    setInputText('');
    socket.emit('typing_status', { isTyping: false });
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socket) return;
    socket.emit('typing_status', { isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_status', { isTyping: false });
    }, 1800);
  };

  const handleSwitchGame = (gameType) => {
    if (socket) {
      sounds.playBoing();
      socket.emit('switch_game', { gameType });
    }
  };

  const handleToggleGame = () => {
    if (socket) {
      sounds.playPop();
      socket.emit('toggle_game');
    }
  };

  const handleTriviaAnswer = (index) => {
    if (!socket || gameState.selectedAnswerIdx !== null) return;
    socket.emit('submit_trivia_answer', { answerIndex: index });
  };

  const handlePopTarget = (target) => {
    if (!socket) return;
    sounds.playPop();
    socket.emit('pop_emoji_target', { targetId: target.id, points: target.points });
  };

  const handleNextTruthVent = () => {
    if (socket) {
      sounds.playBoing();
      socket.emit('next_truth_vent_prompt');
    }
  };

  return (
    <div className="room-view-container">
      {/* Panic Stealth Shield */}
      {isPanicActive && (
        <div className="panic-overlay" onClick={() => setIsPanicActive(false)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '12px', marginBottom: '20px' }}>
            <span>Terminal 1 — CS301: Linux Process Context Switch Simulator</span>
            <span>[Click anywhere to exit Stealth Shield]</span>
          </div>
          <pre style={{ lineHeight: 1.6, color: '#94a3b8' }}>
{`// Linux CFS Scheduler Routine
static void update_curr(struct cfs_rq *cfs_rq) {
    struct sched_entity *curr = cfs_rq->curr;
    u64 now = rq_clock_task(rq_of(cfs_rq));
    u64 delta_exec;
    
    if (unlikely(!curr)) return;
    delta_exec = now - curr->exec_start;
    curr->vruntime += calc_delta_fair(delta_exec, curr);
    update_min_vruntime(cfs_rq);
}`}
          </pre>
        </div>
      )}

      {/* Floating Reaction Particles */}
      {floatingParticles.map(p => (
        <div key={p.id} className="floating-reaction-particle" style={{ left: p.left, bottom: p.bottom }}>
          {p.emoji}
        </div>
      ))}

      {/* Header */}
      <header className="room-header">
        <div className="room-header-left">
          <button className="btn-pill-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={onLeaveRoom}>
            ➔ Leave
          </button>
          <div className="room-title-heading">
            <span>{roomData.name}</span>
            <span className="badge-pill" style={{ background: 'var(--bg-well)', color: 'var(--accent-violet)' }}>
              {roomData.category}
            </span>
          </div>
        </div>

        <div className="room-header-center">
          <select
            className="game-switcher-select"
            value={gameState.type}
            onChange={(e) => handleSwitchGame(e.target.value)}
          >
            <option value="scribble">🎨 Campus Scribble</option>
            <option value="trivia">⚡ Trivia Blitz</option>
            <option value="wordchain">🔗 Word Chain</option>
            <option value="emojipop">💥 Emoji Pop</option>
            <option value="truthvent">🎭 Truth & Vent</option>
          </select>

          <button
            className="btn-pill-primary"
            style={{ padding: '6px 16px', fontSize: '0.8rem' }}
            onClick={handleToggleGame}
          >
            {gameState.isActive ? '⏸️ Pause Arena' : '▶️ Launch Arena'}
          </button>
        </div>

        <div className="room-header-right">
          <button
            className="btn-pill-secondary"
            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
            onClick={() => {
              sounds.playPop();
              onToggleTheme();
            }}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          <div className="presence-avatars-list" title="Active students in lounge">
            {activeUsers.map(u => (
              <div key={u.id} className="presence-avatar" style={{ borderColor: u.color }} title={u.name}>
                {u.avatar}
              </div>
            ))}
          </div>

          <button
            className="btn-pill-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem', color: 'var(--accent-rose)' }}
            onClick={() => setIsPanicActive(true)}
            title="Instant Fake Study Screen"
          >
            ⚡ Panic
          </button>
        </div>
      </header>

      {/* Split-Screen Main Layout */}
      <main className="room-split-layout">
        {/* LEFT: Game Arena / Drawing Canvas */}
        <section className="game-pane">
          <div className="game-mode-nav">
            <div className="nav-tabs-group">
              <button
                className={`filter-tab-pill ${activeTab === 'game' ? 'active' : ''}`}
                onClick={() => setActiveTab('game')}
              >
                🎮 Active Arena ({gameState.type.toUpperCase()})
              </button>
              <button
                className={`filter-tab-pill ${activeTab === 'freedraw' ? 'active' : ''}`}
                onClick={() => setActiveTab('freedraw')}
              >
                🎨 Free Draw Canvas
              </button>
            </div>

            {gameState.isActive && (
              <span className="badge-pill" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
                ⏱️ {gameState.timeLeft}s
              </span>
            )}
          </div>

          {/* TAB 1: ACTIVE GAME ARENA */}
          {activeTab === 'game' && (
            <>
              {/* GAME 1: SCRIBBLE */}
              {gameState.type === 'scribble' && (
                <div className="canvas-wrapper">
                  {gameState.isActive && (
                    <div className="scribble-hud">
                      <span className="badge-pill" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
                        SCRIBBLE
                      </span>
                      {gameState.isDrawer ? (
                        <div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--accent-amber)' }}>DRAW THIS: </span>
                          <span className="scribble-word-text">{gameState.word}</span>
                        </div>
                      ) : (
                        <div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{gameState.drawer?.name || 'Someone'} is drawing: </span>
                          <span className="scribble-word-text">{gameState.maskedWord}</span>
                        </div>
                      )}
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>⏱️ {gameState.timeLeft}s</span>
                    </div>
                  )}

                  <canvas
                    ref={canvasRef}
                    className="drawing-canvas"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />

                  {/* Floating Drawing Palette */}
                  <div className="canvas-floating-toolbar">
                    {PALETTE.map((c, i) => (
                      <button
                        key={i}
                        className={`toolbar-color-btn ${brushColor === c && !isEraser ? 'active' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => {
                          setBrushColor(c);
                          setIsEraser(false);
                          sounds.playPop();
                        }}
                      />
                    ))}
                    <div className="tool-separator" />
                    <button
                      className={`filter-tab-pill ${isEraser ? 'active' : ''}`}
                      onClick={() => setIsEraser(!isEraser)}
                    >
                      🧹 Eraser
                    </button>
                    <input
                      type="range"
                      min="2"
                      max="28"
                      value={brushWidth}
                      onChange={(e) => setBrushWidth(Number(e.target.value))}
                      className="size-slider"
                    />
                    <div className="tool-separator" />
                    <button className="filter-tab-pill" onClick={handleClearCanvasClick}>🗑️ Clear</button>
                    <button className="filter-tab-pill" onClick={exportCanvasSnapshot}>📸 Save</button>
                  </div>
                </div>
              )}

              {/* GAME 2: TRIVIA BLITZ */}
              {gameState.type === 'trivia' && (
                <div className="arena-container">
                  <div className="glass-panel trivia-deck">
                    <div className="trivia-top-row">
                      <span className="badge-pill" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-violet)' }}>
                        ⚡ TRIVIA • {gameState.category || 'General'}
                      </span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                        ⏱️ {gameState.timeLeft}s
                      </span>
                    </div>

                    <h3 className="trivia-question-title">
                      {gameState.question || 'Loading next question...'}
                    </h3>

                    <div className="trivia-options-grid">
                      {(gameState.options || []).map((opt, idx) => {
                        const isSelected = gameState.selectedAnswerIdx === idx;
                        const isCorrect = gameState.resolvedAnswer?.correctIndex === idx;

                        return (
                          <button
                            key={idx}
                            className={`trivia-option-btn ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''}`}
                            onClick={() => handleTriviaAnswer(idx)}
                          >
                            <span>{String.fromCharCode(65 + idx)}.</span> {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* GAME 3: WORD CHAIN */}
              {gameState.type === 'wordchain' && (
                <div className="arena-container">
                  <div className="glass-panel wordchain-deck">
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span className="badge-pill" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
                        🔗 RAPID WORD CHAIN
                      </span>
                      <span className="badge-pill" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
                        🔥 {gameState.streakCount || 1}x Streak
                      </span>
                    </div>

                    <div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Previous Word: <strong>{gameState.lastWord}</strong>
                      </p>
                      <div className="chain-letter-display">
                        {gameState.currentLetter || 'C'}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                        Next word in chat must begin with "{gameState.currentLetter}"!
                      </p>
                    </div>

                    <div className="chain-history-stream">
                      {(gameState.wordHistory || []).slice(-8).map((w, i) => (
                        <span key={i} className="chain-tag">➔ {w}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* GAME 4: TRUTH & VENT */}
              {gameState.type === 'truthvent' && (
                <div className="arena-container">
                  <div className="glass-panel tvd-deck">
                    <span className="badge-pill" style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)' }}>
                      🎭 {gameState.prompt?.type?.toUpperCase() || 'PROMPT'}
                    </span>

                    <div className="tvd-prompt-box">
                      "{gameState.prompt?.text || 'Share your deepest campus confession in chat!'}"
                    </div>

                    <button className="btn-pill-primary" onClick={handleNextTruthVent}>
                      🎲 Draw Next Card
                    </button>
                  </div>
                </div>
              )}

              {/* GAME 5: EMOJI POP REFLEX ARCADE */}
              {gameState.type === 'emojipop' && (
                <div className="emojipop-arena">
                  <div style={{ position: 'absolute', top: '14px', left: '20px', zIndex: 5, display: 'flex', gap: '8px' }}>
                    <span className="badge-pill" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
                      💥 EMOJI POP ARCADE
                    </span>
                    <span style={{ fontWeight: 800, color: 'var(--accent-amber)' }}>
                      ⏱️ {gameState.timeLeft}s
                    </span>
                  </div>

                  {(gameState.targets || []).map((target) => (
                    <div
                      key={target.id}
                      className="emojipop-target"
                      style={{
                        left: `${target.x}%`,
                        top: `${target.y}%`,
                        fontSize: `${target.size}px`
                      }}
                      onClick={() => handlePopTarget(target)}
                    >
                      <span>{target.emoji}</span>
                      <span className="target-points-badge">+{target.points}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB 2: FREE DRAW CANVAS */}
          {activeTab === 'freedraw' && (
            <div className="canvas-wrapper">
              <canvas
                ref={canvasRef}
                className="drawing-canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <div className="canvas-floating-toolbar">
                {PALETTE.map((c, i) => (
                  <button
                    key={i}
                    className={`toolbar-color-btn ${brushColor === c && !isEraser ? 'active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => {
                      setBrushColor(c);
                      setIsEraser(false);
                      sounds.playPop();
                    }}
                  />
                ))}
                <div className="tool-separator" />
                <button
                  className={`filter-tab-pill ${isEraser ? 'active' : ''}`}
                  onClick={() => setIsEraser(!isEraser)}
                >
                  🧹 Eraser
                </button>
                <input
                  type="range"
                  min="2"
                  max="28"
                  value={brushWidth}
                  onChange={(e) => setBrushWidth(Number(e.target.value))}
                  className="size-slider"
                />
                <div className="tool-separator" />
                <button className="filter-tab-pill" onClick={handleClearCanvasClick}>🗑️ Clear</button>
                <button className="filter-tab-pill" onClick={exportCanvasSnapshot}>📸 Save</button>
              </div>
            </div>
          )}
        </section>

        {/* RIGHT: REAL-TIME VENT & CHAT */}
        <section className="chat-pane">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-mint)' }}></span>
              <span style={{ fontSize: '0.86rem', fontWeight: 700 }}>Real-Time Vent Feed</span>
            </div>
            <span className="badge-pill" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-mint)' }}>
              {activeUsers.length} Students
            </span>
          </div>

          <div className="chat-messages-container">
            {messages.map((m) => {
              if (m.isSystem) {
                return (
                  <div key={m.id} className="system-bubble">
                    {m.text}
                  </div>
                );
              }

              const isOwn = m.sender?.id === userProfile.id;

              return (
                <div
                  key={m.id}
                  className={`chat-bubble ${isOwn ? 'own' : 'other'} ${m.isEphemeral ? 'ephemeral' : ''}`}
                >
                  <div className="chat-bubble-meta">
                    <span style={{ color: m.sender?.color || 'var(--accent-violet)', fontWeight: 700 }}>
                      {m.sender?.avatar} {m.sender?.name || 'Anonymous'}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {m.isEphemeral && (
                      <span style={{ color: 'var(--accent-rose)', fontSize: '0.7rem', fontWeight: 700 }}>
                        🔥 Dissolving
                      </span>
                    )}
                  </div>
                  <div className="chat-bubble-content">
                    {m.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing */}
          <div className="typing-indicator-bar">
            {typingUsers.size > 0 && (
              <span>💬 {Array.from(typingUsers).join(', ')} is typing...</span>
            )}
          </div>

          {/* Reaction Bursts */}
          <div className="emoji-reactions-bar">
            {EMOJI_REACTIONS.map((emoji, i) => (
              <button
                key={i}
                className="emoji-btn"
                onClick={() => handleSendReaction(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Input */}
          <form className="chat-input-area" onSubmit={handleSendMessage}>
            <div className="chat-input-row">
              <input
                type="text"
                className="chat-input-field"
                placeholder={
                  gameState.type === 'scribble' ? "Guess scribble word or chat..." :
                  gameState.type === 'wordchain' ? `Enter word starting with '${gameState.currentLetter}'...` :
                  "Vent freely, drop thoughts..."
                }
                value={inputText}
                onChange={handleInputChange}
              />
              <button type="submit" className="btn-pill-primary" style={{ padding: '8px 16px', borderRadius: '50%' }}>
                ➔
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="ephemeral-toggle">
                <input
                  type="checkbox"
                  checked={isEphemeral}
                  onChange={(e) => setIsEphemeral(e.target.checked)}
                />
                <span>🔥 Dissolving Vent Mode (12s)</span>
              </label>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Enter to send</span>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
