package com.hangout.api.engine;

import com.hangout.api.config.AppProperties;
import com.hangout.api.place.Mood;
import com.hangout.api.place.Place;
import com.hangout.api.place.PlaceKind;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class CostCalculatorTest {

    static AppProperties props() {
        return new AppProperties("http://localhost:8080", "http://localhost:5173", List.of(), "America/New_York",
                new AppProperties.Jwt("x".repeat(40), 24), new AppProperties.Uploads("./uploads"), true, 3, 48,
                new AppProperties.Google(false, "", ""), new AppProperties.Stripe(""),
                new AppProperties.City(40.7265, -73.9815, 0.08875, 0.20),
                new AppProperties.Engine(15, 3, 12, 20, 1.3, 290, 300, 200, 40, 30, 0, 4.5, 200));
    }

    static EngineRequest request(int adults, int children, TravelMode mode) {
        return new EngineRequest(List.of(Mood.PLAYFUL, Mood.COZY), OffsetDateTime.parse("2026-11-20T18:30:00-05:00"), 240, 12000,
                adults, children, 40.7265, -73.9815, "Home", EngineRequest.Setting.OUT, MoodMap.Energy.MEDIUM,
                EngineRequest.IndoorOutdoor.ANY, false, false, mode, 20, null, 0.5, true, null, Set.of(), Set.of(), Map.of(), Set.of(), 1L);
    }

    static Place place(String type, Integer priceLevel) {
        Place p = new Place();
        p.setId(UUID.randomUUID());
        p.setName(type);
        p.setPrimaryType(type);
        p.setPriceLevel(priceLevel);
        p.setKind(MoodMap.info(type).kind());
        return p;
    }

    @Test
    void totalEqualsPlacesPlusTaxPlusTipPlusTravelToTheCent() {
        CostCalculator calc = new CostCalculator(props());
        EngineRequest req = request(2, 0, TravelMode.TRANSIT);
        Place lanes = place("bowling_alley", 2);   // $30 pp -> $60 for two, not food
        Place dinner = place("restaurant", 2);     // $30 pp -> $60 for two, food -> tip
        List<PlanDraft.Stop> stops = List.of(
                new PlanDraft.Stop(1, lanes, req.startTime(), req.startTime().plusMinutes(60), calc.stopCostCents(lanes, req), 0),
                new PlanDraft.Stop(2, dinner, req.startTime(), req.startTime().plusMinutes(60), calc.stopCostCents(dinner, req), 0));
        List<PlanDraft.Leg> legs = List.of(
                new PlanDraft.Leg(1, "Home", "a", TravelMode.TRANSIT, 14, calc.legCostCents(TravelMode.TRANSIT, 14, 1.2, req), 1.2),
                new PlanDraft.Leg(2, "a", "b", TravelMode.TRANSIT, 9, calc.legCostCents(TravelMode.TRANSIT, 9, 0.4, req), 0.4),
                new PlanDraft.Leg(3, "b", "Home", TravelMode.TRANSIT, 18, calc.legCostCents(TravelMode.TRANSIT, 18, 1.5, req), 1.5));
        PlanDraft.Cost cost = calc.price(stops, legs, req);
        assertEquals(12000, cost.placesCents());
        assertEquals(Math.round(12000 * 0.08875), cost.taxCents());
        assertEquals(1200, cost.tipCents()); // 20% of the $60 dinner only
        assertEquals(3 * 290 * 2, cost.travelCents());
        assertEquals(cost.placesCents() + cost.taxCents() + cost.tipCents() + cost.travelCents(), cost.totalCents()); // AT-3
        assertEquals((int) Math.ceil(cost.totalCents() / 2.0), cost.perPersonCents());
    }

    @Test
    void childrenCountAsHalfAnAdultAndWalkingIsFree() {
        CostCalculator calc = new CostCalculator(props());
        EngineRequest req = request(2, 2, TravelMode.WALK);
        Place park = place("park", null);
        assertEquals(0, calc.stopCostCents(park, req));
        Place museum = place("museum", null); // $20 default
        assertEquals(Math.round(2000 * 3.0), calc.stopCostCents(museum, req));
        assertEquals(0, calc.legCostCents(TravelMode.WALK, 20, 1.0, req));
    }

    @Test
    void priceLevelsFollowTheSrsTable() {
        assertEquals(0, MoodMap.costPerPersonCents("restaurant", 0));
        assertEquals(1500, MoodMap.costPerPersonCents("restaurant", 1));
        assertEquals(3000, MoodMap.costPerPersonCents("restaurant", 2));
        assertEquals(6000, MoodMap.costPerPersonCents("restaurant", 3));
        assertEquals(10000, MoodMap.costPerPersonCents("restaurant", 4));
        assertEquals(2000, MoodMap.costPerPersonCents("bowling_alley", null));
    }
}
