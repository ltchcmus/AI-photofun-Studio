# Build stage
FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the jar file from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8081

# Run the application with optimized JVM settings for faster startup
ENTRYPOINT ["java", \
    "-Xms256m", \
    "-Xmx512m", \
    "-XX:+UseSerialGC", \
    "-XX:MaxRAMPercentage=75.0", \
    "-XX:TieredStopAtLevel=1", \
    "-Dspring.jmx.enabled=false", \
    "-jar", "app.jar"]
