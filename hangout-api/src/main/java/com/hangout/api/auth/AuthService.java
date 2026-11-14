package com.hangout.api.auth;

import com.hangout.api.auth.AuthDtos.*;
import com.hangout.api.common.ApiException;
import com.hangout.api.config.AppProperties;
import com.hangout.api.user.User;
import com.hangout.api.user.UserRepository;
import com.hangout.api.user.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.text.Normalizer;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository users;
    private final UserService userService;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final AppProperties props;
    private final RestClient rest = RestClient.create();

    public AuthService(UserRepository users, UserService userService, PasswordEncoder encoder, JwtService jwt, AppProperties props) {
        this.users = users;
        this.userService = userService;
        this.encoder = encoder;
        this.jwt = jwt;
        this.props = props;
    }

    /** FR-AUTH-1 */
    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("That email is already registered.", Map.of("email", "Already registered"));
        }
        User u = new User();
        u.setId(UUID.randomUUID());
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(req.password())); // FR-AUTH-4
        u.setName(req.name().trim());
        u.setUsername(uniqueUsername(req.name())); // FR-AUTH-5
        u.setHomeCity(req.homeCity().trim());
        u.setHomeLat(props.city().centerLat());
        u.setHomeLng(props.city().centerLng());
        users.save(u);
        return new AuthResponse(jwt.issue(u.getId()), userService.toDto(u));
    }

    /** FR-AUTH-2 */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        User u = users.findByEmailIgnoreCase(req.email().trim())
                .filter(x -> x.getPasswordHash() != null && encoder.matches(req.password(), x.getPasswordHash()))
                .orElseThrow(() -> ApiException.unauthorized("Wrong email or password."));
        return new AuthResponse(jwt.issue(u.getId()), userService.toDto(u));
    }

    /** FR-AUTH-6: verifies a Google ID token with Google's tokeninfo endpoint and signs the user in (creating the account on first use). */
    @Transactional
    public AuthResponse google(GoogleRequest req) {
        String clientId = props.google().signInClientId();
        if (clientId == null || clientId.isBlank()) {
            throw ApiException.upstream("Google sign-in is not configured on the server.");
        }
        Map<?, ?> info;
        try {
            info = rest.get().uri("https://oauth2.googleapis.com/tokeninfo?id_token={t}", req.idToken())
                    .retrieve().body(Map.class);
        } catch (Exception e) {
            throw ApiException.upstream("Google did not accept the sign-in token.");
        }
        if (info == null || !clientId.equals(info.get("aud")) || !"true".equals(String.valueOf(info.get("email_verified")))) {
            throw ApiException.unauthorized("Google sign-in failed.");
        }
        String sub = String.valueOf(info.get("sub"));
        String email = String.valueOf(info.get("email")).toLowerCase();
        User u = users.findByGoogleSub(sub).or(() -> users.findByEmailIgnoreCase(email)).orElseGet(() -> {
            User n = new User();
            n.setId(UUID.randomUUID());
            n.setEmail(email);
            String name = info.get("name") == null ? email.substring(0, email.indexOf('@')) : String.valueOf(info.get("name"));
            n.setName(name);
            n.setUsername(uniqueUsername(name));
            n.setPhotoUrl(info.get("picture") == null ? null : String.valueOf(info.get("picture")));
            n.setHomeCity("New York");
            n.setHomeLat(props.city().centerLat());
            n.setHomeLng(props.city().centerLng());
            return n;
        });
        u.setGoogleSub(sub);
        users.save(u);
        return new AuthResponse(jwt.issue(u.getId()), userService.toDto(u));
    }

    private String uniqueUsername(String name) {
        String base = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("[^\\p{ASCII}]", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9._]", "");
        if (base.length() < 3) base = "user" + base;
        if (base.length() > 16) base = base.substring(0, 16);
        String candidate = base;
        int n = 1;
        while (users.existsByUsernameIgnoreCase(candidate)) {
            candidate = base + (++n);
            if (n > 10_000) throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL", "Could not pick a username.");
        }
        return candidate;
    }
}
