// This file handles API requests to the backend conversation app.

const API_ENDPOINT = 'http://localhost:8000/api/v1/chat/';

async function sendMessage(message) {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

async function getMessages() {
    try {
        const response = await fetch(API_ENDPOINT);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}