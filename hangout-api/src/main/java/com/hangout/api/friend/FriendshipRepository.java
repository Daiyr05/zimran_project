package com.hangout.api.friend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FriendshipRepository extends JpaRepository<Friendship, UUID> {

    @Query("select f from Friendship f where (f.requesterId = :a and f.addresseeId = :b) or (f.requesterId = :b and f.addresseeId = :a)")
    List<Friendship> findBetween(@Param("a") UUID a, @Param("b") UUID b);

    @Query("select f from Friendship f where f.status = 'ACCEPTED' and (f.requesterId = :u or f.addresseeId = :u)")
    List<Friendship> findAccepted(@Param("u") UUID u);

    @Query("select f from Friendship f where f.status = 'BLOCKED' and (f.requesterId = :u or f.addresseeId = :u)")
    List<Friendship> findBlocks(@Param("u") UUID u);

    @Query("select f from Friendship f where f.status = 'PENDING' and f.addresseeId = :u order by f.createdAt desc")
    List<Friendship> findIncoming(@Param("u") UUID u);

    @Query("select f from Friendship f where f.status = 'PENDING' and f.requesterId = :u order by f.createdAt desc")
    List<Friendship> findOutgoing(@Param("u") UUID u);

    @Query("select count(f) from Friendship f where f.status = 'ACCEPTED' and (f.requesterId = :u or f.addresseeId = :u)")
    long countAccepted(@Param("u") UUID u);

    @Query("select f from Friendship f where f.requesterId = :u or f.addresseeId = :u")
    List<Friendship> findAllFor(@Param("u") UUID u);

    Optional<Friendship> findByIdAndStatus(UUID id, Friendship.Status status);
}
