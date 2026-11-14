package com.hangout.api.moment;

import com.hangout.api.common.ApiException;
import com.hangout.api.friend.FriendGraph;
import com.hangout.api.moment.MomentDtos.*;
import com.hangout.api.place.Place;
import com.hangout.api.place.PlaceMapper;
import com.hangout.api.place.PlaceRepository;
import com.hangout.api.place.PlaceDtos.PlaceSummary;
import com.hangout.api.search.Plan;
import com.hangout.api.search.PlanRepository;
import com.hangout.api.search.PlanStop;
import com.hangout.api.user.User;
import com.hangout.api.user.UserRepository;
import com.hangout.api.user.Visibility;
import com.hangout.api.user.UserDtos.UserSummary;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

/** SRS 4.6 Moments, 4.5 feed, 4.7 map pins. */
@Service
public class MomentService {

    private static final int PAGE_SIZE = 20;
    private static final int REPORTS_TO_HIDE = 3;

    private final MomentRepository moments;
    private final ReportRepository reports;
    private final PlaceRepository places;
    private final PlaceMapper placeMapper;
    private final PlanRepository plans;
    private final UserRepository users;
    private final FriendGraph graph;
    private final PlaceMoodUpdater moodUpdater;
    private final UploadService uploads;

    public MomentService(MomentRepository moments, ReportRepository reports, PlaceRepository places, PlaceMapper placeMapper,
                         PlanRepository plans, UserRepository users, FriendGraph graph, PlaceMoodUpdater moodUpdater, UploadService uploads) {
        this.moments = moments;
        this.reports = reports;
        this.places = places;
        this.placeMapper = placeMapper;
        this.plans = plans;
        this.users = users;
        this.graph = graph;
        this.moodUpdater = moodUpdater;
        this.uploads = uploads;
    }

    /* ---------------- read ---------------- */

    @Transactional(readOnly = true)
    public MomentDto get(UUID me, UUID id) {
        Moment m = moments.findById(id).orElseThrow(() -> ApiException.notFound("This Moment is not available."));
        if (m.isHidden() || !canSee(me, m.getAuthorId())) throw ApiException.notFound("This Moment is not available.");
        return toDtos(List.of(m), me).get(0);
    }

    /** FR-SOCIAL-6: friends' Moments, newest first, 20 per page. */
    @Transactional(readOnly = true)
    public Page<MomentDto> feed(UUID me, int page) {
        Set<UUID> friends = graph.friendIds(me);
        if (friends.isEmpty()) return new Page<>(List.of(), null);
        List<Moment> list = moments.findByAuthorIdInAndHiddenFalseOrderByCreatedAtDesc(friends, PageRequest.of(Math.max(0, page), PAGE_SIZE));
        long total = moments.countByAuthorIdInAndHiddenFalse(friends);
        Integer next = (long) (page + 1) * PAGE_SIZE < total ? page + 1 : null;
        return new Page<>(toDtos(list, me), next);
    }

    /** FR-MAP-2: pins for friends' Moments and Moments shared to the place page. bbox = minLng,minLat,maxLng,maxLat. */
    @Transactional(readOnly = true)
    public List<MapPin> mapPins(UUID me, String bbox) {
        double minLng = -180, minLat = -90, maxLng = 180, maxLat = 90;
        if (bbox != null) {
            String[] parts = bbox.split(",");
            if (parts.length == 4) {
                try {
                    minLng = Double.parseDouble(parts[0]); minLat = Double.parseDouble(parts[1]);
                    maxLng = Double.parseDouble(parts[2]); maxLat = Double.parseDouble(parts[3]);
                } catch (NumberFormatException e) {
                    throw ApiException.validation("bbox", "Use minLng,minLat,maxLng,maxLat");
                }
            }
        }
        Set<UUID> friends = graph.friendIds(me);
        Set<UUID> blocked = graph.blockedIds(me);
        List<Moment> list = moments.findInBox(minLat, maxLat, minLng, maxLng).stream()
                .filter(m -> !blocked.contains(m.getAuthorId()))
                .filter(m -> friends.contains(m.getAuthorId()) || m.getAuthorId().equals(me) || m.isShareToPlace())
                .limit(300)
                .toList();
        Map<UUID, Place> placeMap = places.findAllById(list.stream().map(Moment::getPlaceId).collect(Collectors.toSet())).stream()
                .collect(Collectors.toMap(Place::getId, p -> p));
        Map<UUID, String> names = users.findAllById(list.stream().map(Moment::getAuthorId).collect(Collectors.toSet())).stream()
                .collect(Collectors.toMap(User::getId, User::getName));
        List<MapPin> pins = new ArrayList<>();
        for (Moment m : list) {
            Place p = placeMap.get(m.getPlaceId());
            if (p == null) continue;
            boolean mine = m.getAuthorId().equals(me);
            pins.add(new MapPin(m.getId(), placeMapper.toSummary(p), mine ? "You" : names.getOrDefault(m.getAuthorId(), "Someone"),
                    m.getRating(), m.getPhotos().isEmpty() ? null : m.getPhotos().get(0), mine || friends.contains(m.getAuthorId())));
        }
        return pins;
    }

    /* ---------------- write ---------------- */

    @Transactional
    public MomentDto create(UUID me, MomentInput in) {
        validate(in);
        Moment m = new Moment();
        m.setId(UUID.randomUUID());
        m.setAuthorId(me);
        apply(m, in, Map.of());
        m.setVerifiedVisit(isVerifiedVisit(me, in.planId(), in.placeId(), OffsetDateTime.now()));
        moments.save(m);
        moodUpdater.recompute(m.getPlaceId());
        return toDtos(List.of(m), me).get(0);
    }

    /** FR-MOMENT-9 edit */
    @Transactional
    public MomentDto update(UUID me, UUID id, MomentInput in) {
        Moment m = moments.findById(id).orElseThrow(() -> ApiException.notFound("This Moment is gone."));
        if (!m.getAuthorId().equals(me)) throw ApiException.forbidden("You can only edit your own Moments.");
        validate(in);
        UUID oldPlace = m.getPlaceId();
        Map<UUID, MomentTag.Status> keep = m.getTags().stream().collect(Collectors.toMap(MomentTag::getTaggedUserId, MomentTag::getStatus, (a, b) -> a));
        apply(m, in, keep);
        m.setVerifiedVisit(isVerifiedVisit(me, in.planId(), in.placeId(), m.getCreatedAt()));
        m.setUpdatedAt(OffsetDateTime.now());
        moments.save(m);
        moodUpdater.recompute(m.getPlaceId());
        if (!oldPlace.equals(m.getPlaceId())) moodUpdater.recompute(oldPlace);
        return toDtos(List.of(m), me).get(0);
    }

    /** FR-MOMENT-9 delete */
    @Transactional
    public void delete(UUID me, UUID id) {
        Moment m = moments.findById(id).orElseThrow(() -> ApiException.notFound("This Moment is gone."));
        if (!m.getAuthorId().equals(me)) throw ApiException.forbidden("You can only delete your own Moments.");
        deleteInternal(m);
    }

    @Transactional
    public void deleteInternal(Moment m) {
        UUID placeId = m.getPlaceId();
        uploads.deleteIfOwned(m.getPhotos());
        moments.delete(m);
        moments.flush();
        moodUpdater.recompute(placeId);
    }

    /** FR-MOMENT-10: 3 reports hide it until an admin reviews. */
    @Transactional
    public void report(UUID me, UUID id, String reason) {
        Moment m = moments.findById(id).orElseThrow(() -> ApiException.notFound("This Moment is gone."));
        if (m.getAuthorId().equals(me)) throw ApiException.validation("momentId", "You can't report your own Moment.");
        if (reports.existsByMomentIdAndReporterId(id, me)) return;
        Report r = new Report();
        r.setId(UUID.randomUUID());
        r.setMomentId(id);
        r.setReporterId(me);
        r.setReason(reason.trim());
        reports.save(r);
        m.setReportCount((int) reports.countByMomentId(id));
        if (m.getReportCount() >= REPORTS_TO_HIDE) m.setHidden(true);
        moments.save(m);
    }

    /** FR-MOMENT-7: approve or decline being tagged. */
    @Transactional
    public void answerTag(UUID me, UUID momentId, boolean approve) {
        Moment m = moments.findById(momentId).orElseThrow(() -> ApiException.notFound("That tag is gone."));
        MomentTag tag = m.getTags().stream().filter(t -> t.getTaggedUserId().equals(me)).findFirst()
                .orElseThrow(() -> ApiException.notFound("That tag is gone."));
        tag.setStatus(approve ? MomentTag.Status.APPROVED : MomentTag.Status.DECLINED);
        moments.save(m);
    }

    /* ---------------- mapping ---------------- */

    /** Visibility rule (FR-SOCIAL-4): me, friends, or a public profile; blocked users never. */
    public boolean canSee(UUID me, UUID authorId) {
        if (authorId.equals(me)) return true;
        if (graph.isBlocked(me, authorId)) return false;
        if (graph.friendIds(me).contains(authorId)) return true;
        return users.findById(authorId).map(u -> u.getProfileVisibility() == Visibility.PUBLIC).orElse(false);
    }

    @Transactional(readOnly = true)
    public List<MomentDto> toDtos(List<Moment> list, UUID me) {
        if (list.isEmpty()) return List.of();
        Set<UUID> userIds = new HashSet<>();
        for (Moment m : list) {
            userIds.add(m.getAuthorId());
            m.getTags().forEach(t -> userIds.add(t.getTaggedUserId()));
        }
        Map<UUID, UserSummary> people = users.findAllById(userIds).stream().collect(Collectors.toMap(User::getId, UserSummary::of));
        Map<UUID, PlaceSummary> placeMap = places.findAllById(list.stream().map(Moment::getPlaceId).collect(Collectors.toSet())).stream()
                .collect(Collectors.toMap(Place::getId, placeMapper::toSummary));
        List<MomentDto> out = new ArrayList<>();
        for (Moment m : list) {
            boolean mine = m.getAuthorId().equals(me);
            // The author always gets the real date back (to edit it); others see what the author allows (FR-MOMENT-8).
            LocalDate date = mine || m.getHideDate() == Moment.HideDate.NONE ? m.getVisitDate()
                    : m.getHideDate() == Moment.HideDate.DAY ? m.getVisitDate().withDayOfMonth(1) : null;
            List<UserSummary> tagged = m.getTags().stream()
                    .filter(t -> t.getStatus() == MomentTag.Status.APPROVED)
                    .map(t -> people.get(t.getTaggedUserId())).filter(Objects::nonNull).toList();
            out.add(new MomentDto(m.getId(), people.get(m.getAuthorId()), placeMap.get(m.getPlaceId()), m.getPlanId(), date,
                    m.getHideDate(), m.getRating(), m.getOpinion(), m.isWouldGoAgain(), m.getSpentCents(), m.getSpentBasis(),
                    new ArrayList<>(m.getMoods()), m.isShareToPlace(), m.isVerifiedVisit(), m.getPhotos(), tagged, m.getCreatedAt(), mine));
        }
        return out;
    }

    /* ---------------- helpers ---------------- */

    private void validate(MomentInput in) {
        Map<String, String> fields = new LinkedHashMap<>();
        if (!places.existsById(in.placeId())) fields.put("placeId", "Pick a place from the list");
        if (in.visitDate().isAfter(LocalDate.now().plusDays(1))) fields.put("visitDate", "The visit can't be in the future");
        if (in.taggedUserIds() != null && in.taggedUserIds().size() > 10) fields.put("taggedUserIds", "Tag up to 10 friends");
        if (!fields.isEmpty()) throw ApiException.validation("Check the highlighted fields.", fields);
    }

    private void apply(Moment m, MomentInput in, Map<UUID, MomentTag.Status> keepStatuses) {
        m.setPlaceId(in.placeId());
        m.setPlanId(in.planId());
        m.setVisitDate(in.visitDate());
        m.setHideDate(in.hideDate() == null ? Moment.HideDate.NONE : in.hideDate());
        m.setRating(in.rating());
        m.setOpinion(in.opinion() == null ? "" : in.opinion().trim());
        m.setWouldGoAgain(in.wouldGoAgain());
        m.setSpentCents(in.spentCents());
        m.setSpentBasis(in.spentBasis() == null ? Moment.SpentBasis.TOTAL : in.spentBasis());
        m.setMoods(in.moods() == null ? new LinkedHashSet<>() : new LinkedHashSet<>(in.moods()));
        m.setShareToPlace(in.shareToPlace());
        m.setPhotos(new ArrayList<>(in.photoUrls()));
        m.getTags().clear();
        if (in.taggedUserIds() != null) {
            for (UUID uid : new LinkedHashSet<>(in.taggedUserIds())) {
                if (uid.equals(m.getAuthorId())) continue;
                m.getTags().add(new MomentTag(uid, keepStatuses.getOrDefault(uid, MomentTag.Status.PENDING)));
            }
        }
    }

    /** FR-MOMENT-5: posted within 7 days after a planned outing that included the place. */
    private boolean isVerifiedVisit(UUID me, UUID planId, UUID placeId, OffsetDateTime postedAt) {
        if (planId == null) return false;
        Plan plan = plans.findById(planId).orElse(null);
        if (plan == null) return false;
        Optional<PlanStop> stop = plan.getStops().stream().filter(s -> s.getPlaceId().equals(placeId)).findFirst();
        if (stop.isEmpty()) return false;
        OffsetDateTime outingEnd = stop.get().getDepartAt();
        return !postedAt.isBefore(outingEnd.minusHours(3)) && !postedAt.isAfter(outingEnd.plusDays(7));
    }
}
