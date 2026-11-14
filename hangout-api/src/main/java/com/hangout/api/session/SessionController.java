package com.hangout.api.session;

import com.hangout.api.common.CurrentUser;
import com.hangout.api.session.SessionDtos.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sessions")
@Tag(name = "Sessions")
public class SessionController {

    private static final String MEMBER_HEADER = "X-Member-Token";

    private final SessionService service;

    public SessionController(SessionService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreateSessionResponse create(@Valid @RequestBody CreateSessionRequest body) {
        return service.create(CurrentUser.require(), body.inputs());
    }

    @GetMapping("/{code}")
    public SessionView get(@PathVariable String code, @RequestHeader(value = MEMBER_HEADER, required = false) String memberToken) {
        return service.view(code, memberToken, CurrentUser.id().orElse(null));
    }

    @PostMapping("/{code}/join")
    @ResponseStatus(HttpStatus.CREATED)
    public JoinResponse join(@PathVariable String code, @Valid @RequestBody JoinRequest body) {
        return service.join(code, CurrentUser.id().orElse(null), body.displayName());
    }

    @PutMapping("/{code}/inputs")
    public SessionView inputs(@PathVariable String code, @RequestHeader(value = MEMBER_HEADER, required = false) String memberToken,
                              @Valid @RequestBody MemberInputs body) {
        return service.putInputs(code, memberToken, CurrentUser.id().orElse(null), body);
    }

    @PostMapping("/{code}/generate")
    public SessionView generate(@PathVariable String code, @RequestHeader(value = MEMBER_HEADER, required = false) String memberToken) {
        return service.generate(code, memberToken, CurrentUser.id().orElse(null));
    }

    @PutMapping("/{code}/votes")
    public SessionView votes(@PathVariable String code, @RequestHeader(value = MEMBER_HEADER, required = false) String memberToken,
                             @Valid @RequestBody VotesRequest body) {
        return service.putVotes(code, memberToken, CurrentUser.id().orElse(null), body);
    }

    @PostMapping("/{code}/close")
    public SessionView close(@PathVariable String code, @RequestHeader(value = MEMBER_HEADER, required = false) String memberToken) {
        return service.close(code, memberToken, CurrentUser.id().orElse(null));
    }

    @GetMapping(value = "/{code}/calendar.ics", produces = "text/calendar")
    public ResponseEntity<String> calendar(@PathVariable String code, @RequestHeader(value = MEMBER_HEADER, required = false) String memberToken) {
        String ics = service.calendar(code, memberToken, CurrentUser.id().orElse(null));
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/calendar; charset=utf-8"))
                .header("Content-Disposition", "attachment; filename=\"hangout-" + code + ".ics\"")
                .body(ics);
    }
}
