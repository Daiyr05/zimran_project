package com.hangout.api.search;

import com.hangout.api.engine.EngineRequest.FriendSignal;
import com.hangout.api.friend.FriendGraph;
import com.hangout.api.moment.Moment;
import com.hangout.api.moment.MomentRepository;
import com.hangout.api.user.User;
import com.hangout.api.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/** FR-RESULT-7 / SRS 5.3 F: what the viewer's friends posted about each place. */
@Service
@Transactional(readOnly = true)
public class FriendSignalService {

    public record Signals(Map<UUID, FriendSignal> best, Set<UUID> vetoed) {
        public static Signals none() { return new Signals(Map.of(), Set.of()); }
    }

    private final FriendGraph graph;
    private final MomentRepository moments;
    private final UserRepository users;

    public FriendSignalService(FriendGraph graph, MomentRepository moments, UserRepository users) {
        this.graph = graph;
        this.moments = moments;
        this.users = users;
    }

    public Signals forViewer(UUID viewerId) {
        if (viewerId == null) return Signals.none();
        Set<UUID> friends = graph.friendIds(viewerId);
        if (friends.isEmpty()) return Signals.none();
        Map<UUID, String> names = users.findAllById(friends).stream().collect(Collectors.toMap(User::getId, User::getName));
        Map<UUID, FriendSignal> best = new HashMap<>();
        Set<UUID> vetoed = new HashSet<>();
        for (Moment m : moments.findByAuthorIdIn(friends)) {
            if (m.isHidden()) continue;
            if (m.getRating() <= 2) vetoed.add(m.getPlaceId());
            FriendSignal cur = best.get(m.getPlaceId());
            if (cur == null || m.getRating() > cur.rating()) {
                best.put(m.getPlaceId(), new FriendSignal(names.getOrDefault(m.getAuthorId(), "A friend"), m.getRating(),
                        m.getSpentCents(), m.getId()));
            }
        }
        // A friend who rated it ≥ 3 later keeps the signal; a ≤ 2 rating removes the place entirely (SRS 5.3).
        return new Signals(best, vetoed);
    }

    public Set<UUID> visitedPlaces(UUID userId) {
        if (userId == null) return Set.of();
        return moments.findByAuthorId(userId).stream().map(Moment::getPlaceId).collect(Collectors.toSet());
    }
}
