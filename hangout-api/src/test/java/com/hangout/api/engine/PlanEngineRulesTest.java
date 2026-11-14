package com.hangout.api.engine;

import com.hangout.api.place.Mood;
import com.hangout.api.place.OpeningHours;
import com.hangout.api.place.PlaceKind;
import org.junit.jupiter.api.Test;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PlanEngineRulesTest {

    @Test
    void shapesFollowAvailableTime() {
        assertEquals(List.of(PlaceKind.ACTIVITY), PlanEngine.shapesFor(90).get(0));
        assertEquals(3, PlanEngine.shapesFor(90).size());
        assertEquals(List.of(PlaceKind.ACTIVITY, PlaceKind.DINNER), PlanEngine.shapesFor(240).get(0));
        assertEquals(List.of(PlaceKind.ACTIVITY, PlaceKind.DINNER, PlaceKind.TREAT), PlanEngine.shapesFor(300).get(0));
        assertEquals("ACTIVITY_DINNER", PlanEngine.shapeName(List.of(PlaceKind.ACTIVITY, PlaceKind.DINNER)));
    }

    @Test
    void moodMapGivesTypeScores() {
        assertEquals(1.0, MoodMap.typeScore("bowling_alley", Mood.PLAYFUL));
        assertEquals(0.0, MoodMap.typeScore("bowling_alley", Mood.ROMANTIC));
        assertEquals(PlaceKind.TREAT, MoodMap.info("tea_house").kind());
        assertEquals(90, MoodMap.info("fine_dining_restaurant").visitMinutes());
    }

    @Test
    void openingHoursHandleClosingPastMidnight() {
        String json = "[null,{\"open\":\"17:00\",\"close\":\"23:00\"},{\"open\":\"17:00\",\"close\":\"23:00\"},{\"open\":\"17:00\",\"close\":\"23:00\"}," +
                "{\"open\":\"17:00\",\"close\":\"01:00\"},{\"open\":\"12:00\",\"close\":\"01:00\"},{\"open\":\"12:00\",\"close\":\"22:00\"}]";
        OpeningHours h = OpeningHours.parse(json);
        ZoneId z = ZoneId.of("America/New_York");
        ZonedDateTime fri = ZonedDateTime.of(2026, 11, 20, 23, 30, 0, 0, z); // Friday
        assertTrue(h.isOpenFor(fri, fri.plusMinutes(60)));            // 23:30 → 00:30, closes 01:00
        assertFalse(h.isOpenFor(fri, fri.plusMinutes(120)));          // would end 01:30
        ZonedDateTime mon = ZonedDateTime.of(2026, 11, 16, 19, 0, 0, 0, z);
        assertFalse(h.isOpenFor(mon, mon.plusMinutes(30)));           // closed Monday
        ZonedDateTime sat = ZonedDateTime.of(2026, 11, 21, 0, 15, 0, 0, z); // just after Friday midnight
        assertTrue(h.isOpenFor(sat, sat.plusMinutes(30)));            // still Friday's window
        assertEquals("5:00 PM – 1:00 AM", h.humanLines().get(4));
        assertEquals("Closed", h.humanLines().get(0));
    }

    @Test
    void fallbackTravelUsesModeSpeedAndDetour() {
        FallbackRoutesClient routes = new FallbackRoutesClient(CostCalculatorTest.props());
        RoutesClient.Leg walk = routes.estimate(40.7265, -73.9815, 40.7223, -73.9873, TravelMode.WALK);
        RoutesClient.Leg car = routes.estimate(40.7265, -73.9815, 40.7223, -73.9873, TravelMode.CAR);
        assertTrue(walk.miles() > 0.4 && walk.miles() < 0.6);
        assertTrue(walk.minutes() > car.minutes());
        assertEquals((int) Math.ceil(walk.miles() / 3 * 60), walk.minutes());
    }

    @Test
    void scoreWeightsSumToOne() {
        PlanEngine.Candidate c = new PlanEngine.Candidate(null, MoodMap.info("bowling_alley"), 1, 1, 1, 1, 0);
        assertEquals(0.80, c.staticScore(), 1e-9); // 0.35 + 0.20 + 0.15 + 0.10; B and T add 0.10 each at assembly time
    }
}
