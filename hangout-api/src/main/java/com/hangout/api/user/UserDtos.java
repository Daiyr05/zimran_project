package com.hangout.api.user;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public final class UserDtos {
    private UserDtos() {}

    /** The signed-in user (GET /me). searchesLeft is null for Plus (unlimited). */
    public record UserDto(UUID id, String name, String username, String email, String photoUrl, String homeCity,
                          Tier tier, Integer searchesLeft, Visibility visibility) {}

    /** What other users may see about a person. Never email or home address (NFR-PRIV-1). */
    public record UserSummary(UUID id, String name, String username, String photoUrl, String homeCity) {
        public static UserSummary of(User u) {
            return new UserSummary(u.getId(), u.getName(), u.getUsername(), u.getPhotoUrl(), u.getHomeCity());
        }
    }

    public record UpdateMeRequest(
            @Size(min = 1, max = 60, message = "1 to 60 characters") String name,
            @Pattern(regexp = "^[a-zA-Z0-9._]{3,20}$", message = "3–20 letters, numbers, dots or underscores") String username,
            @Size(max = 2000) String photoUrl,
            @Size(min = 1, max = 80, message = "1 to 80 characters") String homeCity,
            Visibility visibility) {}

    public record UserSearchResult(UUID id, String name, String username, String photoUrl, String homeCity,
                                   String friendship) {}

    @JsonInclude(JsonInclude.Include.ALWAYS)
    public record Profile(UserSummary user, Visibility visibility, String friendship, UUID requestId,
                          int placesVisited, int friendsCount, java.util.List<?> moments) {}
}
