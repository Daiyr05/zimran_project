package com.hangout.api.place;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface PlaceMoodRepository extends JpaRepository<PlaceMood, UUID> {
    List<PlaceMood> findByPlaceIdIn(Collection<UUID> placeIds);
    List<PlaceMood> findByPlaceId(UUID placeId);
}
