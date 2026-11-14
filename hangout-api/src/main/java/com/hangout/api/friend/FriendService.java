package com.hangout.api.friend;

import com.hangout.api.common.ApiException;
import com.hangout.api.friend.FriendDtos.*;
import com.hangout.api.moment.Moment;
import com.hangout.api.moment.MomentRepository;
import com.hangout.api.place.Place;
import com.hangout.api.place.PlaceRepository;
import com.hangout.api.user.User;
import com.hangout.api.user.UserRepository;
import com.hangout.api.user.UserDtos.UserSummary;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

/** SRS 4.5 friends. */
@Service
public class FriendService {

    private final FriendshipRepository friendships;
    private final FriendGraph graph;
    private final UserRepository users;
    private final MomentRepository moments;
    private final PlaceRepository places;

    public FriendService(FriendshipRepository friendships, FriendGraph graph, UserRepository users, MomentRepository moments,
                         PlaceRepository places) {
        this.friendships = friendships;
        this.graph = graph;
        this.users = users;
        this.moments = moments;
        this.places = places;
    }

    @Transactional(readOnly = true)
    public FriendsResponse list(UUID me) {
        Set<UUID> ids = new HashSet<>(graph.friendIds(me));
        List<Friendship> incoming = friendships.findIncoming(me);
        List<Friendship> outgoing = friendships.findOutgoing(me);
        List<Moment> tagged = moments.findWithPendingTagFor(me);
        ids.addAll(incoming.stream().map(Friendship::getRequesterId).toList());
        ids.addAll(outgoing.stream().map(Friendship::getAddresseeId).toList());
        ids.addAll(tagged.stream().map(Moment::getAuthorId).toList());
        Map<UUID, UserSummary> people = users.findAllById(ids).stream().collect(Collectors.toMap(User::getId, UserSummary::of));
        Map<UUID, String> placeNames = places.findAllById(tagged.stream().map(Moment::getPlaceId).toList()).stream()
                .collect(Collectors.toMap(Place::getId, Place::getName));
        return new FriendsResponse(
                graph.friendIds(me).stream().map(people::get).filter(Objects::nonNull).sorted(Comparator.comparing(UserSummary::name)).toList(),
                incoming.stream().filter(f -> people.containsKey(f.getRequesterId()))
                        .map(f -> new FriendRequestDto(f.getId(), people.get(f.getRequesterId()), f.getCreatedAt())).toList(),
                outgoing.stream().filter(f -> people.containsKey(f.getAddresseeId()))
                        .map(f -> new FriendRequestDto(f.getId(), people.get(f.getAddresseeId()), f.getCreatedAt())).toList(),
                tagged.stream().filter(m -> people.containsKey(m.getAuthorId()))
                        .map(m -> new TagRequestDto(m.getId(), people.get(m.getAuthorId()), placeNames.getOrDefault(m.getPlaceId(), "a place"))).toList());
    }

    /** FR-SOCIAL-1: request by username. A pending request from them is accepted instead. */
    @Transactional
    public void sendRequest(UUID me, String username) {
        String name = username.trim().replaceFirst("^@", "");
        User target = users.findByUsernameIgnoreCase(name).orElseThrow(() -> ApiException.notFound("No one goes by @" + name + "."));
        if (target.getId().equals(me)) throw ApiException.validation("username", "That's you");
        if (graph.isBlocked(me, target.getId())) throw ApiException.notFound("No one goes by @" + name + ".");
        FriendGraph.Relation rel = graph.relation(me, target.getId());
        switch (rel.state()) {
            case "FRIENDS" -> throw ApiException.conflict("You and " + target.getName() + " are already friends.");
            case "REQUEST_SENT" -> throw ApiException.conflict("Request already sent.");
            case "REQUEST_RECEIVED" -> accept(me, rel.requestId());
            default -> {
                Friendship f = new Friendship();
                f.setId(UUID.randomUUID());
                f.setRequesterId(me);
                f.setAddresseeId(target.getId());
                f.setStatus(Friendship.Status.PENDING);
                friendships.save(f);
            }
        }
    }

    /** FR-SOCIAL-2 */
    @Transactional
    public void accept(UUID me, UUID requestId) {
        Friendship f = friendships.findByIdAndStatus(requestId, Friendship.Status.PENDING)
                .orElseThrow(() -> ApiException.notFound("That request is gone."));
        if (!f.getAddresseeId().equals(me)) throw ApiException.forbidden("Only the person asked can accept.");
        f.setStatus(Friendship.Status.ACCEPTED);
        f.setUpdatedAt(OffsetDateTime.now());
        friendships.save(f);
    }

    /** Decline (them → you) or cancel (you → them). */
    @Transactional
    public void decline(UUID me, UUID requestId) {
        Friendship f = friendships.findByIdAndStatus(requestId, Friendship.Status.PENDING)
                .orElseThrow(() -> ApiException.notFound("That request is gone."));
        if (!f.getAddresseeId().equals(me) && !f.getRequesterId().equals(me)) throw ApiException.forbidden("Not your request.");
        friendships.delete(f);
    }

    /** FR-SOCIAL-5 remove */
    @Transactional
    public void remove(UUID me, UUID other) {
        friendships.findBetween(me, other).stream()
                .filter(f -> f.getStatus() == Friendship.Status.ACCEPTED)
                .forEach(friendships::delete);
    }

    /** FR-SOCIAL-5 block: drops any friendship or request, then records the block. */
    @Transactional
    public void block(UUID me, UUID other) {
        if (me.equals(other)) throw ApiException.validation("userId", "That's you");
        users.findById(other).orElseThrow(() -> ApiException.notFound("We couldn't find that person."));
        friendships.deleteAll(friendships.findBetween(me, other));
        friendships.flush(); // the unique (requester, addressee) index: delete must hit the DB before the insert
        Friendship f = new Friendship();
        f.setId(UUID.randomUUID());
        f.setRequesterId(me);
        f.setAddresseeId(other);
        f.setStatus(Friendship.Status.BLOCKED);
        friendships.save(f);
    }
}
