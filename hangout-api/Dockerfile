# ---- build ----
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B -DskipTests package

# ---- run ----
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd -r -u 1001 app && mkdir -p /data/uploads && chown -R app /data
COPY --from=build /app/target/hangout-api-*.jar app.jar
USER app
ENV SPRING_PROFILES_ACTIVE=docker
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=40s CMD curl -fs http://localhost:8080/health || exit 1
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
