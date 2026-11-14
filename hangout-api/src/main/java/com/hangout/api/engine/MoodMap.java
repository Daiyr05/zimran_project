package com.hangout.api.engine;

import com.hangout.api.place.Mood;
import com.hangout.api.place.PlaceKind;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.hangout.api.place.Mood.*;

/**
 * SRS 5.2: no places API has a mood field, so each Google place type maps to moods, a kind,
 * a default visit length and a default per-person cost (SRS 5.7) by hand.
 */
public final class MoodMap {
    private MoodMap() {}

    public enum Energy { LOW, MEDIUM, HIGH }

    public record TypeInfo(PlaceKind kind, List<Mood> moods, int visitMinutes, int defaultCostCents,
                           boolean foodOrDrink, boolean loud, Energy energy) {}

    private static final TypeInfo FINE_DINING = new TypeInfo(PlaceKind.DINNER, List.of(ROMANTIC, FANCY), 90, 6000, true, false, Energy.LOW);
    private static final TypeInfo RESTAURANT = new TypeInfo(PlaceKind.DINNER, List.of(COZY, CHILL), 75, 3000, true, false, Energy.LOW);
    private static final TypeInfo CAFE = new TypeInfo(PlaceKind.TREAT, List.of(COZY, CHILL), 40, 1000, true, false, Energy.LOW);
    private static final TypeInfo DESSERT = new TypeInfo(PlaceKind.TREAT, List.of(COZY, PLAYFUL), 30, 800, true, false, Energy.LOW);
    private static final TypeInfo BAR = new TypeInfo(PlaceKind.ACTIVITY, List.of(PLAYFUL, CHILL), 60, 2500, true, true, Energy.MEDIUM);
    private static final TypeInfo GAMES = new TypeInfo(PlaceKind.ACTIVITY, List.of(PLAYFUL, ACTIVE), 60, 2000, false, true, Energy.HIGH);
    private static final TypeInfo MUSEUM = new TypeInfo(PlaceKind.ACTIVITY, List.of(CULTURAL, CHILL), 90, 2000, false, false, Energy.LOW);
    private static final TypeInfo THEATER = new TypeInfo(PlaceKind.ACTIVITY, List.of(COZY, CULTURAL), 130, 1800, false, false, Energy.LOW);
    private static final TypeInfo PARK = new TypeInfo(PlaceKind.ACTIVITY, List.of(ADVENTUROUS, CHILL, ACTIVE), 45, 0, false, false, Energy.MEDIUM);
    private static final TypeInfo NIGHTLIFE = new TypeInfo(PlaceKind.ACTIVITY, List.of(PLAYFUL), 90, 3000, true, true, Energy.HIGH);
    private static final TypeInfo STAY_IN = new TypeInfo(PlaceKind.ACTIVITY, List.of(COZY, CHILL), 120, 1500, false, false, Energy.LOW);

    private static final Map<String, TypeInfo> TYPES = Map.ofEntries(
            Map.entry("fine_dining_restaurant", FINE_DINING),
            Map.entry("wine_bar", new TypeInfo(PlaceKind.DINNER, List.of(ROMANTIC, FANCY), 90, 4500, true, false, Energy.LOW)),
            Map.entry("restaurant", RESTAURANT),
            Map.entry("ramen_restaurant", RESTAURANT),
            Map.entry("pizza_restaurant", RESTAURANT),
            Map.entry("italian_restaurant", RESTAURANT),
            Map.entry("mexican_restaurant", RESTAURANT),
            Map.entry("indian_restaurant", RESTAURANT),
            Map.entry("japanese_restaurant", RESTAURANT),
            Map.entry("thai_restaurant", RESTAURANT),
            Map.entry("vietnamese_restaurant", RESTAURANT),
            Map.entry("korean_restaurant", RESTAURANT),
            Map.entry("chinese_restaurant", RESTAURANT),
            Map.entry("mediterranean_restaurant", RESTAURANT),
            Map.entry("american_restaurant", RESTAURANT),
            Map.entry("sushi_restaurant", RESTAURANT),
            Map.entry("steak_house", new TypeInfo(PlaceKind.DINNER, List.of(FANCY, COZY), 90, 5000, true, false, Energy.LOW)),
            Map.entry("vegetarian_restaurant", RESTAURANT),
            Map.entry("vegan_restaurant", RESTAURANT),
            Map.entry("seafood_restaurant", RESTAURANT),
            Map.entry("cafe", CAFE),
            Map.entry("coffee_shop", CAFE),
            Map.entry("tea_house", CAFE),
            Map.entry("dessert_shop", DESSERT),
            Map.entry("ice_cream_shop", DESSERT),
            Map.entry("bakery", DESSERT),
            Map.entry("dessert_restaurant", DESSERT),
            Map.entry("chocolate_shop", DESSERT),
            Map.entry("bar", BAR),
            Map.entry("pub", BAR),
            Map.entry("bowling_alley", GAMES),
            Map.entry("amusement_center", GAMES),
            Map.entry("video_arcade", GAMES),
            Map.entry("ice_skating_rink", new TypeInfo(PlaceKind.ACTIVITY, List.of(ACTIVE, PLAYFUL), 60, 2000, false, false, Energy.HIGH)),
            Map.entry("museum", MUSEUM),
            Map.entry("art_gallery", new TypeInfo(PlaceKind.ACTIVITY, List.of(CULTURAL, CHILL), 60, 1000, false, false, Energy.LOW)),
            Map.entry("art_studio", new TypeInfo(PlaceKind.ACTIVITY, List.of(CULTURAL, PLAYFUL), 90, 4500, false, false, Energy.MEDIUM)),
            Map.entry("planetarium", new TypeInfo(PlaceKind.ACTIVITY, List.of(CULTURAL, ADVENTUROUS), 90, 2500, false, false, Energy.LOW)),
            Map.entry("movie_theater", THEATER),
            Map.entry("performing_arts_theater", new TypeInfo(PlaceKind.ACTIVITY, List.of(COZY, CULTURAL), 130, 4500, false, false, Energy.LOW)),
            Map.entry("park", PARK),
            Map.entry("hiking_area", PARK),
            Map.entry("botanical_garden", new TypeInfo(PlaceKind.ACTIVITY, List.of(ADVENTUROUS, CHILL, ACTIVE), 60, 1500, false, false, Energy.MEDIUM)),
            Map.entry("karaoke", NIGHTLIFE),
            Map.entry("comedy_club", NIGHTLIFE),
            Map.entry("night_club", NIGHTLIFE),
            Map.entry("spa", new TypeInfo(PlaceKind.ACTIVITY, List.of(CHILL, FANCY), 90, 6000, false, false, Energy.LOW)),
            Map.entry("book_store", new TypeInfo(PlaceKind.ACTIVITY, List.of(COZY, CULTURAL), 45, 1500, false, false, Energy.LOW)),
            Map.entry("stay_in", STAY_IN)
    );

    private static final TypeInfo UNKNOWN = new TypeInfo(PlaceKind.ACTIVITY, List.of(CHILL), 60, 2000, false, false, Energy.MEDIUM);

    public static TypeInfo info(String primaryType) {
        return TYPES.getOrDefault(primaryType == null ? "" : primaryType, UNKNOWN);
    }

    public static boolean isKnown(String primaryType) {
        return TYPES.containsKey(primaryType);
    }

    public static Set<String> knownTypes() {
        return TYPES.keySet();
    }

    /** Type-based mood score 0–1 for one mood (the 70% part of SRS 5.2). */
    public static double typeScore(String primaryType, Mood mood) {
        return info(primaryType).moods().contains(mood) ? 1.0 : 0.0;
    }

    /** SRS 5.7: Google priceLevel → per-person cost; no price level → the type default. */
    public static int costPerPersonCents(String primaryType, Integer priceLevel) {
        if (priceLevel == null) return info(primaryType).defaultCostCents();
        return switch (priceLevel) {
            case 0 -> 0;
            case 1 -> 1500;
            case 2 -> 3000;
            case 3 -> 6000;
            default -> 10000;
        };
    }
}
