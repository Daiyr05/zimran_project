package com.hangout.api.friend;

import com.hangout.api.common.CurrentUser;
import com.hangout.api.friend.FriendDtos.FriendsResponse;
import com.hangout.api.friend.FriendDtos.SendRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/friends")
@Tag(name = "Friends")
public class FriendController {

    private final FriendService friends;

    public FriendController(FriendService friends) {
        this.friends = friends;
    }

    @GetMapping
    public FriendsResponse list() {
        return friends.list(CurrentUser.require());
    }

    @PostMapping("/requests")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void send(@Valid @RequestBody SendRequest body) {
        friends.sendRequest(CurrentUser.require(), body.username());
    }

    @PostMapping("/requests/{id}/accept")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void accept(@PathVariable UUID id) {
        friends.accept(CurrentUser.require(), id);
    }

    @PostMapping("/requests/{id}/decline")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void decline(@PathVariable UUID id) {
        friends.decline(CurrentUser.require(), id);
    }

    @DeleteMapping("/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable UUID userId) {
        friends.remove(CurrentUser.require(), userId);
    }
}
