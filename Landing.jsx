import React from 'react';
import './Landing.css';
import { sounds } from '../utils/sound';

export default function Landing({
  onEnterLounge,
  userProfile,
  theme = 'light',
  onToggleTheme
}) {
  const handleEnter = () => {
    sounds.playChime();
    onEnterLounge();
  };

  return (
    <div className="landing-viewport">
      {/* Background Floating Outline Doodles (InkCognito Aesthetic) */}
      <div className="doodle-backdrop">
        {/* Crown doodle top-left */}
        <div className="floating-doodle" style={{ top: '18%', left: '8%' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--doodle-stroke)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 36L6 14L16 24L24 10L32 24L42 14L40 36H8Z" />
            <circle cx="24" cy="9" r="2" fill="var(--doodle-stroke)" />
          </svg>
        </div>

        {/* Happy face doodle left */}
        <div className="floating-doodle" style={{ top: '56%', left: '6%', animationDelay: '-2s' }}>
          <svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="var(--doodle-stroke)" strokeWidth="2" strokeLinecap="round">
            <circle cx="24" cy="24" r="18" />
            <circle cx="18" cy="20" r="2" fill="var(--doodle-stroke)" />
            <circle cx="30" cy="20" r="2" fill="var(--doodle-stroke)" />
            <path d="M16 28C18 33 30 33 32 28" />
          </svg>
        </div>

        {/* Cat doodle bottom-left */}
        <div className="floating-doodle" style={{ bottom: '10%', left: '12%', animationDelay: '-4s' }}>
          <svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="var(--doodle-stroke)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 38V22L6 10L18 16C20 15 28 15 30 16L42 10L38 22V38H10Z" />
            <circle cx="18" cy="26" r="1.5" fill="var(--doodle-stroke)" />
            <circle cx="30" cy="26" r="1.5" fill="var(--doodle-stroke)" />
            <path d="M22 30L24 32L26 30" />
          </svg>
        </div>

        {/* Pencil top-center */}
        <div className="floating-doodle" style={{ top: '14%', left: '22%', animationDelay: '-1.5s' }}>
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="var(--doodle-stroke)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M34 6L42 14L16 40H8V32L34 6Z" />
          </svg>
        </div>

        {/* Cloud top-right */}
        <div className="floating-doodle" style={{ top: '16%', right: '14%', animationDelay: '-3s' }}>
          <svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="var(--doodle-stroke)" strokeWidth="2" strokeLinecap="round">
            <path d="M12 34C8 34 6 30 7 26C8 22 12 21 14 21C16 14 26 13 30 18C34 16 40 19 40 24C43 26 42 34 36 34H12Z" />
          </svg>
        </div>

        {/* Coffee cup bottom-right */}
        <div className="floating-doodle" style={{ bottom: '15%', right: '10%', animationDelay: '-5s' }}>
          <svg width="46" height="46" viewBox="0 0 48 48" fill="none" stroke="var(--doodle-stroke)" strokeWidth="2" strokeLinecap="round">
            <path d="M10 18H36V32C36 37 31 41 24 41C17 41 12 37 10 32V18Z" />
            <path d="M36 22H40C42 22 44 24 44 27C44 30 42 32 40 32H36" />
          </svg>
        </div>
      </div>

      {/* Header Bar */}
      <header className="landing-nav">
        <div className="brand-wrapper">
          <div className="brand-icon-box">🌌</div>
          <h2 className="brand-title">Soulnook</h2>
        </div>

        <div className="nav-actions">
          <button
            className="btn-pill-secondary"
            onClick={() => {
              sounds.playPop();
              onToggleTheme();
            }}
            title="Toggle Light / Dark Mode"
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <button
            className="btn-pill-secondary"
            onClick={() => {
              sounds.playBoing();
              sounds.toggleAmbient();
            }}
          >
            🎵 Lo-Fi
          </button>
          <span className="badge-pill" style={{ background: 'var(--bg-well)', color: 'var(--text-secondary)' }}>
            A1
          </span>
        </div>
      </header>

      {/* Center Hero */}
      <main className="landing-hero-center">
        <div className="hero-pill-tag">
          <span>✨ Stress Relief, Fun & Anonymous Chat</span>
        </div>

        <h1 className="hero-main-title">
          Scribble Fast... <br />
          Chat Completely Anonymous.
        </h1>

        <p className="hero-sub-text">
          Join public lobby lounges and jump in instantly. Experience real-time synchronized canvas, 5 interactive multiplayer mini-games, and zero persistent logs.
        </p>

        {/* 3-Panel Preview Deck (InkCognito Layout) */}
        <div className="preview-cards-row">
          {/* Left Card */}
          <div className="glass-panel preview-card-left">
            <div className="roomie-avatar-box">
              <span>{userProfile.avatar || '🛡️'}</span>
            </div>
            <div>
              <div className="roomie-label">Assigned Alias</div>
              <div className="roomie-id">{userProfile.name}</div>
            </div>
          </div>

          {/* Center Card: Joint Lobby Chat Simulation */}
          <div className="glass-panel preview-card-center">
            <div className="chat-card-header">
              <span className="chat-card-title">Joint Lobby Chat</span>
              <span className="chat-card-live">
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-mint)' }}></span>
                <span>Join Lobby</span>
              </span>
            </div>

            <div className="chat-preview-feed">
              <div className="preview-bubble">
                <span style={{ fontWeight: 700, color: 'var(--accent-violet)' }}>Soulnook Bot: </span>
                <span>Welcome! Pick a lounge to vent freely or play Scribble 🎨</span>
              </div>
              <div className="preview-bubble" style={{ alignSelf: 'flex-end', background: 'var(--bg-surface-elevated)' }}>
                <span>Exam in 2 hours, drawing away the panic here 😂</span>
                <span className="preview-sticker-emoji">😂</span>
              </div>
            </div>

            <div className="chat-preview-input-box">
              <span>Message in lounge...</span>
              <span>➔</span>
            </div>
          </div>

          {/* Right Card: Topic Lounges */}
          <div className="glass-panel preview-card-right">
            <div className="right-card-header">
              <span>👥 Topic Lounges</span>
            </div>
            <div className="topic-preview-pill">
              <span>Daily Lounge</span>
              <span>☕</span>
            </div>
            <div className="topic-preview-pill">
              <span>Art & Creativity Jam</span>
              <span>🖌️</span>
            </div>
            <div className="topic-preview-pill">
              <span>Campus Trivia Blitz</span>
              <span>⚡</span>
            </div>
            <div className="topic-preview-pill">
              <span>Rapid Word Chain</span>
              <span>🔗</span>
            </div>
          </div>
        </div>

        {/* Hop into Lounge CTA */}
        <div className="landing-bottom-cta">
          <button className="btn-hop-lounge" onClick={handleEnter}>
            <span>🚀 Hop into A Topic Lounge</span>
          </button>
        </div>
      </main>

      {/* Mini Footer */}
      <footer className="landing-mini-footer">
        <span>Soulnook • Ephemeral Campus Sanctuary</span>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>🔒 Zero Trace</span>
          <span>🎮 5 Multiplayer Games</span>
          <span>⚡ Real-Time Web Mesh</span>
        </div>
      </footer>
    </div>
  );
}
