// This file manages the chat functionality. It includes functions to update the chat interface, display messages, and handle user input.

const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

// Function to display a message in the chat
function displayMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(sender);
    messageElement.textContent = message;
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll to the bottom
}

// Function to handle sending a message
function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        displayMessage(message, 'user');
        messageInput.value = ''; // Clear input field
        // Call API to send the message
        sendMessageToAPI(message);
    }
}

// Function to send message to the API
function sendMessageToAPI(message) {
    fetch('YOUR_API_ENDPOINT_HERE', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message }),
    })
    .then(response => response.json())
    .then(data => {
        displayMessage(data.reply, 'bot'); // Display bot's reply
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Event listener for the send button
sendButton.addEventListener('click', sendMessage);

// Event listener for the Enter key
messageInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});