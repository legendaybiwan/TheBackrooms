import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Landing from './components/Landing';
import Lobby from './components/Lobby';
import RoomView from './components/RoomView';
import { generateAnonymousIdentity } from './utils/identity';
import { sounds } from './utils/sound';

export default function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'lobby' | 'room'
  const [userProfile, setUserProfile] = useState(() => {
    const saved = sessionStorage.getItem('soulnook_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return generateAnonymousIdentity();
  });
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [activeTotalUsers, setActiveTotalUsers] = useState(14);
  const socketRef = useRef(null);

  // Save profile to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('soulnook_user', JSON.stringify(userProfile));
  }, [userProfile]);

  // Connect to Socket.io Server
  useEffect(() => {
    const serverUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3001' 
      : `http://${window.location.hostname}:3001`;

    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🌌 Connected to Soulnook Socket Server:', socket.id);
    });

    socket.on('rooms_update', (updatedRooms) => {
      setRooms(updatedRooms);
      const total = updatedRooms.reduce((acc, r) => acc + (r.userCount || 0), 0);
      setActiveTotalUsers(Math.max(total, updatedRooms.length * 2 + 3));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleRerollProfile = () => {
    const newProfile = generateAnonymousIdentity();
    setUserProfile(newProfile);
  };

  const handleJoinRoom = (roomId) => {
    setCurrentRoomId(roomId);
    setCurrentView('room');
  };

  const handleCreateRoom = (roomData) => {
    if (socketRef.current) {
      socketRef.current.emit('create_room', roomData, ({ success, roomId }) => {
        if (success && roomId) {
          handleJoinRoom(roomId);
        }
      });
    }
  };

  const handleLeaveRoom = () => {
    sounds.playPop();
    setCurrentRoomId(null);
    setCurrentView('lobby');
  };

  return (
    <>
      {/* Ambient Grid & Background Orbs */}
      <div className="cyber-grid" />
      <div className="ambient-glow-orb orb-1" />
      <div className="ambient-glow-orb orb-2" />
      <div className="ambient-glow-orb orb-3" />

      {/* Main View Router */}
      {currentView === 'landing' && (
        <Landing
          onEnterLounge={() => setCurrentView('lobby')}
          userProfile={userProfile}
          activeUsersCount={activeTotalUsers}
        />
      )}

      {currentView === 'lobby' && (
        <Lobby
          rooms={rooms}
          userProfile={userProfile}
          onUpdateUserProfile={setUserProfile}
          onRerollProfile={handleRerollProfile}
          onJoinRoom={handleJoinRoom}
          onCreateRoom={handleCreateRoom}
          onBackToLanding={() => setCurrentView('landing')}
        />
      )}

      {currentView === 'room' && currentRoomId && (
        <RoomView
          socket={socketRef.current}
          roomId={currentRoomId}
          userProfile={userProfile}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </>
  );
}
