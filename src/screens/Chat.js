import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketProvider';
import './Chat.css';

const Chat = ({ remoteSocketId }) => {
    const socket = useSocket();
    const [chatMessages, setChatMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');

    useEffect(() => {
        socket.on('chat:message', handleMessageReceived);
        return () => {
            socket.off('chat:message', handleMessageReceived);
        };
    }, [socket]);

    const handleMessageReceived = message => {
        setChatMessages(prevMessages => [...prevMessages, message]);
    };

    const handleSendMessage = () => {
        if (inputMessage.trim() === '') {
            return;
        }

        const newMessage = {
            sender: remoteSocketId === socket.id ? 'You' : 'Connected Person',
            message: inputMessage,
        };

        socket.emit('chat:message', newMessage);
        setChatMessages(prevMessages => [...prevMessages, newMessage]);
        setInputMessage('');
    };

    const handleInputKeyPress = event => {
        if (event.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <div className="chat-section">
            <div className="chat-messages">
                {chatMessages.map((message, index) => (
                    <div key={index} className="chat-message">
                        <strong>{message.sender}:</strong> {message.message}
                    </div>
                ))}
            </div>
            <div className="chat-input">
                <input
                    type="text"
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    onKeyPress={handleInputKeyPress}
                />
                <button onClick={handleSendMessage}>Send</button>
            </div>
        </div>
    );
};

export default Chat;
