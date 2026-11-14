package com.hangout.api.place;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PlaceRepository extends JpaRepository<Place, UUID> {
    @Query("select p from Place p where p.primaryType <> 'stay_in' and p.lat between :minLat and :maxLat and p.lng between :minLng and :maxLng")
    List<Place> findInBox(@Param("minLat") double minLat, @Param("maxLat") double maxLat,
                          @Param("minLng") double minLng, @Param("maxLng") double maxLng);

    List<Place> findByPrimaryType(String primaryType);

    @Query("select p from Place p where p.primaryType <> 'stay_in' and lower(p.name) like concat('%', :q, '%') order by p.reviewCount desc")
    List<Place> autocomplete(@Param("q") String q);
}
