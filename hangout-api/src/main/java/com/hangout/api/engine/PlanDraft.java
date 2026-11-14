package com.hangout.api.engine;

import com.hangout.api.place.Place;

import java.time.OffsetDateTime;
import java.util.List;

/** An assembled, timed and priced plan before it is stored. */
public record PlanDraft(String shape, List<Stop> stops, List<Leg> legs, int totalMinutes, Cost cost, List<String> reasons) {

    public record Stop(int position, Place place, OffsetDateTime arriveAt, OffsetDateTime departAt, int estCostCents, double score) {}

    public record Leg(int position, String fromLabel, String toLabel, TravelMode mode, int minutes, int costCents, double miles) {}

    public record Cost(int placesCents, int taxCents, int tipCents, int travelCents, int totalCents, int perPersonCents) {}
}
