package com.hangout.api.billing;

import com.hangout.api.common.ApiException;
import com.hangout.api.common.CurrentUser;
import com.hangout.api.config.AppProperties;
import com.hangout.api.user.Tier;
import com.hangout.api.user.User;
import com.hangout.api.user.UserRepository;
import com.hangout.api.user.UserService;
import com.hangout.api.user.UserDtos.UserDto;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/** SRS 4.8 Plus and payments. Stripe Checkout (FR-PAY-2) needs STRIPE_SECRET_KEY; the demo upgrade (FR-PAY-3) works without it. */
@RestController
@RequestMapping("/api/v1/billing")
@Tag(name = "Billing")
public class BillingController {

    private static final Logger log = LoggerFactory.getLogger(BillingController.class);

    private final AppProperties props;
    private final UserRepository users;
    private final UserService userService;
    private final SubscriptionRepository subscriptions;

    public BillingController(AppProperties props, UserRepository users, UserService userService, SubscriptionRepository subscriptions) {
        this.props = props;
        this.users = users;
        this.userService = userService;
        this.subscriptions = subscriptions;
    }

    @PostMapping("/checkout")
    public Map<String, String> checkout() {
        CurrentUser.require();
        String key = props.stripe().secretKey();
        if (key == null || key.isBlank()) {
            throw ApiException.upstream("Stripe is not configured on this server. Use the demo upgrade instead.");
        }
        // Stripe Checkout session creation goes here once a test key is available (FR-PAY-2).
        throw ApiException.upstream("Stripe Checkout is not wired up yet. Use the demo upgrade instead.");
    }

    @PostMapping("/webhook")
    public Map<String, String> webhook(@RequestBody(required = false) String payload) {
        log.info("Stripe webhook received ({} bytes); ignored until Stripe is configured", payload == null ? 0 : payload.length());
        return Map.of("received", "true");
    }

    /** FR-PAY-3: demo fallback behind a config flag. */
    @PostMapping("/demo-upgrade")
    @Transactional
    public UserDto demoUpgrade() {
        if (!props.demoUpgradeEnabled()) throw ApiException.forbidden("The demo upgrade is switched off.");
        User u = users.findById(CurrentUser.require()).orElseThrow(() -> ApiException.unauthorized("Sign in to continue."));
        if (u.getTier() != Tier.PLUS) {
            u.setTier(Tier.PLUS);
            users.save(u);
            Subscription s = new Subscription();
            s.setId(UUID.randomUUID());
            s.setUserId(u.getId());
            s.setStatus("DEMO");
            subscriptions.save(s);
        }
        return userService.toDto(u);
    }
}
