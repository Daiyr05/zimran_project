package com.hangout.api.engine;

import com.hangout.api.place.Mood;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Everything the engine needs for one search, already resolved (geocoded start, friends' signals, exclusions). */
public record EngineRequest(
        List<Mood> moods,
        OffsetDateTime startTime,
        int totalMinutes,
        /** Whole-group budget in cents. */
        int budgetCents,
        int adults,
        int children,
        double startLat,
        double startLng,
        String startLabel,
        Setting setting,
        MoodMap.Energy energy,
        IndoorOutdoor indoorOutdoor,
        boolean quietOnly,
        boolean noAlcohol,
        TravelMode travelMode,
        int maxLegMinutes,
        String diet,
        double discovery,
        boolean avoidVisited,
        UUID includePlaceId,
        /** Places already shown in this search (shuffle) — never repeated. */
        Set<UUID> excludePlaceIds,
        /** Places the user has posted a Moment about (for avoidVisited). */
        Set<UUID> visitedPlaceIds,
        /** Best friend Moment per place, for the F score and the badge. */
        Map<UUID, FriendSignal> friendSignals,
        /** Places a friend rated ≤ 2: removed (SRS 5.3). */
        Set<UUID> friendVetoed,
        long seed
) {
    public enum Setting { OUT, IN, ANY }
    public enum IndoorOutdoor { INDOOR, OUTDOOR, ANY }

    public record FriendSignal(String name, int rating, int spentCents, UUID momentId) {}

    /** Each child counts as 0.5 of an adult (SRS 5.7). */
    public double adultEquivalents() {
        return adults + 0.5 * children;
    }

    public int people() {
        return adults + children;
    }

    public int budgetPerPersonCents() {
        return (int) Math.floor(budgetCents / Math.max(1.0, adultEquivalents()));
    }
}
