package com.hangout.api.search;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hangout.api.common.ApiException;
import com.hangout.api.config.AppProperties;
import com.hangout.api.engine.EngineRequest;
import com.hangout.api.engine.PlanDraft;
import com.hangout.api.engine.PlanEngine;
import com.hangout.api.place.Place;
import com.hangout.api.place.PlaceRepository;
import com.hangout.api.search.PlanDtos.*;
import com.hangout.api.session.SessionRepository;
import com.hangout.api.user.Tier;
import com.hangout.api.user.User;
import com.hangout.api.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SearchService {

    private final SearchRepository searches;
    private final PlanRepository plans;
    private final PlaceRepository places;
    private final UserRepository users;
    private final SessionRepository sessions;
    private final PlanEngine engine;
    private final EngineRequestFactory factory;
    private final FriendSignalService signals;
    private final PlanMapper mapper;
    private final ObjectMapper json;
    private final AppProperties props;
    private final ZoneId zone;

    public SearchService(SearchRepository searches, PlanRepository plans, PlaceRepository places, UserRepository users,
                         SessionRepository sessions, PlanEngine engine, EngineRequestFactory factory, FriendSignalService signals,
                         PlanMapper mapper, ObjectMapper json, AppProperties props) {
        this.searches = searches;
        this.plans = plans;
        this.places = places;
        this.users = users;
        this.sessions = sessions;
        this.engine = engine;
        this.factory = factory;
        this.signals = signals;
        this.mapper = mapper;
        this.json = json;
        this.props = props;
        this.zone = ZoneId.of(props.timeZone());
    }

    /* ---------------- quota (FR-SEARCH-6) ---------------- */

    public String monthKey() {
        return YearMonth.now(zone).toString();
    }

    /** null = unlimited (Plus). */
    public Integer searchesLeft(User u) {
        if (u.getTier() == Tier.PLUS) return null;
        long used = searches.countByUserIdAndMonthKey(u.getId(), monthKey());
        return (int) Math.max(0, props.freeSearchesPerMonth() - used);
    }

    /* ---------------- POST /searches ---------------- */

    @Transactional
    public SearchResponse run(UUID userId, SearchRequest req) {
        validateTimes(req);
        User user = users.findById(userId).orElseThrow(() -> ApiException.unauthorized("Sign in to continue."));
        Integer left = searchesLeft(user);
        if (left != null && left <= 0) {
            throw ApiException.quota("You've used your " + props.freeSearchesPerMonth() + " free plans this month.");
        }
        StartDto start = factory.resolveStart(req.start(), user, null);
        long seed = Objects.hash(userId, toJson(req));
        EngineRequest er = factory.build(req, start, userId, Set.of(), seed);
        List<PlanDraft> drafts = engine.generate(er);

        Search s = new Search();
        s.setId(UUID.randomUUID());
        s.setUserId(userId);
        s.setInputs(toJson(req));
        s.setSeed(seed);
        s.setMonthKey(monthKey());
        s.setStartLat(start.lat());
        s.setStartLng(start.lng());
        s.setStartLabel(start.label());
        s.setPartySize(er.people());
        searches.save(s);
        List<Plan> saved = persistPlans(s, drafts);
        Integer leftAfter = left == null ? null : left - 1;
        return new SearchResponse(s.getId(), leftAfter, start, s.getPartySize(), mapper.toDtos(saved, er.friendSignals()));
    }

    /** Also used by sessions (their searches have no user and don't count toward the quota). */
    @Transactional
    public List<Plan> persistPlans(Search s, List<PlanDraft> drafts) {
        List<Plan> out = new ArrayList<>();
        for (int i = 0; i < drafts.size(); i++) out.add(mapper.toEntity(s.getId(), i + 1, drafts.get(i)));
        return plans.saveAll(out);
    }

    /* ---------------- POST /searches/{id}/shuffle (FR-RESULT-11) ---------------- */

    @Transactional
    public SearchResponse shuffle(UUID userId, UUID searchId) {
        Search s = searches.findById(searchId).orElseThrow(() -> ApiException.notFound("Search not found. Search again."));
        requireSearchAccess(userId, s);
        User user = users.findById(userId).orElseThrow();
        SearchRequest req = fromJson(s.getInputs());
        List<Plan> existing = plans.findBySearchIdOrderByRankAsc(searchId);
        Set<UUID> shown = existing.stream().flatMap(p -> p.getStops().stream()).map(PlanStop::getPlaceId).collect(Collectors.toSet());
        UUID include = req.includePlaceId() == null ? null : parseOrNull(req.includePlaceId());
        if (include != null) shown.remove(include);
        long seed = s.getSeed() + existing.size();
        StartDto start = new StartDto(s.getStartLat(), s.getStartLng(), s.getStartLabel());
        EngineRequest er = factory.build(req, start, userId, shown, seed);
        List<PlanDraft> drafts = engine.generate(er);
        List<Plan> saved = persistPlans(s, drafts);
        return new SearchResponse(s.getId(), searchesLeft(user), start, s.getPartySize(), mapper.toDtos(saved, er.friendSignals()));
    }

    /* ---------------- POST /plans/{id}/swap (FR-RESULT-10) ---------------- */

    @Transactional
    public PlanDto swap(UUID userId, UUID planId, int position) {
        Plan plan = plans.findById(planId).orElseThrow(() -> ApiException.notFound("Plan not found. Search again."));
        Search s = searches.findById(plan.getSearchId()).orElseThrow(() -> ApiException.notFound("Plan not found."));
        requireSearchAccess(userId, s);
        if (position < 1 || position > plan.getStops().size()) throw ApiException.validation("position", "No such stop");
        if ("STAY_IN".equals(plan.getShape())) throw ApiException.nothingFits("Stay-in ideas can't be swapped. Shuffle instead.");
        SearchRequest req = fromJson(s.getInputs());
        StartDto start = new StartDto(s.getStartLat(), s.getStartLng(), s.getStartLabel());
        Set<UUID> shown = plans.findBySearchIdOrderByRankAsc(s.getId()).stream()
                .flatMap(p -> p.getStops().stream()).map(PlanStop::getPlaceId).collect(Collectors.toSet());
        EngineRequest er = factory.build(req, start, userId, Set.of(), s.getSeed());
        List<Place> current = orderedPlaces(plan);
        PlanDraft draft = engine.swap(er, plan.getShape(), current, position, shown);
        mapper.fill(plan, draft);
        plans.save(plan);
        return mapper.toDto(plan, er.friendSignals());
    }

    /* ---------------- save (FR-RESULT-12) ---------------- */

    @Transactional
    public void save(UUID userId, UUID planId) {
        User user = users.findById(userId).orElseThrow();
        if (user.getTier() != Tier.PLUS) throw ApiException.plusRequired("Saving plans is a Plus feature.");
        Plan plan = plans.findById(planId).orElseThrow(() -> ApiException.notFound("Plan not found. Search again."));
        Search s = searches.findById(plan.getSearchId()).orElseThrow();
        requireSearchAccess(userId, s);
        if (s.getUserId() == null) {
            // A session plan: copy it into a search of my own so it shows under my saved plans.
            Search mine = new Search();
            mine.setId(UUID.randomUUID());
            mine.setUserId(userId);
            mine.setSessionId(s.getSessionId());
            mine.setInputs(s.getInputs());
            mine.setSeed(s.getSeed());
            mine.setMonthKey("saved");
            mine.setStartLat(s.getStartLat());
            mine.setStartLng(s.getStartLng());
            mine.setStartLabel(s.getStartLabel());
            mine.setPartySize(s.getPartySize());
            searches.save(mine);
            Plan copy = new Plan();
            copy.setId(UUID.randomUUID());
            copy.setSearchId(mine.getId());
            copy.setRank(plan.getRank());
            copy.setShape(plan.getShape());
            copy.setTotalMinutes(plan.getTotalMinutes());
            copy.setTotalCents(plan.getTotalCents());
            copy.setPerPersonCents(plan.getPerPersonCents());
            copy.setPlacesCents(plan.getPlacesCents());
            copy.setTaxCents(plan.getTaxCents());
            copy.setTipCents(plan.getTipCents());
            copy.setTravelCents(plan.getTravelCents());
            copy.setReasons(plan.getReasons());
            for (PlanStop st : plan.getStops()) {
                PlanStop c = new PlanStop();
                c.setId(UUID.randomUUID()); c.setPosition(st.getPosition()); c.setPlaceId(st.getPlaceId());
                c.setArriveAt(st.getArriveAt()); c.setDepartAt(st.getDepartAt()); c.setEstCostCents(st.getEstCostCents());
                copy.getStops().add(c);
            }
            for (PlanLeg l : plan.getLegs()) {
                PlanLeg c = new PlanLeg();
                c.setId(UUID.randomUUID()); c.setPosition(l.getPosition()); c.setFromLabel(l.getFromLabel()); c.setToLabel(l.getToLabel());
                c.setMode(l.getMode()); c.setMinutes(l.getMinutes()); c.setEstCostCents(l.getEstCostCents());
                copy.getLegs().add(c);
            }
            plan = copy;
        }
        if (!plan.isSaved()) {
            plan.setSaved(true);
            plan.setSavedAt(OffsetDateTime.now());
        }
        plans.save(plan);
    }

    @Transactional(readOnly = true)
    public List<SavedPlan> saved(UUID userId) {
        List<Plan> list = plans.findSavedByUser(userId);
        Map<UUID, Search> byId = searches.findAllById(list.stream().map(Plan::getSearchId).collect(Collectors.toSet())).stream()
                .collect(Collectors.toMap(Search::getId, s -> s));
        Map<UUID, EngineRequest.FriendSignal> fs = signals.forViewer(userId).best();
        List<PlanDto> dtos = mapper.toDtos(list, fs);
        List<SavedPlan> out = new ArrayList<>();
        for (int i = 0; i < list.size(); i++) {
            Plan p = list.get(i);
            Search s = byId.get(p.getSearchId());
            out.add(new SavedPlan(dtos.get(i), new StartDto(s.getStartLat(), s.getStartLng(), s.getStartLabel()), s.getPartySize(),
                    p.getSavedAt(), fromJson(s.getInputs())));
        }
        return out;
    }

    /* ---------------- helpers ---------------- */

    private void requireSearchAccess(UUID userId, Search s) {
        if (s.getUserId() != null) {
            if (!s.getUserId().equals(userId)) throw ApiException.forbidden("That plan isn't yours.");
            return;
        }
        if (s.getSessionId() != null) {
            boolean member = sessions.findById(s.getSessionId())
                    .map(ses -> ses.getOrganizerId().equals(userId) || ses.getMembers().stream().anyMatch(m -> userId.equals(m.getUserId())))
                    .orElse(false);
            if (!member) throw ApiException.forbidden("That plan isn't yours.");
        }
    }

    private List<Place> orderedPlaces(Plan plan) {
        Map<UUID, Place> map = places.findAllById(plan.getStops().stream().map(PlanStop::getPlaceId).toList()).stream()
                .collect(Collectors.toMap(Place::getId, p -> p));
        return plan.getStops().stream().map(s -> map.get(s.getPlaceId())).toList();
    }

    /** FR-SEARCH-5: start time within the next 7 days (a few minutes of clock skew allowed). */
    public void validateTimes(SearchRequest req) {
        OffsetDateTime now = OffsetDateTime.now();
        if (req.startTime().isBefore(now.minusMinutes(30))) throw ApiException.validation("startTime", "That time has passed. Pick a later one.");
        if (req.startTime().isAfter(now.plusDays(7).plusHours(1))) throw ApiException.validation("startTime", "Pick a day within the next 7 days");
    }

    public String toJson(Object o) {
        try {
            return json.writeValueAsString(o);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    public SearchRequest fromJson(String s) {
        try {
            return json.readValue(s, SearchRequest.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    private static UUID parseOrNull(String s) {
        try { return UUID.fromString(s); } catch (IllegalArgumentException e) { return null; }
    }
}
