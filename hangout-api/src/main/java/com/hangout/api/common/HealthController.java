package com.hangout.api.common;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** NFR-REL-2: GET /health for the host's health check. */
@RestController
public class HealthController {
    @GetMapping({"/health", "/api/v1/health"})
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }
}
