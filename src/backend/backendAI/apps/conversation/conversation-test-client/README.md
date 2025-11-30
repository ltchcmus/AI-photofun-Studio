# Conversation Test Client

This project is a simple web application designed to test the functionality of the conversation app. It provides a user interface for interacting with the conversation API, allowing users to send and receive messages in real-time.

## Project Structure

```
conversation-test-client
├── index.html        # Main HTML document for the chat interface
├── css
│   └── style.css     # Styles for the HTML elements
├── js
│   ├── api.js        # Handles API requests to the backend
│   ├── chat.js       # Manages chat functionality
│   └── config.js     # Configuration settings for the application
└── README.md         # Documentation for the project
```

## Getting Started

To set up and run the web application, follow these steps:

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd conversation-test-client
   ```

2. **Open `index.html`** in your web browser. You can do this by double-clicking the file or using a local server.

3. **Ensure the backend conversation app is running**. The frontend will make API requests to the backend, so make sure the backend service is up and accessible.

## Dependencies

This project does not have any external dependencies. However, ensure that you have a modern web browser to run the application.

## Usage

- Use the chat interface to send messages.
- Messages will be displayed in real-time as they are sent and received.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.