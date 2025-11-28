# API Gateway for backendAI Project

This API Gateway serves as the entry point for the backendAI project, facilitating communication between the frontend and various backend services. It is built using FastAPI and is designed to be modular, allowing for easy integration of additional features and services.

## Project Structure

The project is organized into several directories and files:

- **src/**: Contains the main application code.
  - **main.py**: The entry point of the API Gateway application.
  - **routes/**: Contains route definitions for different services.
  - **middleware/**: Contains middleware for authentication, CORS, and error handling.
  - **services/**: Contains service-related code, including request proxying.
  - **utils/**: Contains utility functions for logging and validation.

- **config/**: Contains configuration settings for the API Gateway.
  - **settings.py**: Configuration settings including the port number.
  - **services.yaml**: Configuration for the services the API Gateway interacts with.

- **logs/**: Directory for log files.

- **.env**: Environment variables for the application.

- **requirements.txt**: Lists the dependencies required for the project.

- **Dockerfile**: Instructions for building a Docker image for the API Gateway.

## Running the API Gateway

To run the API Gateway, ensure you have the required dependencies installed. You can install them using:

```
pip install -r requirements.txt
```

Then, you can start the application using:

```
uvicorn src.main:app --host 0.0.0.0 --port 9999
```

## Configuration

The API Gateway runs on port 9999, and configuration settings can be modified in the `config/settings.py` file for easy future modifications.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.