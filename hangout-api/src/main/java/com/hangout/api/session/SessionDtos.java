package com.hangout.api.session;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hangout.api.place.Mood;
import com.hangout.api.search.PlanDtos.PlanDto;
import com.hangout.api.search.PlanDtos.StartDto;
import com.hangout.api.search.SearchRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class SessionDtos {
    private SessionDtos() {}

    public record CreateSessionRequest(@NotNull @Valid SearchRequest inputs) {}

    public record CreateSessionResponse(String code, String link) {}

    public record JoinRequest(@NotBlank(message = "Enter a name") @Size(max = 30, message = "Up to 30 characters") String displayName) {}

    public record JoinResponse(String memberToken, UUID memberId) {}

    /** Private inputs an invitee sends (FR-INVITE-2). budgetCents is per person. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MemberInputs(
            @NotNull @Size(min = 1, max = 2, message = "Pick 1 or 2 moods") List<Mood> moods,
            @NotNull @Min(value = 60, message = "At least 1 hour") @Max(value = 480, message = "At most 8 hours") Integer totalMinutes,
            @NotNull @Min(value = 1, message = "must be > 0") Integer budgetCents,
            @NotNull @Valid SearchRequest.Start start) {}

    public record VotesRequest(@NotNull List<@Valid VoteItem> votes) {}

    public record VoteItem(@NotNull UUID planId, boolean liked) {}

    public record MemberView(UUID id, String displayName, boolean isOrganizer, boolean hasAnswered, boolean hasVoted) {}

    public record MeView(UUID memberId, boolean isOrganizer, boolean hasAnswered, Map<UUID, Boolean> votes) {}

    /** What every member may see: no other member's budget, address or token (FR-INVITE-3, NFR-PRIV-1). */
    public record SessionView(String code, Session.Status status, String organizerName, OffsetDateTime expiresAt,
                              List<MemberView> members, List<PlanDto> plans, StartDto start, int partySize,
                              Map<UUID, Integer> likes, UUID winningPlanId, MeView me) {}
}
