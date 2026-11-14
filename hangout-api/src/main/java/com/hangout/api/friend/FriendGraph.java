package com.hangout.api.friend;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Read-side helpers other services use: who are my friends, who is blocked, what is my relation to X. */
@Service
@Transactional(readOnly = true)
public class FriendGraph {

    public record Relation(String state, UUID requestId) {}

    private final FriendshipRepository friendships;

    public FriendGraph(FriendshipRepository friendships) {
        this.friendships = friendships;
    }

    public Set<UUID> friendIds(UUID me) {
        Set<UUID> out = new HashSet<>();
        for (Friendship f : friendships.findAccepted(me)) out.add(f.otherSide(me));
        return out;
    }

    /** Blocked in either direction: blocked users can't see or find you (FR-SOCIAL-5). */
    public Set<UUID> blockedIds(UUID me) {
        Set<UUID> out = new HashSet<>();
        for (Friendship f : friendships.findBlocks(me)) out.add(f.otherSide(me));
        return out;
    }

    public boolean isBlocked(UUID me, UUID other) {
        return friendships.findBetween(me, other).stream().anyMatch(f -> f.getStatus() == Friendship.Status.BLOCKED);
    }

    public Relation relation(UUID me, UUID other) {
        if (me.equals(other)) return new Relation("SELF", null);
        List<Friendship> list = friendships.findBetween(me, other);
        for (Friendship f : list) {
            switch (f.getStatus()) {
                case BLOCKED -> { return new Relation("NONE", null); }
                case ACCEPTED -> { return new Relation("FRIENDS", null); }
                case PENDING -> {
                    return f.getRequesterId().equals(me)
                            ? new Relation("REQUEST_SENT", f.getId())
                            : new Relation("REQUEST_RECEIVED", f.getId());
                }
            }
        }
        return new Relation("NONE", null);
    }
}
