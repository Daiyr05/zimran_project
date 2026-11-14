package com.hangout.api.user;

import com.hangout.api.common.CurrentUser;
import com.hangout.api.friend.FriendService;
import com.hangout.api.user.UserDtos.Profile;
import com.hangout.api.user.UserDtos.UserSearchResult;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users")
public class UsersController {

    private final UserService users;
    private final FriendService friends;

    public UsersController(UserService users, FriendService friends) {
        this.users = users;
        this.friends = friends;
    }

    @GetMapping("/search")
    public List<UserSearchResult> search(@RequestParam(value = "q", defaultValue = "") String q) {
        return users.search(CurrentUser.require(), q);
    }

    @GetMapping("/{username}")
    public Profile profile(@PathVariable String username) {
        return users.profile(CurrentUser.require(), username);
    }

    /** FR-SOCIAL-5 block (not in SRS 7.1; the frontend needs it). */
    @PostMapping("/{id}/block")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void block(@PathVariable UUID id) {
        friends.block(CurrentUser.require(), id);
    }
}
