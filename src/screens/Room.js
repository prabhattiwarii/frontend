import React, { useCallback, useEffect, useState } from 'react'
import ReactPlayer from 'react-player'
import { useSocket } from '../context/SocketProvider'
import peer from '../services/peer';


const Room = () => {
    const socket = useSocket();
    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [myStream, setMyStream] = useState(null);
    const [live, setLive] = useState(null);

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

    return (
        <div>
            <h1>Room</h1>
            <h4>{remoteSocketId ? 'Connected' : 'No one in room'}</h4>
            {myStream && <button onClick={sendLive}>Send Live</button>}
            {remoteSocketId && <button onClick={handleCallUser}>Call</button>}
            <h1>My Stream</h1>
            {
                myStream && <ReactPlayer playing muted height="200px" width="300px" url={myStream} />
            }
            <h1>Live</h1>
            {
                live && <ReactPlayer playing muted height="200px" width="300px" url={live} />
            }
        </div>
    )
}

export default Room