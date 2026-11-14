package com.hangout.api.engine;

import com.hangout.api.config.AppProperties;
import org.springframework.stereotype.Component;

/** FR-DATA-4 fallback: straight-line distance × 1.3 at mode speed (walk 3 mph, transit 12 mph, car 20 mph). */
@Component
public class FallbackRoutesClient implements RoutesClient {

    private final AppProperties.Engine cfg;

    public FallbackRoutesClient(AppProperties props) {
        this.cfg = props.engine();
    }

    @Override
    public Leg estimate(double fromLat, double fromLng, double toLat, double toLng, TravelMode mode) {
        double miles = Geo.milesBetween(fromLat, fromLng, toLat, toLng) * cfg.detourFactor();
        double mph = speedMph(mode);
        int minutes = (int) Math.ceil(miles / mph * 60);
        if (mode == TravelMode.TRANSIT && miles > 0.05) minutes += 5; // waiting for the train or bus
        return new Leg(minutes, miles);
    }

    public double speedMph(TravelMode mode) {
        return switch (mode) {
            case WALK -> cfg.walkMph();
            case TRANSIT -> cfg.transitMph();
            case RIDESHARE, CAR -> cfg.carMph();
        };
    }
}
