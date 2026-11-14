package com.hangout.api.moment;

import com.hangout.api.place.Mood;
import com.hangout.api.place.PlaceDtos.PlaceSummary;
import com.hangout.api.user.UserDtos.UserSummary;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public final class MomentDtos {
    private MomentDtos() {}

    /** POST /moments and PATCH /moments/{id} (FR-MOMENT-1 to 8). */
    public record MomentInput(
            @NotNull(message = "Pick a place from the list") UUID placeId,
            UUID planId,
            @NotNull(message = "Add the visit date") LocalDate visitDate,
            Moment.HideDate hideDate,
            @Min(value = 1, message = "Rate it from 1 to 5") @Max(value = 5, message = "Rate it from 1 to 5") int rating,
            @Size(max = 1000, message = "Keep it under 1,000 characters") String opinion,
            boolean wouldGoAgain,
            @Min(value = 0, message = "Enter 0 or more") int spentCents,
            Moment.SpentBasis spentBasis,
            @Size(max = 3, message = "Pick up to 3 moods") List<Mood> moods,
            boolean shareToPlace,
            @NotNull @Size(min = 1, max = 10, message = "Add 1 to 10 photos") List<@NotBlank @Size(max = 4000) String> photoUrls,
            List<UUID> taggedUserIds) {}

    public record MomentDto(UUID id, UserSummary author, PlaceSummary place, UUID planId, LocalDate visitDate,
                            Moment.HideDate hideDate, int rating, String opinion, boolean wouldGoAgain, int spentCents,
                            Moment.SpentBasis spentBasis, List<Mood> moods, boolean shareToPlace, boolean verifiedVisit,
                            List<String> photos, List<UserSummary> taggedFriends, OffsetDateTime createdAt, boolean isMine) {}

    public record Page<T>(List<T> items, Integer nextPage) {}

    public record ReportRequest(@NotBlank(message = "Tell us why") @Size(max = 500) String reason) {}

    public record MapPin(UUID momentId, PlaceSummary place, String authorName, int rating, String photo, boolean fromFriend) {}
}
