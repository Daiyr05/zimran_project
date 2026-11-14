package com.hangout.api.common;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

/** The signed-in user's id from the JWT, or empty for guests. */
public final class CurrentUser {
    private CurrentUser() {}

    public static Optional<UUID> id() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UUID id) return Optional.of(id);
        return Optional.empty();
    }

    public static UUID require() {
        return id().orElseThrow(() -> ApiException.unauthorized("Sign in to continue."));
    }
}
