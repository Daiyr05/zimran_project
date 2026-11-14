package com.hangout.api.place;

import com.hangout.api.common.ApiException;
import com.hangout.api.friend.FriendGraph;
import com.hangout.api.moment.Moment;
import com.hangout.api.moment.MomentRepository;
import com.hangout.api.moment.MomentService;
import com.hangout.api.place.PlaceDtos.PlaceDetail;
import com.hangout.api.place.PlaceDtos.PlaceSummary;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/** SRS 4.7 places: autocomplete (FR-MAP-4) and the place page (FR-MAP-3). */
@Service
public class PlaceService {

    private final PlaceRepository places;
    private final PlaceMapper mapper;
    private final MomentRepository moments;
    private final MomentService momentService;
    private final FriendGraph graph;

    public PlaceService(PlaceRepository places, PlaceMapper mapper, MomentRepository moments, MomentService momentService, FriendGraph graph) {
        this.places = places;
        this.mapper = mapper;
        this.moments = moments;
        this.momentService = momentService;
        this.graph = graph;
    }

    @Transactional(readOnly = true)
    public List<PlaceSummary> autocomplete(String q) {
        String term = q == null ? "" : q.trim().toLowerCase();
        if (term.length() < 2) return List.of();
        return places.autocomplete(term).stream().limit(8).map(mapper::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public PlaceDetail detail(UUID me, UUID id) {
        Place p = places.findById(id).orElseThrow(() -> ApiException.notFound("We couldn't find this place."));
        Set<UUID> friends = graph.friendIds(me);
        Set<UUID> blocked = graph.blockedIds(me);
        List<Moment> here = moments.findByPlaceIdAndHiddenFalseOrderByCreatedAtDesc(id);
        List<Moment> friendsMoments = here.stream().filter(m -> friends.contains(m.getAuthorId()) || m.getAuthorId().equals(me)).toList();
        // FR-MOMENT-4 / AT-8: only Moments shared to the place page show here for non-friends.
        List<Moment> shared = here.stream()
                .filter(m -> m.isShareToPlace() && !friends.contains(m.getAuthorId()) && !m.getAuthorId().equals(me) && !blocked.contains(m.getAuthorId()))
                .toList();
        LinkedHashSet<String> photos = new LinkedHashSet<>();
        if (p.getPhotoUrl() != null) photos.add(p.getPhotoUrl());
        friendsMoments.forEach(m -> photos.addAll(m.getPhotos()));
        shared.forEach(m -> photos.addAll(m.getPhotos()));
        return new PlaceDetail(p.getId(), p.getName(), p.getKind(), p.getLat(), p.getLng(), p.getRating(), p.getReviewCount(),
                p.getPriceLevel(), p.getPhotoUrl(), mapper.mapsUrl(p), p.getWebsite(), mapper.isHiddenGem(p), p.isReservable(), p.isOutdoor(),
                p.getAddress(), p.getPhone(), OpeningHours.parse(p.getOpeningHours()).humanLines(),
                photos.stream().limit(6).toList(), momentService.toDtos(friendsMoments, me), momentService.toDtos(shared, me));
    }
}
