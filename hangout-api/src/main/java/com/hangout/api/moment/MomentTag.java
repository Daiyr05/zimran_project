package com.hangout.api.moment;

import jakarta.persistence.*;

import java.util.UUID;

/** FR-MOMENT-7: a tagged friend's name shows only after they approve. */
@Entity
@Table(name = "moment_tags")
public class MomentTag {
    public enum Status { PENDING, APPROVED, DECLINED }

    @Id
    private UUID id;

    @Column(name = "tagged_user_id", nullable = false)
    private UUID taggedUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    public MomentTag() {}

    public MomentTag(UUID taggedUserId, Status status) {
        this.id = UUID.randomUUID();
        this.taggedUserId = taggedUserId;
        this.status = status;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getTaggedUserId() { return taggedUserId; }
    public void setTaggedUserId(UUID taggedUserId) { this.taggedUserId = taggedUserId; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
}
