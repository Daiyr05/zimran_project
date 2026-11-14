package com.hangout.api.moment;

import com.hangout.api.place.Mood;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "moments")
public class Moment {
    public enum HideDate { NONE, DAY, FULL }
    public enum SpentBasis { TOTAL, PER_PERSON }

    @Id
    private UUID id;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "place_id", nullable = false)
    private UUID placeId;

    @Column(name = "plan_id")
    private UUID planId;

    @Column(name = "visit_date", nullable = false)
    private LocalDate visitDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "hide_date", nullable = false)
    private HideDate hideDate = HideDate.NONE;

    @Column(nullable = false)
    private int rating;

    @Column(nullable = false)
    private String opinion = "";

    @Column(name = "would_go_again", nullable = false)
    private boolean wouldGoAgain;

    @Column(name = "spent_cents", nullable = false)
    private int spentCents;

    @Enumerated(EnumType.STRING)
    @Column(name = "spent_basis", nullable = false)
    private SpentBasis spentBasis = SpentBasis.TOTAL;

    @Column(name = "share_to_place", nullable = false)
    private boolean shareToPlace;

    @Column(name = "verified_visit", nullable = false)
    private boolean verifiedVisit;

    @Column(nullable = false)
    private boolean hidden;

    @Column(name = "report_count", nullable = false)
    private int reportCount;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "moment_photos", joinColumns = @JoinColumn(name = "moment_id"))
    @OrderColumn(name = "position")
    @Column(name = "url", nullable = false)
    private List<String> photos = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "moment_moods", joinColumns = @JoinColumn(name = "moment_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "mood", nullable = false)
    private Set<Mood> moods = new LinkedHashSet<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "moment_id", nullable = false)
    private List<MomentTag> tags = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getAuthorId() { return authorId; }
    public void setAuthorId(UUID authorId) { this.authorId = authorId; }
    public UUID getPlaceId() { return placeId; }
    public void setPlaceId(UUID placeId) { this.placeId = placeId; }
    public UUID getPlanId() { return planId; }
    public void setPlanId(UUID planId) { this.planId = planId; }
    public LocalDate getVisitDate() { return visitDate; }
    public void setVisitDate(LocalDate visitDate) { this.visitDate = visitDate; }
    public HideDate getHideDate() { return hideDate; }
    public void setHideDate(HideDate hideDate) { this.hideDate = hideDate; }
    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }
    public String getOpinion() { return opinion; }
    public void setOpinion(String opinion) { this.opinion = opinion; }
    public boolean isWouldGoAgain() { return wouldGoAgain; }
    public void setWouldGoAgain(boolean wouldGoAgain) { this.wouldGoAgain = wouldGoAgain; }
    public int getSpentCents() { return spentCents; }
    public void setSpentCents(int spentCents) { this.spentCents = spentCents; }
    public SpentBasis getSpentBasis() { return spentBasis; }
    public void setSpentBasis(SpentBasis spentBasis) { this.spentBasis = spentBasis; }
    public boolean isShareToPlace() { return shareToPlace; }
    public void setShareToPlace(boolean shareToPlace) { this.shareToPlace = shareToPlace; }
    public boolean isVerifiedVisit() { return verifiedVisit; }
    public void setVerifiedVisit(boolean verifiedVisit) { this.verifiedVisit = verifiedVisit; }
    public boolean isHidden() { return hidden; }
    public void setHidden(boolean hidden) { this.hidden = hidden; }
    public int getReportCount() { return reportCount; }
    public void setReportCount(int reportCount) { this.reportCount = reportCount; }
    public List<String> getPhotos() { return photos; }
    public void setPhotos(List<String> photos) { this.photos = photos; }
    public Set<Mood> getMoods() { return moods; }
    public void setMoods(Set<Mood> moods) { this.moods = moods; }
    public List<MomentTag> getTags() { return tags; }
    public void setTags(List<MomentTag> tags) { this.tags = tags; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
