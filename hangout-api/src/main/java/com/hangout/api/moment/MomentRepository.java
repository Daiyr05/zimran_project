package com.hangout.api.moment;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface MomentRepository extends JpaRepository<Moment, UUID> {

    List<Moment> findByAuthorIdInAndHiddenFalseOrderByCreatedAtDesc(Collection<UUID> authorIds, Pageable pageable);

    long countByAuthorIdInAndHiddenFalse(Collection<UUID> authorIds);

    List<Moment> findByAuthorIdAndHiddenFalseOrderByCreatedAtDesc(UUID authorId);

    List<Moment> findByAuthorId(UUID authorId);

    List<Moment> findByAuthorIdIn(Collection<UUID> authorIds);

    List<Moment> findByPlaceIdAndHiddenFalseOrderByCreatedAtDesc(UUID placeId);

    List<Moment> findByPlaceId(UUID placeId);

    @Query("select m from Moment m, com.hangout.api.place.Place p where m.placeId = p.id and m.hidden = false " +
            "and p.lat between :minLat and :maxLat and p.lng between :minLng and :maxLng order by m.createdAt desc")
    List<Moment> findInBox(@Param("minLat") double minLat, @Param("maxLat") double maxLat,
                           @Param("minLng") double minLng, @Param("maxLng") double maxLng);

    @Query("select m from Moment m join m.tags t where t.taggedUserId = :u and t.status = 'PENDING' and m.hidden = false")
    List<Moment> findWithPendingTagFor(@Param("u") UUID u);
}
