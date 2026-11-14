package com.hangout.api.user;

import com.hangout.api.common.CurrentUser;
import com.hangout.api.user.UserDtos.UpdateMeRequest;
import com.hangout.api.user.UserDtos.UserDto;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/me")
@Tag(name = "Me")
public class MeController {

    private final UserService users;

    public MeController(UserService users) {
        this.users = users;
    }

    @GetMapping
    public UserDto me() {
        return users.me(CurrentUser.require());
    }

    @PatchMapping
    public UserDto update(@Valid @RequestBody UpdateMeRequest req) {
        return users.update(CurrentUser.require(), req);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete() {
        users.delete(CurrentUser.require());
    }
}
