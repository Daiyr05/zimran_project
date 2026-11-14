package com.hangout.api.auth;

import com.hangout.api.user.UserDtos.UserDto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank(message = "Enter your name") @Size(max = 60) String name,
            @NotBlank(message = "Enter your email") @Email(message = "Enter a valid email") @Size(max = 120) String email,
            @NotBlank(message = "Enter a password") @Size(min = 8, max = 100, message = "At least 8 characters") String password,
            @NotBlank(message = "Enter your home city") @Size(max = 80) String homeCity) {}

    public record LoginRequest(
            @NotBlank(message = "Enter your email") @Email(message = "Enter a valid email") String email,
            @NotBlank(message = "Enter your password") String password) {}

    public record GoogleRequest(@NotBlank String idToken) {}

    public record AuthResponse(String token, UserDto user) {}
}
