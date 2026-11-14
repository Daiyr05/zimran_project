package com.hangout.api.search;

import com.hangout.api.engine.TravelMode;
import com.hangout.api.place.PlaceDtos.PlaceDto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/** Plan shapes exactly as SRS 7.2 and the frontend's src/api/types.ts expect them. */
public final class PlanDtos {
    private PlanDtos() {}

    public interface TimelineItem {}

    public record LegItem(String type, TravelMode mode, int minutes, int costCents, String from, String to) implements TimelineItem {
        public static LegItem of(PlanLeg l) {
            return new LegItem("LEG", l.getMode(), l.getMinutes(), l.getEstCostCents(), l.getFromLabel(), l.getToLabel());
        }
    }

    public record FriendSignalDto(String name, int rating, int spentCents, UUID momentId) {}

    public record StopItem(String type, int position, OffsetDateTime arriveAt, OffsetDateTime departAt, int estCostCents,
                           PlaceDto place, FriendSignalDto friendSignal, Integer rainChancePct) implements TimelineItem {}

    public record CostBreakdown(int placesCents, int taxCents, int tipCents, int travelCents) {}

    public record PlanDto(UUID id, int rank, String shape, int totalMinutes, int totalCents, int perPersonCents,
                          CostBreakdown costBreakdown, List<String> reasons, List<TimelineItem> timeline) {}

    public record StartDto(double lat, double lng, String label) {}

    public record SearchResponse(UUID searchId, Integer searchesLeft, StartDto start, int partySize, List<PlanDto> plans) {}

    public record SavedPlan(PlanDto plan, StartDto start, int partySize, OffsetDateTime savedAt, SearchRequest inputs) {}

    public record SwapRequest(@jakarta.validation.constraints.NotNull @jakarta.validation.constraints.Min(1) @jakarta.validation.constraints.Max(3) Integer position) {}
}
