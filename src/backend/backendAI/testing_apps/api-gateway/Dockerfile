FROM python:3.12-slim

# Set the working directory
WORKDIR /app

# Copy the requirements file
COPY requirements.txt .

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the source code
COPY src/ ./src/
COPY config/ ./config/
COPY .env ./

# Expose the port the app runs on
EXPOSE 9999

# Command to run the application
CMD ["python", "src/main.py"]