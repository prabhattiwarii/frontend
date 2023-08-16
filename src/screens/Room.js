import React, { useCallback, useEffect, useState } from 'react'
import ReactPlayer from 'react-player'
import { useSocket } from '../context/SocketProvider'
import peer from '../services/peer';
import './Room.css'
import Chat from './Chat';

const Room = () => {
    const socket = useSocket();
    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [myStream, setMyStream] = useState(null);
    const [live, setLive] = useState(null);
    const [videoMuted, setVideoMuted] = useState(false);
    const [audioMuted, setAudioMuted] = useState(false);


  const handleVideoToggle = () => {
    setVideoMuted(!videoMuted);
    myStream.getVideoTracks()[0].enabled = !videoMuted;
  };

  const handleAudioToggle = () => {
    setAudioMuted(!audioMuted);
    myStream.getAudioTracks()[0].enabled = !audioMuted;
  };

    const handleUserJoined = useCallback(({ email, id }) => {
        console.log(`Email ${email} joined the room`);
        setRemoteSocketId(id);
    }, []);


    const handleIncommingcall = useCallback(async ({ from, offer }) => {
        setRemoteSocketId(from);
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        });
        setMyStream(stream);
    
        console.log(`Incoming call`, from, offer);
        const ans = await peer.getAnswer(offer);
        socket.emit('call:accepted', { to: from, ans });
    }, [socket]);
    
    
    const sendLive = useCallback(() => {
        if (myStream) {
            const senders = peer.peer.getSenders(); // Get existing senders
            myStream.getTracks().forEach(track => {
                const existingSender = senders.find(sender => sender.track === track);
                if (!existingSender) {
                    peer.peer.addTrack(track, myStream); // Only add if not already added
                }
            });
        }
    }, [myStream]);
    
    

    const handlecallAccepted = useCallback(({ from, ans }) => {
        peer.setLocalDescription(ans);
        console.log('Call Accepted');
        sendLive();
    }, [sendLive]);
    
    

    const handleNegoNeeded = useCallback(async () => {
        const offer = await peer.getOffer();
        socket.emit('peer:nego:needed', { offer, to: remoteSocketId });
    }, [remoteSocketId, socket]);


    useEffect(() => {
        peer.peer.addEventListener('negotiationneeded', handleNegoNeeded);
        return () => {
            peer.peer.removeEventListener('negotiationneeded', handleNegoNeeded);
        };
    }, [handleNegoNeeded]);


    const handleNegoNeedeIncomming = useCallback(async({ from, offer }) => {
        const ans = await peer.getAnswer(offer);
        socket.emit("peer:nego:done", { to: from, ans });
    }, [socket]);

    useEffect(() => {
        peer.peer.addEventListener('track', async (ev) => {
            const live = ev.streams;
            setLive(live[0])
        })
    }, [])

    const handleNegoNeedeFinal = useCallback(async ({ ans }) => {
        await peer.setLocalDescription(ans)
    }, [])

    useEffect(() => {
        socket.on('user:joined', handleUserJoined);
        socket.on('incomming:call', handleIncommingcall);
        socket.on('call:accepted', handlecallAccepted);
        socket.on('peer:nego:needed', handleNegoNeedeIncomming)
        socket.on('peer:nego:final', handleNegoNeedeFinal)

        return () => {
            socket.off('user:joined', handleUserJoined);
            socket.off('incomming:call', handleIncommingcall);
            socket.off('call:accepted', handlecallAccepted);
            socket.off('peer:nego:needed', handleNegoNeedeIncomming);
            socket.off('peer:nego:final', handleNegoNeedeFinal)


        }
    }, [socket, handleUserJoined, handleIncommingcall, handlecallAccepted, handleNegoNeedeIncomming, handleNegoNeedeFinal])

    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });

        const offer = await peer.getOffer();
        socket.emit("user:call", { to: remoteSocketId, offer });
        setMyStream(stream);
    }, [remoteSocketId, socket]);

    const handleHangUp = () => {
      // Clean up and end the call
      setRemoteSocketId(null);
      setMyStream(null);
      setLive(null);
      peer.peer.close();
    };

    return (
      <div className="room-container">
        <div className="room-header">
          <h1>Room</h1>
          <h4>{remoteSocketId ? 'Connected' : 'No one in room'}</h4>
        </div>
        <div className="room-actions">
          {myStream && (
            <button className="action-button" onClick={sendLive}>
              Send Live
            </button>
          )}
          {remoteSocketId && (
            <button className="action-button" onClick={handleCallUser}>
              Call
            </button>
          )}
          {myStream && (
            <>
              <button
                className={`toggle-button ${videoMuted ? 'muted' : ''}`}
                onClick={handleVideoToggle}
              >
                {videoMuted ? 'Video On' : 'Video Off'}
              </button>
              <button
                className={`toggle-button ${audioMuted ? 'muted' : ''}`}
                onClick={handleAudioToggle}
              >
                {audioMuted ? 'Audio On' : 'Audio Off'}
              </button>
            </>
          )}
          <div >
            {myStream && (
            <button className="action-button hang-up-button" onClick={handleHangUp}>
              Hang Up
            </button>
           )}
          </div>
        </div>
        <div className="stream-section">
          <div className="stream">
            <h2>My Stream</h2>
            {myStream && (
              <ReactPlayer playing muted width="100%" url={myStream} />
            )}
          </div>
          <div className="stream">
            <h2>Live</h2>
            {live && <ReactPlayer playing muted width="100%" url={live} />}
          </div>
        </div>
        <Chat/>
      </div>
    );
  };
  
  export default Room;
  
    