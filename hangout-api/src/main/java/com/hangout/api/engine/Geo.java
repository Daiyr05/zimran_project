package com.hangout.api.engine;

public final class Geo {
    private Geo() {}

    private static final double EARTH_RADIUS_MILES = 3958.8;

    public static double milesBetween(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    /** Degrees of latitude per mile, and of longitude per mile at a given latitude. */
    public static double latDegreesPerMile() { return 1 / 69.0; }
    public static double lngDegreesPerMile(double lat) { return 1 / (69.0 * Math.cos(Math.toRadians(lat))); }
}
