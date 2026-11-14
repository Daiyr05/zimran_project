package com.hangout.api.place;

import java.util.List;
import java.util.UUID;

public final class PlaceDtos {
    private PlaceDtos() {}

    /** A place inside a plan timeline (SRS 7.2). */
    public record PlaceDto(UUID id, String name, PlaceKind kind, double lat, double lng, Double rating, int reviewCount,
                           Integer priceLevel, String photoUrl, String mapsUrl, String website, boolean hiddenGem,
                           boolean reservable, boolean outdoor) {}

    /** Autocomplete / Moment place. */
    public record PlaceSummary(UUID id, String name, PlaceKind kind, double lat, double lng, String address) {}

    /** Place page (FR-MAP-3). */
    public record PlaceDetail(UUID id, String name, PlaceKind kind, double lat, double lng, Double rating, int reviewCount,
                              Integer priceLevel, String photoUrl, String mapsUrl, String website, boolean hiddenGem,
                              boolean reservable, boolean outdoor, String address, String phone, List<String> hours,
                              List<String> photos, List<?> friendsMoments, List<?> sharedMoments) {}
}
