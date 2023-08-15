import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketProvider';
import './Lobby.css'
const Lobby = () => {
  const [email, setEmail] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const navigate = useNavigate();

  const socket = useSocket();

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    socket.emit("room:join", { email, roomNumber })
  }, [email, roomNumber, socket]);

  const handleJoinRoom = useCallback((data) => {
    const { email, roomNumber } = data;
    navigate(`/room/${roomNumber}`)
  }, [navigate])

  useEffect(() => {
    socket.on('room:join', handleJoinRoom)
    return () => {
      socket.off('room:join', handleJoinRoom);
    }
  }, [socket, handleJoinRoom]);

  return (
    <div className="lobby-container">
    <h1 className="lobby-title">Join a Room</h1>
    <form onSubmit={handleSubmit} className="lobby-form">
      <label htmlFor="email" className="form-label">
        Email Id
      </label>
      <input
        type="email"
        id="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="form-input"
        required
      />
      <label htmlFor="roomNo" className="form-label">
        Room Number
      </label>
      <input
        type="text"
        id="roomNo"
        value={roomNumber}
        onChange={(e) => setRoomNumber(e.target.value)}
        className="form-input"
        required
      />
      <button type="submit" className="form-button">
        Join
      </button>
    </form>
  </div>
);
};

export default Lobby;
