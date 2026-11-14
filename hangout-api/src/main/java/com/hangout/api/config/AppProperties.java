package com.hangout.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/** Everything tunable lives in application.yml under "hangout" (SRS section 5: starting defaults). */
@ConfigurationProperties(prefix = "hangout")
public record AppProperties(
        String publicUrl,
        String frontendUrl,
        List<String> corsOrigins,
        String timeZone,
        Jwt jwt,
        Uploads uploads,
        boolean demoUpgradeEnabled,
        int freeSearchesPerMonth,
        int sessionTtlHours,
        Google google,
        Stripe stripe,
        City city,
        Engine engine
) {
    public record Jwt(String secret, int ttlHours) {}
    public record Uploads(String dir) {}
    public record Google(boolean enabled, String placesApiKey, String signInClientId) {}
    public record Stripe(String secretKey) {}
    public record City(double centerLat, double centerLng, double salesTaxRate, double tipRate) {}
    public record Engine(
            int defaultMaxLegMinutes,
            double walkMph,
            double transitMph,
            double carMph,
            double detourFactor,
            int transitFareCents,
            int rideshareBaseCents,
            int ridesharePerMileCents,
            int ridesharePerMinuteCents,
            int carCostPerMileCents,
            int parkingPerStopCents,
            double hiddenGemMinRating,
            int hiddenGemMaxReviews
    ) {}
}
