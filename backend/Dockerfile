# Multi-stage build per ottimizzare l'immagine finale

# Stage 1: Build con Maven
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copia pom.xml per caching dipendenze
COPY pom.xml .

# Download dipendenze (layer cache)
RUN mvn dependency:go-offline -B

# Copia sorgenti
COPY src ./src

# Build applicazione (skip tests per velocità)
RUN mvn clean package -DskipTests -B

# Stage 2: Runtime con JRE
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Crea utente non-root per sicurezza
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copia solo JAR dalla build stage
COPY --from=build /app/target/*.jar app.jar

# Esponi porta
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Entrypoint
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
