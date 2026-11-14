package com.hangout.api.engine;

import com.hangout.api.config.AppProperties;
import com.hangout.api.place.Place;
import org.springframework.stereotype.Component;

import java.util.List;

/** SRS 5.7: plan total = place costs + tax + tip + travel, shown for the group and per person. Integer cents throughout (AT-3). */
@Component
public class CostCalculator {

    private final AppProperties props;

    public CostCalculator(AppProperties props) {
        this.props = props;
    }

    /** Group cost of one stop: per-person cost × adult equivalents. */
    public int stopCostCents(Place place, EngineRequest req) {
        int perPerson = MoodMap.costPerPersonCents(place.getPrimaryType(), place.getPriceLevel());
        return (int) Math.round(perPerson * req.adultEquivalents());
    }

    public boolean isFoodOrDrink(Place place) {
        return MoodMap.info(place.getPrimaryType()).foodOrDrink();
    }

    /** Group cost of one leg for the whole party. */
    public int legCostCents(TravelMode mode, int minutes, double miles, EngineRequest req) {
        AppProperties.Engine e = props.engine();
        return switch (mode) {
            case WALK -> 0;
            case TRANSIT -> miles < 0.05 ? 0 : e.transitFareCents() * req.people();
            case RIDESHARE -> miles < 0.05 ? 0 : (int) Math.round(e.rideshareBaseCents() + e.ridesharePerMileCents() * miles
                    + e.ridesharePerMinuteCents() * minutes);
            case CAR -> (int) Math.round(e.carCostPerMileCents() * miles);
        };
    }

    public PlanDraft.Cost price(List<PlanDraft.Stop> stops, List<PlanDraft.Leg> legs, EngineRequest req) {
        int places = 0;
        int tipBase = 0;
        for (PlanDraft.Stop s : stops) {
            places += s.estCostCents();
            if (isFoodOrDrink(s.place())) tipBase += s.estCostCents();
        }
        int tax = (int) Math.round(places * props.city().salesTaxRate());
        int tip = (int) Math.round(tipBase * props.city().tipRate());
        int travel = 0;
        for (PlanDraft.Leg l : legs) travel += l.costCents();
        if (req.travelMode() == TravelMode.CAR) travel += props.engine().parkingPerStopCents() * stops.size();
        int total = places + tax + tip + travel;
        int perPerson = (int) Math.ceil(total / Math.max(1.0, req.adultEquivalents()));
        return new PlanDraft.Cost(places, tax, tip, travel, total, perPerson);
    }
}
