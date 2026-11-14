package com.hangout.api.friend;

import com.hangout.api.user.UserDtos.UserSummary;
import jakarta.validation.constraints.NotBlank;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public final class FriendDtos {
    private FriendDtos() {}

    public record SendRequest(@NotBlank(message = "Enter a username") String username) {}

    public record FriendRequestDto(UUID id, UserSummary user, OffsetDateTime createdAt) {}

    public record TagRequestDto(UUID momentId, UserSummary by, String placeName) {}

    public record FriendsResponse(List<UserSummary> friends, List<FriendRequestDto> incoming, List<FriendRequestDto> outgoing,
                                  List<TagRequestDto> tagRequests) {}
}
