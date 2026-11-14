package com.hangout.api.moment;

import com.hangout.api.engine.MoodMap;
import com.hangout.api.place.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/** SRS 5.2: the 30% Moment part of a place's mood score = share of its Moments that chose the mood. */
@Service
public class PlaceMoodUpdater {

    private final PlaceRepository places;
    private final PlaceMoodRepository placeMoods;
    private final MomentRepository moments;

    public PlaceMoodUpdater(PlaceRepository places, PlaceMoodRepository placeMoods, MomentRepository moments) {
        this.places = places;
        this.placeMoods = placeMoods;
        this.moments = moments;
    }

    @Transactional
    public void recompute(UUID placeId) {
        Place place = places.findById(placeId).orElse(null);
        if (place == null) return;
        List<Moment> list = moments.findByPlaceId(placeId).stream().filter(m -> !m.isHidden()).toList();
        Map<Mood, Long> counts = new EnumMap<>(Mood.class);
        for (Moment m : list) for (Mood mood : m.getMoods()) counts.merge(mood, 1L, Long::sum);
        Map<Mood, PlaceMood> existing = new EnumMap<>(Mood.class);
        placeMoods.findByPlaceId(placeId).forEach(pm -> existing.put(pm.getMood(), pm));
        for (Mood mood : Mood.values()) {
            PlaceMood pm = existing.computeIfAbsent(mood, k -> {
                PlaceMood n = new PlaceMood();
                n.setId(UUID.randomUUID());
                n.setPlaceId(placeId);
                n.setMood(k);
                n.setTypeScore(MoodMap.typeScore(place.getPrimaryType(), k));
                return n;
            });
            pm.setMomentScore(list.isEmpty() ? 0 : (double) counts.getOrDefault(mood, 0L) / list.size());
            placeMoods.save(pm);
        }
    }
}
