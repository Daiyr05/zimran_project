package com.hangout.api.user;

import com.hangout.api.common.ApiException;
import com.hangout.api.friend.FriendGraph;
import com.hangout.api.friend.FriendshipRepository;
import com.hangout.api.moment.Moment;
import com.hangout.api.moment.MomentRepository;
import com.hangout.api.moment.MomentService;
import com.hangout.api.search.SearchService;
import com.hangout.api.user.UserDtos.*;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository users;
    private final FriendGraph graph;
    private final FriendshipRepository friendships;
    private final MomentRepository moments;
    private final MomentService momentService;
    private final SearchService searchService;

    public UserService(UserRepository users, FriendGraph graph, FriendshipRepository friendships, MomentRepository moments,
                       @Lazy MomentService momentService, @Lazy SearchService searchService) {
        this.users = users;
        this.graph = graph;
        this.friendships = friendships;
        this.moments = moments;
        this.momentService = momentService;
        this.searchService = searchService;
    }

    public UserDto toDto(User u) {
        return new UserDto(u.getId(), u.getName(), u.getUsername(), u.getEmail(), u.getPhotoUrl(), u.getHomeCity(), u.getTier(),
                searchService.searchesLeft(u), u.getProfileVisibility());
    }

    @Transactional(readOnly = true)
    public UserDto me(UUID id) {
        return toDto(users.findById(id).orElseThrow(() -> ApiException.unauthorized("Sign in to continue.")));
    }

    /** PATCH /me (FR-AUTH-5, FR-SOCIAL-4) */
    @Transactional
    public UserDto update(UUID id, UpdateMeRequest req) {
        User u = users.findById(id).orElseThrow(() -> ApiException.unauthorized("Sign in to continue."));
        if (req.username() != null) {
            String username = req.username().trim().toLowerCase();
            if (!username.equalsIgnoreCase(u.getUsername()) && users.existsByUsernameIgnoreCase(username)) {
                throw ApiException.conflict("That username is taken.", Map.of("username", "That username is taken"));
            }
            u.setUsername(username);
        }
        if (req.name() != null) u.setName(req.name().trim());
        if (req.photoUrl() != null) u.setPhotoUrl(req.photoUrl().isBlank() ? null : req.photoUrl());
        if (req.homeCity() != null) u.setHomeCity(req.homeCity().trim());
        if (req.visibility() != null) u.setProfileVisibility(req.visibility());
        return toDto(users.save(u));
    }

    /** FR-AUTH-7: delete the user, their Moments and photos. Other rows cascade in the database. */
    @Transactional
    public void delete(UUID id) {
        User u = users.findById(id).orElseThrow(() -> ApiException.unauthorized("Sign in to continue."));
        for (Moment m : moments.findByAuthorId(id)) momentService.deleteInternal(m);
        friendships.deleteAll(friendships.findAllFor(id));
        users.delete(u);
    }

    /** GET /users/search?q= (FR-SOCIAL-1) */
    @Transactional(readOnly = true)
    public List<UserSearchResult> search(UUID me, String q) {
        String term = q == null ? "" : q.trim().replaceFirst("^@", "").toLowerCase();
        if (term.length() < 2) return List.of();
        Set<UUID> blocked = graph.blockedIds(me);
        return users.search(term).stream()
                .filter(u -> !u.getId().equals(me) && !blocked.contains(u.getId()))
                .limit(10)
                .map(u -> new UserSearchResult(u.getId(), u.getName(), u.getUsername(), u.getPhotoUrl(), u.getHomeCity(),
                        graph.relation(me, u.getId()).state()))
                .toList();
    }

    /** GET /users/{username} (FR-SOCIAL-3, 4) */
    @Transactional(readOnly = true)
    public Profile profile(UUID me, String username) {
        User u = users.findByUsernameIgnoreCase(username).orElseThrow(() -> ApiException.notFound("We couldn't find that person."));
        if (graph.isBlocked(me, u.getId())) throw ApiException.notFound("We couldn't find that person.");
        FriendGraph.Relation rel = graph.relation(me, u.getId());
        List<Moment> mine = moments.findByAuthorIdAndHiddenFalseOrderByCreatedAtDesc(u.getId());
        int placesVisited = (int) mine.stream().map(Moment::getPlaceId).distinct().count();
        boolean canSee = u.getId().equals(me) || rel.state().equals("FRIENDS") || u.getProfileVisibility() == Visibility.PUBLIC;
        return new Profile(UserSummary.of(u), u.getProfileVisibility(), rel.state(), rel.requestId(), placesVisited,
                (int) friendships.countAccepted(u.getId()), canSee ? momentService.toDtos(mine, me) : null);
    }

    public Map<UUID, UserSummary> summaries(Collection<UUID> ids) {
        return users.findAllById(ids).stream().collect(Collectors.toMap(User::getId, UserSummary::of));
    }
}
