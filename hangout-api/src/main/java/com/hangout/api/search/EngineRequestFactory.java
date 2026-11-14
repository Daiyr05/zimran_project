package com.hangout.api.search;

import com.hangout.api.config.AppProperties;
import com.hangout.api.engine.EngineRequest;
import com.hangout.api.engine.MoodMap;
import com.hangout.api.engine.TravelMode;
import com.hangout.api.search.PlanDtos.StartDto;
import com.hangout.api.search.SearchRequest.Advanced;
import com.hangout.api.user.User;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Turns the API request into what the engine needs: resolved start, defaults, friends' signals. */
@Component
public class EngineRequestFactory {

    private final AppProperties props;
    private final FriendSignalService signals;

    public EngineRequestFactory(AppProperties props, FriendSignalService signals) {
        this.props = props;
        this.signals = signals;
    }

    /**
     * FR-SEARCH-3: lat/lng from the browser, or a typed address. Without Google Geocoding (seed mode) a typed
     * address resolves to the user's home location, else the demo city center; the label is kept as typed.
     */
    public StartDto resolveStart(SearchRequest.Start start, User user, StartDto fallback) {
        String label = start.label() == null || start.label().isBlank() ? "Home" : start.label().trim();
        if (start.lat() != null && start.lng() != null) return new StartDto(start.lat(), start.lng(), label);
        if (fallback != null) return new StartDto(fallback.lat(), fallback.lng(), label);
        if (user != null && user.getHomeLat() != null && user.getHomeLng() != null) {
            return new StartDto(user.getHomeLat(), user.getHomeLng(), label);
        }
        return new StartDto(props.city().centerLat(), props.city().centerLng(), label);
    }

    public EngineRequest build(SearchRequest req, StartDto start, UUID viewerId, Set<UUID> exclude, long seed) {
        Advanced a = req.advancedOrDefault();
        int adults = req.party().adults();
        int children = req.party().childrenOrEmpty().size();
        double adultEq = adults + 0.5 * children;
        int budgetTotal = req.budgetBasis() == SearchRequest.BudgetBasis.PER_PERSON
                ? (int) Math.round(req.budgetCents() * adultEq)
                : req.budgetCents();
        FriendSignalService.Signals fs = signals.forViewer(viewerId);
        UUID include = parseUuid(req.includePlaceId());
        return new EngineRequest(
                req.moods() == null ? List.of() : req.moods(),
                req.startTime(),
                req.totalMinutes(),
                budgetTotal,
                adults,
                children,
                start.lat(), start.lng(), start.label(),
                a.setting() == null ? EngineRequest.Setting.OUT : EngineRequest.Setting.valueOf(a.setting().name()),
                a.energy() == null ? MoodMap.Energy.MEDIUM : MoodMap.Energy.valueOf(a.energy().name()),
                a.indoorOutdoor() == null ? EngineRequest.IndoorOutdoor.ANY : EngineRequest.IndoorOutdoor.valueOf(a.indoorOutdoor().name()),
                Boolean.TRUE.equals(a.quietOnly()),
                Boolean.TRUE.equals(a.noAlcohol()),
                a.travelMode() == null ? TravelMode.TRANSIT : a.travelMode(),
                a.maxLegMinutes() == null ? props.engine().defaultMaxLegMinutes() : a.maxLegMinutes(),
                a.diet(),
                a.discovery() == null ? 0.5 : a.discovery(),
                !Boolean.FALSE.equals(a.avoidVisited()),
                include,
                exclude == null ? Set.of() : exclude,
                signals.visitedPlaces(viewerId),
                fs.best(),
                fs.vetoed(),
                seed);
    }

    private static UUID parseUuid(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return UUID.fromString(s);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
