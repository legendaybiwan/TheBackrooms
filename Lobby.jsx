import React, { useState } from 'react';
import './Lobby.css';
import { sounds } from '../utils/sound';

const CATEGORIES = ['All', 'General', 'Study', 'Rant', 'Art', 'Mini-Game'];

const GAME_OPTIONS = [
  { id: 'scribble', name: '🎨 Campus Scribble (Speed Pictionary)' },
  { id: 'trivia', name: '⚡ Campus Trivia Blitz (14s Countdown)' },
  { id: 'wordchain', name: '🔗 Rapid Word Chain (Combo Builder)' },
  { id: 'emojipop', name: '💥 Emoji Pop Reflex (Fast Reaction)' },
  { id: 'truthvent', name: '🎭 Truth, Vent & Dare (Confessions)' }
];

export default function Lobby({
  rooms = [],
  userProfile,
  onUpdateUserProfile,
  onRerollProfile,
  onJoinRoom,
  onCreateRoom,
  onBackToLanding,
  theme = 'light',
  onToggleTheme
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New room modal
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCategory, setNewRoomCategory] = useState('General');
  const [newRoomGame, setNewRoomGame] = useState('scribble');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomTags, setNewRoomTags] = useState('');

  const filteredRooms = rooms.filter(room => {
    const matchesCat = selectedCategory === 'All' || room.category === selectedCategory;
    const matchesSearch =
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.tags && room.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCat && matchesSearch;
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    sounds.playSuccess();
    onCreateRoom({
      name: newRoomName.trim(),
      category: newRoomCategory,
      selectedGame: newRoomGame,
      description: newRoomDesc.trim() || 'A chill space to decompress.',
      tags: newRoomTags.split(',').map(t => t.trim()).filter(Boolean)
    });

    setIsModalOpen(false);
    setNewRoomName('');
    setNewRoomDesc('');
    setNewRoomTags('');
  };

  const getGameLabel = (gameType) => {
    switch (gameType) {
      case 'trivia': return '⚡ Trivia Blitz';
      case 'wordchain': return '🔗 Word Chain';
      case 'emojipop': return '💥 Emoji Pop';
      case 'truthvent': return '🎭 Truth & Vent';
      case 'scribble':
      default: return '🎨 Scribble';
    }
  };

  return (
    <div className="lobby-container">
      {/* Header */}
      <header className="lobby-header-bar">
        <div className="lobby-brand" onClick={onBackToLanding}>
          <div className="brand-icon-box" style={{ width: '34px', height: '34px', fontSize: '1.1rem' }}>🌌</div>
          <h2 className="brand-title">Soulnook</h2>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="btn-pill-secondary"
            onClick={() => {
              sounds.playPop();
              onToggleTheme();
            }}
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
          <button className="btn-pill-secondary" onClick={onBackToLanding}>
            🏠 Landing
          </button>
        </div>
      </header>

      {/* Identity Card */}
      <section className="identity-banner glass-panel" style={{ '--user-color': userProfile.color }}>
        <div className="identity-info">
          <div className="identity-avatar-box">
            <span>{userProfile.avatar}</span>
            <span className="identity-avatar-badge"></span>
          </div>

          <div className="identity-details">
            <div className="identity-name-row">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Alias:</span>
              <input
                type="text"
                className="identity-name-input"
                value={userProfile.name}
                onChange={(e) => onUpdateUserProfile({ ...userProfile, name: e.target.value })}
                title="Click to edit your alias"
              />
            </div>
            <span className="identity-mood">{userProfile.mood}</span>
          </div>
        </div>

        <div className="identity-actions">
          <button
            className="btn-pill-secondary"
            onClick={() => {
              sounds.playBoing();
              onRerollProfile();
            }}
          >
            🎲 Re-Roll Alias
          </button>
          <span className="badge-pill" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-mint)' }}>
            🔒 Ephemeral ID
          </span>
        </div>
      </section>

      {/* Controls Bar */}
      <section className="lobby-controls-section">
        <div className="controls-top-row">
          <div className="search-box-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search lounges by topic, vibe or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-pill-secondary"
              onClick={() => {
                if (rooms.length > 0) {
                  const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
                  sounds.playChime();
                  onJoinRoom(randomRoom.id);
                }
              }}
            >
              ⚡ Quick Match
            </button>
            <button
              className="btn-pill-primary"
              onClick={() => {
                sounds.playPop();
                setIsModalOpen(true);
              }}
            >
              ➕ Create Lounge
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="category-filter-bar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`filter-tab-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(cat);
                sounds.playPop();
              }}
            >
              {cat === 'All' && '🌐'}
              {cat === 'General' && '🛋️'}
              {cat === 'Study' && '📚'}
              {cat === 'Rant' && '📢'}
              {cat === 'Art' && '🎨'}
              {cat === 'Mini-Game' && '🎮'}
              <span>{cat}</span>
              <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>
                ({cat === 'All' ? rooms.length : rooms.filter(r => r.category === cat).length})
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Room Cards Grid */}
      <main className="room-grid">
        {filteredRooms.map(room => (
          <div key={room.id} className="glass-panel-interactive room-card">
            <div className="room-card-top">
              <span className="room-card-game-badge">
                {getGameLabel(room.selectedGame)}
              </span>
              <div className="room-user-badge">
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-mint)' }}></span>
                <span>{room.userCount || 0} active</span>
              </div>
            </div>

            <div>
              <h3 className="room-card-title">{room.name}</h3>
              <p className="room-card-desc">{room.description}</p>
            </div>

            {room.tags && room.tags.length > 0 && (
              <div className="room-tag-pills">
                {room.tags.map((tag, i) => (
                  <span key={i} className="room-tag">#{tag}</span>
                ))}
              </div>
            )}

            <div className="room-card-footer">
              <button
                className="btn-pill-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                onClick={() => {
                  sounds.playChime();
                  onJoinRoom(room.id);
                }}
              >
                <span>Step Inside</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        ))}

        {filteredRooms.length === 0 && (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '44px', textAlign: 'center' }}>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              No lounges match "{searchQuery}" in this category.
            </p>
            <button className="btn-pill-primary" onClick={() => setIsModalOpen(true)}>
              Create this Lounge ✨
            </button>
          </div>
        )}
      </main>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create a Lounge</h3>
              <button className="btn-pill-icon" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-form-group">
                <label className="modal-label">Lounge Title</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="e.g. 3AM Chill & Lo-Fi Beats 🎧"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Category</label>
                <select
                  className="modal-select"
                  value={newRoomCategory}
                  onChange={(e) => setNewRoomCategory(e.target.value)}
                >
                  <option value="General">General / Casual Banter 🛋️</option>
                  <option value="Study">Study & Focus Cramming 📚</option>
                  <option value="Rant">Rant & Mental Dump 📢</option>
                  <option value="Art">Art & Mindless Doodling 🎨</option>
                  <option value="Mini-Game">Mini-Game Arena 🎮</option>
                </select>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Select Lounge Mini-Game</label>
                <select
                  className="modal-select"
                  value={newRoomGame}
                  onChange={(e) => setNewRoomGame(e.target.value)}
                >
                  {GAME_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Topic Description</label>
                <textarea
                  className="modal-textarea"
                  rows="3"
                  placeholder="What is the vibe or purpose of this room?"
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Tags (comma-separated)</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Quiet, ExamVenting, LoFi, Aesthetic"
                  value={newRoomTags}
                  onChange={(e) => setNewRoomTags(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-pill-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-pill-primary">
                  Launch Lounge 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
