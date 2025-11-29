# API Gateway for BackendAI

This API Gateway serves as the entry point for the BackendAI project, facilitating communication between clients and various backend services, including chat sessions and image generation.

## Features

- **Chat Session Management**: Handles creating, retrieving, and deleting chat sessions.
- **Image Generation**: Processes requests for image generation and manipulation.
- **Health Check**: Provides a health check endpoint to verify the API Gateway's operational status.
- **Middleware Support**: Includes middleware for authentication, CORS, and logging.

## Getting Started

### Prerequisites

- Python 3.8 or higher
- FastAPI
- Uvicorn
- Other dependencies listed in `requirements.txt`

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd api-gateway
   ```

2. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` and update the values as needed.

### Running the API Gateway

To start the API Gateway, run the following command:

```
uvicorn src.main:app --host 0.0.0.0 --port 9999
```

### API Documentation

API endpoints and their usage can be found in the respective route files located in the `src/routes` directory. 

### Logging

Logs are stored in the `logs/gateway.log` file. Ensure that the logging configuration is set up correctly in the middleware.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.