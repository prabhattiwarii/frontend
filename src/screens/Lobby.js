import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketProvider';

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
    <div>
      <h1>Lobby</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email Id:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br />
        <label htmlFor="roomNo">Room Number:</label>
        <input
          type="text"
          id="roomNo"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          required
        />
        <br />
        <button type="submit">Join</button>
      </form>
    </div>
  );
};

export default Lobby;
