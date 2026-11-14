package com.hangout.api.engine;

import com.hangout.api.common.ApiException;
import com.hangout.api.config.AppProperties;
import com.hangout.api.engine.EngineRequest.IndoorOutdoor;
import com.hangout.api.engine.EngineRequest.Setting;
import com.hangout.api.engine.MoodMap.Energy;
import com.hangout.api.engine.MoodMap.TypeInfo;
import com.hangout.api.engine.PlanDraft.Cost;
import com.hangout.api.engine.PlanDraft.Leg;
import com.hangout.api.engine.PlanDraft.Stop;
import com.hangout.api.place.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * SRS section 5: a deterministic plan engine. Filter candidate places, score them, assemble 1–3 stops
 * into a timeline that fits the time limit, then price it. No AI model.
 */
@Service
public class PlanEngine {

    private static final Logger log = LoggerFactory.getLogger(PlanEngine.class);
    private static final int PLANS_WANTED = 3;

    private final PlaceRepository places;
    private final PlaceMoodRepository placeMoods;
    private final RoutesClient routes;
    private final FallbackRoutesClient speeds;
    private final CostCalculator costs;
    private final PlaceMapper placeMapper;
    private final AppProperties props;
    private final ZoneId zone;

    public PlanEngine(PlaceRepository places, PlaceMoodRepository placeMoods, RoutesClient routes, FallbackRoutesClient speeds,
                      CostCalculator costs, PlaceMapper placeMapper, AppProperties props) {
        this.places = places;
        this.placeMoods = placeMoods;
        this.routes = routes;
        this.speeds = speeds;
        this.costs = costs;
        this.placeMapper = placeMapper;
        this.props = props;
        this.zone = ZoneId.of(props.timeZone());
    }

    /** A place that passed the hard filters, with the static parts of its score (SRS 5.3). */
    public record Candidate(Place place, TypeInfo info, double mood, double rating, double friend, double discovery, int costPerPersonCents) {
        double staticScore() {
            return 0.35 * mood + 0.20 * rating + 0.15 * friend + 0.10 * discovery;
        }
    }

    /* ---------------- public API ---------------- */

    public List<PlanDraft> generate(EngineRequest req) {
        long t0 = System.currentTimeMillis();
        if (req.setting() == Setting.IN) {
            List<PlanDraft> stayIn = generateStayIn(req);
            log.info("search done: setting=IN plans={} took={}ms", stayIn.size(), System.currentTimeMillis() - t0);
            return stayIn;
        }

        CandidatePool pool = candidates(req);
        Random rnd = new Random(req.seed());
        Set<UUID> usedAcrossPlans = new HashSet<>();
        List<PlanDraft> plans = new ArrayList<>();
        boolean timeFailed = false;

        for (List<PlaceKind> shape : shapesFor(req.totalMinutes())) {
            if (plans.size() >= PLANS_WANTED) break;
            Assembled a = assemble(req, shape, pool, usedAcrossPlans, rnd);
            if (a == null) {
                timeFailed = true;
                continue;
            }
            PlanDraft plan = fitBudget(req, a, pool, usedAcrossPlans);
            if (plan == null) continue;
            plans.add(plan);
            plan.stops().forEach(s -> usedAcrossPlans.add(s.place().getId()));
        }

        log.info("search done: moods={} minutes={} budget={} mode={} candidates={}/{} plans={} took={}ms fallbackRoutes=true",
                req.moods(), req.totalMinutes(), req.budgetCents(), req.travelMode(), pool.size(), pool.loaded,
                plans.size(), System.currentTimeMillis() - t0);

        if (plans.isEmpty()) throw ApiException.nothingFits(nothingFitsMessage(req, pool, timeFailed));
        plans.sort(Comparator.comparingDouble((PlanDraft p) -> -averageScore(p)));
        return plans;
    }

    /** FR-RESULT-10: next-best place of the same kind at {@code position}; the timeline and cost recompute. */
    public PlanDraft swap(EngineRequest req, String shape, List<Place> currentPlaces, int position, Set<UUID> exclude) {
        if (position < 1 || position > currentPlaces.size()) throw ApiException.validation("position", "No such stop");
        Place current = currentPlaces.get(position - 1);
        CandidatePool pool = candidates(req);
        Set<UUID> taken = new HashSet<>(exclude);
        currentPlaces.forEach(p -> taken.add(p.getId()));
        List<Candidate> options = pool.byKind.getOrDefault(current.getKind(), List.of()).stream()
                .filter(c -> !taken.contains(c.place().getId()))
                .sorted(Comparator.comparingDouble((Candidate c) -> -c.staticScore()))
                .toList();
        for (Candidate c : options) {
            List<Candidate> picks = new ArrayList<>();
            for (int i = 0; i < currentPlaces.size(); i++) {
                picks.add(i == position - 1 ? c : pool.lookup(currentPlaces.get(i)));
            }
            if (picks.contains(null)) continue;
            Assembled a = timeline(req, shape, picks);
            if (a == null) continue;
            PlanDraft plan = finish(req, a);
            if (plan.cost().totalCents() <= req.budgetCents()) return plan;
        }
        throw ApiException.nothingFits("No other place of this kind fits your time and budget.");
    }

    /** Recompute a plan for a fixed list of places (used when a saved plan is reloaded). */
    public PlanDraft rebuild(EngineRequest req, String shape, List<Place> placesInOrder) {
        CandidatePool pool = candidates(req);
        List<Candidate> picks = placesInOrder.stream().map(p -> {
            Candidate c = pool.lookup(p);
            return c != null ? c : candidateOf(p, req, Map.of());
        }).toList();
        Assembled a = timeline(req, shape, picks);
        if (a == null) throw ApiException.nothingFits("This plan no longer fits the time limit.");
        return finish(req, a);
    }

    /* ---------------- candidates (5.1 steps 1–3) ---------------- */

    private class CandidatePool {
        final Map<PlaceKind, List<Candidate>> byKind = new EnumMap<>(PlaceKind.class);
        final Map<UUID, Candidate> byId = new HashMap<>();
        int loaded;
        int inRange;
        int overBudget;

        void add(Candidate c) {
            byKind.computeIfAbsent(c.place().getKind(), k -> new ArrayList<>()).add(c);
            byId.put(c.place().getId(), c);
        }

        int size() { return byId.size(); }

        Candidate lookup(Place p) { return byId.get(p.getId()); }
    }

    private CandidatePool candidates(EngineRequest req) {
        double radiusMiles = Math.max(0.5, req.maxLegMinutes() / 60.0 * speeds.speedMph(req.travelMode()));
        double box = radiusMiles * 2; // later stops may be up to one leg beyond the first
        List<Place> loaded = places.findInBox(
                req.startLat() - box * Geo.latDegreesPerMile(), req.startLat() + box * Geo.latDegreesPerMile(),
                req.startLng() - box * Geo.lngDegreesPerMile(req.startLat()), req.startLng() + box * Geo.lngDegreesPerMile(req.startLat()));
        if (req.includePlaceId() != null && loaded.stream().noneMatch(p -> p.getId().equals(req.includePlaceId()))) {
            places.findById(req.includePlaceId()).ifPresent(loaded::add);
        }
        Map<UUID, Map<Mood, Double>> moodScores = placeMoods.findByPlaceIdIn(loaded.stream().map(Place::getId).toList()).stream()
                .collect(Collectors.groupingBy(PlaceMood::getPlaceId,
                        Collectors.toMap(PlaceMood::getMood, PlaceMood::finalScore, (a, b) -> a, () -> new EnumMap<>(Mood.class))));

        CandidatePool pool = new CandidatePool();
        pool.loaded = loaded.size();
        int perPersonBudget = req.budgetPerPersonCents();
        for (Place p : loaded) {
            boolean forced = p.getId().equals(req.includePlaceId());
            if (!forced && Geo.milesBetween(req.startLat(), req.startLng(), p.getLat(), p.getLng()) > box) continue;
            pool.inRange++;
            if (!forced && !passesHardFilters(p, req)) continue;
            int perPerson = MoodMap.costPerPersonCents(p.getPrimaryType(), p.getPriceLevel());
            if (!forced && perPerson > perPersonBudget) {
                pool.overBudget++;
                continue;
            }
            pool.add(candidateOf(p, req, moodScores.getOrDefault(p.getId(), Map.of())));
        }
        return pool;
    }

    /** SRS 5.1 step 2: hard filters. */
    private boolean passesHardFilters(Place p, EngineRequest req) {
        TypeInfo info = MoodMap.info(p.getPrimaryType());
        if (req.excludePlaceIds().contains(p.getId())) return false;
        if (req.friendVetoed().contains(p.getId())) return false;
        if (req.avoidVisited() && req.visitedPlaceIds().contains(p.getId())) return false;
        if (req.children() > 0 && !p.isKidFriendly()) return false;
        if (req.noAlcohol() && p.isServesAlcohol()) return false;
        if (req.quietOnly() && info.loud()) return false;
        if (req.indoorOutdoor() == IndoorOutdoor.INDOOR && p.isOutdoor()) return false;
        if (req.indoorOutdoor() == IndoorOutdoor.OUTDOOR && p.getKind() == PlaceKind.ACTIVITY && !p.isOutdoor()) return false;
        if (req.diet() != null && (req.diet().equalsIgnoreCase("VEGETARIAN") || req.diet().equalsIgnoreCase("VEGAN"))
                && p.getKind() == PlaceKind.DINNER && !p.isVegetarian()) return false;
        if (p.getKind() == PlaceKind.ACTIVITY) {
            if (req.energy() == Energy.LOW && info.energy() == Energy.HIGH) return false;
            if (req.energy() == Energy.HIGH && info.energy() == Energy.LOW) return false;
        }
        return true;
    }

    private Candidate candidateOf(Place p, EngineRequest req, Map<Mood, Double> moodScores) {
        TypeInfo info = MoodMap.info(p.getPrimaryType());
        double mood = req.moods().isEmpty() ? 0.5 : req.moods().stream()
                .mapToDouble(m -> moodScores.getOrDefault(m, 0.7 * MoodMap.typeScore(p.getPrimaryType(), m)))
                .average().orElse(0);
        double rating = p.getRating() == null ? 0.5 : clamp((p.getRating() - 3) / 2);
        EngineRequest.FriendSignal fs = req.friendSignals().get(p.getId());
        double friend = fs == null ? 0 : fs.rating() >= 4 ? 1 : fs.rating() == 3 ? 0.5 : 0;
        double discovery = placeMapper.isHiddenGem(p) ? req.discovery() : 0;
        return new Candidate(p, info, mood, rating, friend, discovery, MoodMap.costPerPersonCents(p.getPrimaryType(), p.getPriceLevel()));
    }

    /* ---------------- shapes (5.4) ---------------- */

    static List<List<PlaceKind>> shapesFor(int totalMinutes) {
        List<List<PlaceKind>> three = List.of(
                List.of(PlaceKind.ACTIVITY, PlaceKind.DINNER, PlaceKind.TREAT),
                List.of(PlaceKind.DINNER, PlaceKind.ACTIVITY, PlaceKind.TREAT),
                List.of(PlaceKind.ACTIVITY, PlaceKind.ACTIVITY, PlaceKind.DINNER));
        List<List<PlaceKind>> two = List.of(
                List.of(PlaceKind.ACTIVITY, PlaceKind.DINNER),
                List.of(PlaceKind.DINNER, PlaceKind.TREAT),
                List.of(PlaceKind.ACTIVITY, PlaceKind.TREAT));
        List<List<PlaceKind>> one = List.of(
                List.of(PlaceKind.ACTIVITY),
                List.of(PlaceKind.DINNER),
                List.of(PlaceKind.TREAT));
        List<List<PlaceKind>> out = new ArrayList<>();
        // Shorter shapes follow as fallbacks so a search still returns 3 plans when a long shape can't be filled.
        if (totalMinutes > 240) { out.addAll(three); out.addAll(two); out.addAll(one); }
        else if (totalMinutes > 120) { out.addAll(two); out.addAll(one); }
        else out.addAll(one);
        return out;
    }

    static String shapeName(List<PlaceKind> kinds) {
        return kinds.stream().map(Enum::name).collect(Collectors.joining("_"));
    }

    /* ---------------- assembly (5.1 step 5) + timeline (5.5) ---------------- */

    private record Assembled(String shape, List<Candidate> picks, List<Stop> stops, List<Leg> legs, int totalMinutes) {}

    private Assembled assemble(EngineRequest req, List<PlaceKind> shape, CandidatePool pool, Set<UUID> usedAcross, Random rnd) {
        List<Candidate> picks = new ArrayList<>();
        double curLat = req.startLat(), curLng = req.startLng();
        OffsetDateTime curTime = req.startTime();
        int elapsed = 0;
        int slotBudget = Math.max(1, req.budgetPerPersonCents() / shape.size());
        boolean includeUsed = req.includePlaceId() == null;

        for (PlaceKind kind : shape) {
            Candidate best = null;
            double bestScore = -1;
            for (Candidate c : pool.byKind.getOrDefault(kind, List.of())) {
                UUID id = c.place().getId();
                boolean forced = !includeUsed && id.equals(req.includePlaceId());
                if (!forced && (usedAcross.contains(id) || picks.stream().anyMatch(p -> p.place().getId().equals(id)))) continue;
                RoutesClient.Leg leg = routes.estimate(curLat, curLng, c.place().getLat(), c.place().getLng(), req.travelMode());
                if (!forced && leg.minutes() > req.maxLegMinutes()) continue;
                OffsetDateTime arrive = curTime.plusMinutes(leg.minutes());
                OffsetDateTime depart = arrive.plusMinutes(c.info().visitMinutes());
                RoutesClient.Leg home = routes.estimate(c.place().getLat(), c.place().getLng(), req.startLat(), req.startLng(), req.travelMode());
                if (elapsed + leg.minutes() + c.info().visitMinutes() + home.minutes() > req.totalMinutes()) continue;
                if (!isOpen(c.place(), arrive, depart)) continue;
                double budgetFit = clamp(1 - (double) c.costPerPersonCents() / slotBudget);
                double travel = clamp(1 - (double) leg.minutes() / Math.max(1, req.maxLegMinutes()));
                double score = c.staticScore() + 0.10 * budgetFit + 0.10 * travel + rnd.nextDouble() * 1e-6;
                if (forced) score = 10; // "Plan with this place" (FR-MAP-3)
                if (score > bestScore) {
                    bestScore = score;
                    best = c;
                }
            }
            if (best == null) break; // fewer stops than the shape (FR-RESULT-1)
            if (best.place().getId().equals(req.includePlaceId())) includeUsed = true;
            RoutesClient.Leg leg = routes.estimate(curLat, curLng, best.place().getLat(), best.place().getLng(), req.travelMode());
            picks.add(best);
            curTime = curTime.plusMinutes(leg.minutes() + best.info().visitMinutes());
            elapsed += leg.minutes() + best.info().visitMinutes();
            curLat = best.place().getLat();
            curLng = best.place().getLng();
        }
        if (picks.isEmpty()) return null;
        return timeline(req, shapeName(picks.stream().map(c -> c.place().getKind()).toList()), picks);
    }

    /** SRS 5.5: legs and clock times for a fixed ordered list of places; null when over time or a stop is closed. */
    private Assembled timeline(EngineRequest req, String shape, List<Candidate> picks) {
        List<Stop> stops = new ArrayList<>();
        List<Leg> legs = new ArrayList<>();
        double curLat = req.startLat(), curLng = req.startLng();
        String curLabel = req.startLabel();
        OffsetDateTime curTime = req.startTime();
        int total = 0;
        for (int i = 0; i < picks.size(); i++) {
            Candidate c = picks.get(i);
            Place p = c.place();
            RoutesClient.Leg leg = routes.estimate(curLat, curLng, p.getLat(), p.getLng(), req.travelMode());
            legs.add(new Leg(i + 1, curLabel, p.getName(), req.travelMode(), leg.minutes(),
                    costs.legCostCents(req.travelMode(), leg.minutes(), leg.miles(), req), leg.miles()));
            OffsetDateTime arrive = curTime.plusMinutes(leg.minutes());
            OffsetDateTime depart = arrive.plusMinutes(c.info().visitMinutes());
            if (!isOpen(p, arrive, depart)) return null;
            stops.add(new Stop(i + 1, p, arrive, depart, costs.stopCostCents(p, req), c.staticScore()));
            total += leg.minutes() + c.info().visitMinutes();
            curTime = depart;
            curLat = p.getLat();
            curLng = p.getLng();
            curLabel = p.getName();
        }
        RoutesClient.Leg home = routes.estimate(curLat, curLng, req.startLat(), req.startLng(), req.travelMode());
        legs.add(new Leg(picks.size() + 1, curLabel, req.startLabel(), req.travelMode(), home.minutes(),
                costs.legCostCents(req.travelMode(), home.minutes(), home.miles(), req), home.miles()));
        total += home.minutes();
        if (total > req.totalMinutes()) return null;
        return new Assembled(shape, picks, stops, legs, total);
    }

    private boolean isOpen(Place p, OffsetDateTime arrive, OffsetDateTime depart) {
        ZonedDateTime a = arrive.atZoneSameInstant(zone);
        ZonedDateTime d = depart.atZoneSameInstant(zone);
        return OpeningHours.parse(p.getOpeningHours()).isOpenFor(a, d);
    }

    /* ---------------- pricing (5.7) and budget fit ---------------- */

    private PlanDraft finish(EngineRequest req, Assembled a) {
        Cost cost = costs.price(a.stops(), a.legs(), req);
        return new PlanDraft(a.shape(), a.stops(), a.legs(), a.totalMinutes(), cost, reasons(req, a, cost));
    }

    /** If over budget, replace the most expensive stop with a cheaper one of the same kind; drop the plan if it still doesn't fit. */
    private PlanDraft fitBudget(EngineRequest req, Assembled a, CandidatePool pool, Set<UUID> usedAcross) {
        PlanDraft plan = finish(req, a);
        for (int attempt = 0; attempt < 3 && plan.cost().totalCents() > req.budgetCents(); attempt++) {
            final Assembled cur = a;
            Stop priciest = plan.stops().stream().max(Comparator.comparingInt(Stop::estCostCents)).orElseThrow();
            int idx = priciest.position() - 1;
            Candidate current = cur.picks().get(idx);
            Set<UUID> taken = new HashSet<>(usedAcross);
            cur.picks().forEach(c -> taken.add(c.place().getId()));
            Optional<Candidate> cheaper = pool.byKind.getOrDefault(current.place().getKind(), List.of()).stream()
                    .filter(c -> !taken.contains(c.place().getId()) && c.costPerPersonCents() < current.costPerPersonCents())
                    .sorted(Comparator.comparingDouble((Candidate c) -> -c.staticScore()))
                    .filter(c -> {
                        List<Candidate> picks = new ArrayList<>(cur.picks());
                        picks.set(idx, c);
                        return timeline(req, cur.shape(), picks) != null;
                    })
                    .findFirst();
            if (cheaper.isEmpty()) {
                // Nothing cheaper of that kind: try dropping the last stop when there is more than one.
                if (a.picks().size() > 1) {
                    List<Candidate> shorter = new ArrayList<>(a.picks().subList(0, a.picks().size() - 1));
                    Assembled s = timeline(req, shapeName(shorter.stream().map(c -> c.place().getKind()).toList()), shorter);
                    if (s != null) { a = s; plan = finish(req, a); continue; }
                }
                return null;
            }
            List<Candidate> picks = new ArrayList<>(a.picks());
            picks.set(idx, cheaper.get());
            a = timeline(req, a.shape(), picks);
            plan = finish(req, a);
        }
        return plan.cost().totalCents() <= req.budgetCents() ? plan : null;
    }

    /* ---------------- reasons (FR-RESULT-8) ---------------- */

    private List<String> reasons(EngineRequest req, Assembled a, Cost cost) {
        List<String> out = new ArrayList<>();
        if (req.includePlaceId() != null) {
            a.stops().stream().filter(s -> s.place().getId().equals(req.includePlaceId())).findFirst()
                    .ifPresent(s -> out.add("Includes " + s.place().getName() + ", as you asked"));
        }
        double moodAvg = a.picks().stream().mapToDouble(Candidate::mood).average().orElse(0);
        if (!req.moods().isEmpty() && moodAvg >= 0.45) {
            out.add("Matches " + req.moods().stream().map(Mood::title).collect(Collectors.joining(" and ")));
        }
        for (Stop s : a.stops()) {
            EngineRequest.FriendSignal fs = req.friendSignals().get(s.place().getId());
            if (fs != null && fs.rating() >= 3) {
                out.add(fs.name() + " rated " + s.place().getName() + " " + fs.rating() + "/5");
                break;
            }
        }
        int under = req.budgetCents() - cost.totalCents();
        if (under > 0) out.add(String.format("$%d.%02d under budget", under / 100, under % 100));
        a.stops().stream().filter(s -> placeMapper.isHiddenGem(s.place())).findFirst()
                .ifPresent(s -> out.add("Hidden gem: " + s.place().getName()));
        if (!a.legs().isEmpty() && a.legs().stream().allMatch(l -> l.mode() == TravelMode.WALK)) out.add("All on foot");
        if (out.isEmpty()) out.add("Highest-rated picks near you");
        return out.subList(0, Math.min(3, out.size()));
    }

    /* ---------------- stay in (5.4) ---------------- */

    private List<PlanDraft> generateStayIn(EngineRequest req) {
        List<Place> ideas = places.findByPrimaryType("stay_in");
        if (ideas.isEmpty()) throw ApiException.nothingFits("No stay-in ideas are loaded. Try an evening out instead.");
        Map<UUID, Map<Mood, Double>> moodScores = placeMoods.findByPlaceIdIn(ideas.stream().map(Place::getId).toList()).stream()
                .collect(Collectors.groupingBy(PlaceMood::getPlaceId,
                        Collectors.toMap(PlaceMood::getMood, PlaceMood::finalScore, (x, y) -> x, () -> new EnumMap<>(Mood.class))));
        Random rnd = new Random(req.seed());
        List<Candidate> ranked = ideas.stream()
                .filter(p -> !req.excludePlaceIds().contains(p.getId()))
                .map(p -> candidateOf(p, req, moodScores.getOrDefault(p.getId(), Map.of())))
                .filter(c -> c.costPerPersonCents() <= req.budgetPerPersonCents())
                .sorted(Comparator.comparingDouble((Candidate c) -> -(c.staticScore() + rnd.nextDouble() * 0.05)))
                .toList();
        List<PlanDraft> plans = new ArrayList<>();
        int visit = Math.min(req.totalMinutes(), 180);
        for (Candidate c : ranked) {
            if (plans.size() >= PLANS_WANTED) break;
            OffsetDateTime depart = req.startTime().plusMinutes(visit);
            List<Stop> stops = List.of(new Stop(1, c.place(), req.startTime(), depart, costs.stopCostCents(c.place(), req), c.staticScore()));
            Cost cost = costs.price(stops, List.of(), req);
            if (cost.totalCents() > req.budgetCents()) continue;
            List<String> reasons = new ArrayList<>();
            reasons.add("A night in: " + c.place().getName());
            if (!req.moods().isEmpty() && c.mood() >= 0.45)
                reasons.add("Matches " + req.moods().stream().map(Mood::title).collect(Collectors.joining(" and ")));
            int under = req.budgetCents() - cost.totalCents();
            if (under > 0) reasons.add(String.format("$%d.%02d under budget", under / 100, under % 100));
            plans.add(new PlanDraft("STAY_IN", stops, List.of(), visit, cost, reasons));
        }
        if (plans.isEmpty()) throw ApiException.nothingFits("No stay-in idea fits your budget. Try raising the budget.");
        return plans;
    }

    /* ---------------- helpers ---------------- */

    private String nothingFitsMessage(EngineRequest req, CandidatePool pool, boolean timeFailed) {
        if (pool.inRange == 0) return "No places within " + req.maxLegMinutes() + " minutes of your starting point. Allow a longer trip per leg.";
        if (pool.size() == 0 && pool.overBudget > 0) return "Nothing fits this budget. Try raising your budget.";
        if (pool.size() == 0) return "Your filters rule out every place nearby. Relax a filter or pick other moods.";
        if (timeFailed || req.totalMinutes() <= 120) return "Not enough time for a stop and the trip home. Add time.";
        return "No plan fits your budget and time together. Try raising your budget or adding time.";
    }

    private static double averageScore(PlanDraft p) {
        return p.stops().stream().mapToDouble(Stop::score).average().orElse(0);
    }

    static double clamp(double v) {
        return Math.max(0, Math.min(1, v));
    }
}
