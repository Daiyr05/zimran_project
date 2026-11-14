package com.hangout.api.engine;

/** Travel time between two points (FR-DATA-4). The Google Routes implementation can replace the fallback later. */
public interface RoutesClient {
    record Leg(int minutes, double miles) {}

    Leg estimate(double fromLat, double fromLng, double toLat, double toLng, TravelMode mode);
}
