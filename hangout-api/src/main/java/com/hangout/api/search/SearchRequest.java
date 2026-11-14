package com.hangout.api.search;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hangout.api.engine.TravelMode;
import com.hangout.api.place.Mood;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.OffsetDateTime;
import java.util.List;

/** POST /searches body (SRS 7.2). Also stored as the search's inputs (jsonb). */
@JsonIgnoreProperties(ignoreUnknown = true)
public record SearchRequest(
        @NotNull(message = "Who's coming?") @Valid Party party,
        @NotNull(message = "Add where you start from") @Valid Start start,
        @NotNull(message = "Pick a start time") OffsetDateTime startTime,
        @NotNull @Min(value = 60, message = "At least 1 hour") @Max(value = 480, message = "At most 8 hours") Integer totalMinutes,
        @NotNull(message = "Set a budget") @Min(value = 1, message = "must be > 0") Integer budgetCents,
        @NotNull BudgetBasis budgetBasis,
        @NotNull @Size(min = 1, max = 2, message = "Pick 1 or 2 moods") List<Mood> moods,
        String includePlaceId,
        @Valid Advanced advanced
) {
    public enum PartyType { PARTNER, FRIENDS, SOLO }
    public enum BudgetBasis { TOTAL, PER_PERSON }
    public enum Setting { OUT, IN, ANY }
    public enum Energy { LOW, MEDIUM, HIGH }
    public enum IndoorOutdoor { INDOOR, OUTDOOR, ANY }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Party(@NotNull PartyType type,
                        @Min(value = 1, message = "At least 1 adult") @Max(value = 8, message = "Up to 8 people") int adults,
                        List<@Min(0) @Max(17) Integer> children) {
        public List<Integer> childrenOrEmpty() { return children == null ? List.of() : children; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Start(Double lat, Double lng, @NotBlank(message = "Add where you start from") @Size(max = 200) String label) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Advanced(Setting setting, Energy energy, IndoorOutdoor indoorOutdoor, Boolean quietOnly, Boolean noAlcohol,
                           TravelMode travelMode, @Min(5) @Max(90) Integer maxLegMinutes, String diet,
                           @DecimalMin("0") @DecimalMax("1") Double discovery, Boolean avoidVisited) {}

    public Advanced advancedOrDefault() {
        return advanced == null ? new Advanced(null, null, null, null, null, null, null, null, null, null) : advanced;
    }
}
