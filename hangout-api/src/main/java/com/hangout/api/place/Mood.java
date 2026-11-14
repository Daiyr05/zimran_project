package com.hangout.api.place;

/** The 8 moods shared by frontend, API and database (SRS section 6). */
public enum Mood { COZY, ROMANTIC, PLAYFUL, ADVENTUROUS, CHILL, FANCY, CULTURAL, ACTIVE;

    public String title() {
        return name().charAt(0) + name().substring(1).toLowerCase();
    }
}
