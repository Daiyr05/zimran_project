package com.hangout.api.session;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hangout.api.common.ApiException;
import com.hangout.api.config.AppProperties;
import com.hangout.api.engine.EngineRequest;
import com.hangout.api.engine.PlanDraft;
import com.hangout.api.engine.PlanEngine;
import com.hangout.api.place.Mood;
import com.hangout.api.search.*;
import com.hangout.api.search.PlanDtos.PlanDto;
import com.hangout.api.search.PlanDtos.StartDto;
import com.hangout.api.session.SessionDtos.*;
import com.hangout.api.user.User;
import com.hangout.api.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

/** SRS 4.4 invite and vote. */
@Service
public class SessionService {

    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final SessionRepository sessions;
    private final VoteRepository votes;
    private final UserRepository users;
    private final SearchRepository searches;
    private final PlanRepository plans;
    private final SearchService searchService;
    private final EngineRequestFactory factory;
    private final FriendSignalService signals;
    private final PlanEngine engine;
    private final PlanMapper mapper;
    private final ObjectMapper json;
    private final AppProperties props;

    public SessionService(SessionRepository sessions, VoteRepository votes, UserRepository users, SearchRepository searches,
                          PlanRepository plans, SearchService searchService, EngineRequestFactory factory, FriendSignalService signals,
                          PlanEngine engine, PlanMapper mapper, ObjectMapper json, AppProperties props) {
        this.sessions = sessions;
        this.votes = votes;
        this.users = users;
        this.searches = searches;
        this.plans = plans;
        this.searchService = searchService;
        this.factory = factory;
        this.signals = signals;
        this.engine = engine;
        this.mapper = mapper;
        this.json = json;
        this.props = props;
    }

    /* ---------------- create / join ---------------- */

    /** FR-INVITE-1 */
    @Transactional
    public CreateSessionResponse create(UUID userId, SearchRequest inputs) {
        searchService.validateTimes(inputs);
        User organizer = users.findById(userId).orElseThrow(() -> ApiException.unauthorized("Sign in to continue."));
        Session s = new Session();
        s.setId(UUID.randomUUID());
        s.setCode(newCode());
        s.setOrganizerId(userId);
        s.setOrganizerInputs(toJson(inputs));
        s.setExpiresAt(OffsetDateTime.now().plusHours(props.sessionTtlHours()));
        SessionMember m = newMember(organizer.getName(), userId, true);
        double adultEq = inputs.party().adults() + 0.5 * inputs.party().childrenOrEmpty().size();
        int perPerson = inputs.budgetBasis() == SearchRequest.BudgetBasis.TOTAL
                ? (int) Math.floor(inputs.budgetCents() / Math.max(1.0, adultEq)) : inputs.budgetCents();
        m.setInputs(toJson(new MemberInputs(inputs.moods(), inputs.totalMinutes(), perPerson, inputs.start())));
        m.setHasAnswered(true);
        s.getMembers().add(m);
        sessions.save(s);
        return new CreateSessionResponse(s.getCode(), props.frontendUrl().replaceAll("/+$", "") + "/s/" + s.getCode());
    }

    /** FR-INVITE-2: join without an account. */
    @Transactional
    public JoinResponse join(String code, UUID userIdOrNull, String displayName) {
        Session s = load(code);
        if (s.getStatus() == Session.Status.CLOSED) throw ApiException.conflict("Voting has already closed.");
        SessionMember m = newMember(displayName.trim(), userIdOrNull, false);
        s.getMembers().add(m);
        sessions.save(s);
        return new JoinResponse(m.getMemberToken(), m.getId());
    }

    /* ---------------- read ---------------- */

    @Transactional(readOnly = true)
    public SessionView view(String code, String memberToken, UUID userIdOrNull) {
        Session s = load(code);
        return view(s, caller(s, memberToken, userIdOrNull));
    }

    /* ---------------- inputs / generate / votes / close ---------------- */

    @Transactional
    public SessionView putInputs(String code, String memberToken, UUID userIdOrNull, MemberInputs inputs) {
        Session s = load(code);
        SessionMember me = requireMember(s, memberToken, userIdOrNull);
        if (s.getStatus() != Session.Status.OPEN) throw ApiException.conflict("Plans are already generated.");
        me.setInputs(toJson(inputs));
        me.setHasAnswered(true);
        sessions.save(s);
        return view(s, me);
    }

    /** FR-INVITE-4: blend inputs (SRS 5.6) and generate 3 plans. */
    @Transactional
    public SessionView generate(String code, String memberToken, UUID userIdOrNull) {
        Session s = load(code);
        SessionMember me = requireMember(s, memberToken, userIdOrNull);
        if (!me.isOrganizer()) throw ApiException.forbidden("Only the organizer can generate plans.");
        if (s.getStatus() != Session.Status.OPEN) throw ApiException.conflict("Plans are already generated.");

        SearchRequest organizer = fromJson(s.getOrganizerInputs(), SearchRequest.class);
        User organizerUser = users.findById(s.getOrganizerId()).orElse(null);
        List<SessionMember> answered = s.getMembers().stream().filter(SessionMember::isHasAnswered).toList();
        List<MemberInputs> inputs = answered.stream().map(m -> fromJson(m.getInputs(), MemberInputs.class)).toList();

        // Blend (SRS 5.6)
        List<Mood> moods = blendMoods(inputs);
        int minutes = inputs.stream().mapToInt(MemberInputs::totalMinutes).min().orElse(organizer.totalMinutes());
        int budgetPerPerson = inputs.stream().mapToInt(MemberInputs::budgetCents).min().orElse(organizer.budgetCents());
        StartDto organizerStart = factory.resolveStart(organizer.start(), organizerUser, null);
        List<StartDto> starts = inputs.stream().map(i -> factory.resolveStart(i.start(), null, organizerStart)).toList();
        double lat = starts.stream().mapToDouble(StartDto::lat).average().orElse(organizerStart.lat());
        double lng = starts.stream().mapToDouble(StartDto::lng).average().orElse(organizerStart.lng());
        StartDto meeting = new StartDto(lat, lng, starts.size() > 1 ? "Meeting point" : organizerStart.label());
        int adults = Math.max(s.getMembers().size(), 1);
        SearchRequest blended = new SearchRequest(
                new SearchRequest.Party(adults > 2 ? SearchRequest.PartyType.FRIENDS : organizer.party().type(), adults, organizer.party().childrenOrEmpty()),
                new SearchRequest.Start(meeting.lat(), meeting.lng(), meeting.label()),
                organizer.startTime(), minutes, budgetPerPerson, SearchRequest.BudgetBasis.PER_PERSON, moods,
                organizer.includePlaceId(), organizer.advanced());

        long seed = Objects.hash(s.getId(), minutes, budgetPerPerson, moods);
        EngineRequest er = factory.build(blended, meeting, s.getOrganizerId(), Set.of(), seed);
        List<PlanDraft> drafts = engine.generate(er);

        Search search = new Search();
        search.setId(UUID.randomUUID());
        search.setSessionId(s.getId());
        search.setInputs(toJson(blended));
        search.setSeed(seed);
        search.setMonthKey(searchService.monthKey());
        search.setStartLat(meeting.lat());
        search.setStartLng(meeting.lng());
        search.setStartLabel(meeting.label());
        search.setPartySize(er.people());
        searches.save(search);
        List<Plan> saved = searchService.persistPlans(search, drafts);
        // Add the group reasons the demo script calls for.
        for (Plan p : saved) {
            List<String> reasons = new ArrayList<>();
            reasons.add(String.format("Fits everyone's budget: under $%d each", (int) Math.ceil(budgetPerPerson / 100.0)));
            reasons.add("Shared mood: " + moods.stream().map(Mood::title).collect(Collectors.joining(" and ")));
            for (String r : p.getReasons()) if (reasons.size() < 3 && !r.startsWith("Matches")) reasons.add(r);
            p.setReasons(reasons.toArray(String[]::new));
        }
        plans.saveAll(saved);

        s.setSearchId(search.getId());
        s.setStatus(Session.Status.GENERATED);
        s.setGeneratedAt(OffsetDateTime.now());
        sessions.save(s);
        return view(s, me);
    }

    /** FR-INVITE-5: one vote set per member, editable until closed. */
    @Transactional
    public SessionView putVotes(String code, String memberToken, UUID userIdOrNull, VotesRequest body) {
        Session s = load(code);
        SessionMember me = requireMember(s, memberToken, userIdOrNull);
        if (s.getStatus() != Session.Status.GENERATED) throw ApiException.conflict("Voting is not open.");
        Set<UUID> planIds = plans.findBySearchIdOrderByRankAsc(s.getSearchId()).stream().map(Plan::getId).collect(Collectors.toSet());
        votes.deleteByMemberId(me.getId());
        for (VoteItem v : body.votes()) {
            if (!planIds.contains(v.planId())) throw ApiException.validation("votes", "Unknown plan " + v.planId());
            Vote vote = new Vote();
            vote.setId(UUID.randomUUID());
            vote.setSessionId(s.getId());
            vote.setMemberId(me.getId());
            vote.setPlanId(v.planId());
            vote.setLiked(v.liked());
            votes.save(vote);
        }
        return view(s, me);
    }

    /** FR-INVITE-7: most likes wins; a tie goes to the organizer's pick, then to plan rank. */
    @Transactional
    public SessionView close(String code, String memberToken, UUID userIdOrNull) {
        Session s = load(code);
        SessionMember me = requireMember(s, memberToken, userIdOrNull);
        if (!me.isOrganizer()) throw ApiException.forbidden("Only the organizer can close voting.");
        if (s.getStatus() != Session.Status.GENERATED) throw ApiException.conflict("Nothing to close yet.");
        List<Plan> list = plans.findBySearchIdOrderByRankAsc(s.getSearchId());
        List<Vote> all = votes.findBySessionId(s.getId());
        Map<UUID, Long> likes = all.stream().filter(Vote::isLiked).collect(Collectors.groupingBy(Vote::getPlanId, Collectors.counting()));
        long best = list.stream().mapToLong(p -> likes.getOrDefault(p.getId(), 0L)).max().orElse(0);
        List<Plan> tied = list.stream().filter(p -> likes.getOrDefault(p.getId(), 0L) == best).toList();
        Set<UUID> organizerLikes = all.stream().filter(v -> v.getMemberId().equals(me.getId()) && v.isLiked()).map(Vote::getPlanId).collect(Collectors.toSet());
        Plan winner = tied.stream().filter(p -> organizerLikes.contains(p.getId())).findFirst().orElse(tied.get(0));
        s.setWinningPlanId(winner.getId());
        s.setStatus(Session.Status.CLOSED);
        sessions.save(s);
        return view(s, me);
    }

    /** FR-INVITE-8: .ics for the final plan. */
    @Transactional(readOnly = true)
    public String calendar(String code, String memberToken, UUID userIdOrNull) {
        Session s = load(code);
        requireMember(s, memberToken, userIdOrNull);
        if (s.getWinningPlanId() == null) throw ApiException.conflict("No final plan yet.");
        Plan plan = plans.findById(s.getWinningPlanId()).orElseThrow(() -> ApiException.notFound("Plan not found."));
        PlanDto dto = mapper.toDto(plan, Map.of());
        return IcsBuilder.build(s.getCode(), dto);
    }

    /* ---------------- helpers ---------------- */

    private Session load(String code) {
        Session s = sessions.findByCode(code.toUpperCase()).orElseThrow(() -> ApiException.notFound("We couldn't find this invite. Check the link."));
        if (OffsetDateTime.now().isAfter(s.getExpiresAt())) throw ApiException.sessionExpired(); // FR-INVITE-9
        return s;
    }

    /** The member token wins; a signed-in user matches by user id (the organizer or someone who joined while signed in). */
    private SessionMember caller(Session s, String memberToken, UUID userId) {
        if (memberToken != null && !memberToken.isBlank()) {
            return s.getMembers().stream().filter(m -> memberToken.equals(m.getMemberToken())).findFirst().orElse(null);
        }
        if (userId != null) {
            return s.getMembers().stream().filter(m -> userId.equals(m.getUserId())).findFirst().orElse(null);
        }
        return null;
    }

    private SessionMember requireMember(Session s, String memberToken, UUID userId) {
        SessionMember m = caller(s, memberToken, userId);
        if (m == null) throw ApiException.unauthorized("Join the invite first.");
        return m;
    }

    private SessionView view(Session s, SessionMember me) {
        List<Vote> all = votes.findBySessionId(s.getId());
        Set<UUID> voted = all.stream().map(Vote::getMemberId).collect(Collectors.toSet());
        List<MemberView> members = s.getMembers().stream()
                .map(m -> new MemberView(m.getId(), m.getDisplayName(), m.isOrganizer(), m.isHasAnswered(), voted.contains(m.getId())))
                .toList();
        List<PlanDto> planDtos = null;
        StartDto start = null;
        Map<UUID, Integer> likes = new LinkedHashMap<>();
        if (s.getSearchId() != null) {
            List<Plan> list = plans.findBySearchIdOrderByRankAsc(s.getSearchId());
            UUID viewer = me == null ? null : me.getUserId();
            planDtos = mapper.toDtos(list, signals.forViewer(viewer).best());
            Search search = searches.findById(s.getSearchId()).orElse(null);
            if (search != null) start = new StartDto(search.getStartLat(), search.getStartLng(), search.getStartLabel());
            for (Plan p : list) likes.put(p.getId(), (int) all.stream().filter(v -> v.isLiked() && v.getPlanId().equals(p.getId())).count());
        }
        String organizerName = s.getMembers().stream().filter(SessionMember::isOrganizer).map(SessionMember::getDisplayName).findFirst().orElse("Organizer");
        MeView meView = null;
        if (me != null) {
            Map<UUID, Boolean> myVotes = new LinkedHashMap<>();
            all.stream().filter(v -> v.getMemberId().equals(me.getId())).forEach(v -> myVotes.put(v.getPlanId(), v.isLiked()));
            meView = new MeView(me.getId(), me.isOrganizer(), me.isHasAnswered(), myVotes);
        }
        return new SessionView(s.getCode(), s.getStatus(), organizerName, s.getExpiresAt(), members, planDtos, start,
                s.getMembers().size(), likes, s.getWinningPlanId(), meView);
    }

    /** Moods chosen by everyone; if none shared, the 2 moods chosen most often (SRS 5.6). */
    static List<Mood> blendMoods(List<MemberInputs> inputs) {
        List<List<Mood>> lists = inputs.stream().map(MemberInputs::moods).filter(l -> l != null && !l.isEmpty()).toList();
        if (lists.isEmpty()) return List.of(Mood.CHILL);
        Set<Mood> shared = new LinkedHashSet<>(lists.get(0));
        for (List<Mood> l : lists) shared.retainAll(l);
        if (!shared.isEmpty()) return new ArrayList<>(shared);
        Map<Mood, Long> counts = lists.stream().flatMap(List::stream).collect(Collectors.groupingBy(m -> m, LinkedHashMap::new, Collectors.counting()));
        return counts.entrySet().stream().sorted((a, b) -> Long.compare(b.getValue(), a.getValue())).limit(2).map(Map.Entry::getKey).toList();
    }

    private SessionMember newMember(String displayName, UUID userId, boolean organizer) {
        SessionMember m = new SessionMember();
        m.setId(UUID.randomUUID());
        m.setUserId(userId);
        m.setDisplayName(displayName.length() > 30 ? displayName.substring(0, 30) : displayName);
        m.setOrganizer(organizer);
        m.setMemberToken(randomString(32));
        return m;
    }

    private String newCode() {
        String code;
        do code = randomString(8); while (sessions.existsByCode(code));
        return code;
    }

    private static String randomString(int n) {
        StringBuilder sb = new StringBuilder(n);
        for (int i = 0; i < n; i++) sb.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
        return sb.toString();
    }

    private String toJson(Object o) {
        try { return json.writeValueAsString(o); } catch (JsonProcessingException e) { throw new IllegalStateException(e); }
    }

    private <T> T fromJson(String s, Class<T> type) {
        try { return json.readValue(s, type); } catch (JsonProcessingException e) { throw new IllegalStateException(e); }
    }
}
