--liquibase formatted sql

--changeset hangout:001-schema
-- SRS section 6 data model. Every table has id (uuid) and created_at; money is integer cents.

CREATE TABLE users (
    id                 uuid PRIMARY KEY,
    email              varchar(120) NOT NULL UNIQUE,
    password_hash      varchar(100),
    name               varchar(60)  NOT NULL,
    username           varchar(20)  NOT NULL UNIQUE,
    photo_url          text,
    home_city          varchar(80)  NOT NULL,
    home_lat           double precision,
    home_lng           double precision,
    tier               varchar(10)  NOT NULL DEFAULT 'FREE',
    profile_visibility varchar(10)  NOT NULL DEFAULT 'FRIENDS',
    is_admin           boolean      NOT NULL DEFAULT false,
    google_sub         varchar(64),
    created_at         timestamptz  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_lower_idx ON users (lower(email));
CREATE UNIQUE INDEX users_username_lower_idx ON users (lower(username));

CREATE TABLE friendships (
    id           uuid PRIMARY KEY,
    requester_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    addressee_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status       varchar(10) NOT NULL,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    UNIQUE (requester_id, addressee_id)
);
CREATE INDEX friendships_addressee_idx ON friendships (addressee_id);

CREATE TABLE places (
    id              uuid PRIMARY KEY,
    google_place_id varchar(255) UNIQUE,
    name            varchar(200) NOT NULL,
    address         varchar(300) NOT NULL,
    lat             double precision NOT NULL,
    lng             double precision NOT NULL,
    types           text[]       NOT NULL DEFAULT '{}',
    primary_type    varchar(60)  NOT NULL,
    rating          double precision,
    review_count    integer      NOT NULL DEFAULT 0,
    price_level     smallint,
    opening_hours   jsonb,
    website         text,
    phone           varchar(40),
    photo_url       text,
    kid_friendly    boolean      NOT NULL DEFAULT false,
    vegetarian      boolean      NOT NULL DEFAULT false,
    reservable      boolean      NOT NULL DEFAULT false,
    outdoor         boolean      NOT NULL DEFAULT false,
    serves_alcohol  boolean      NOT NULL DEFAULT false,
    kind            varchar(10)  NOT NULL,
    fetched_at      timestamptz  NOT NULL DEFAULT now(),
    created_at      timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX places_lat_lng_idx ON places (lat, lng);

CREATE TABLE place_moods (
    id           uuid PRIMARY KEY,
    place_id     uuid NOT NULL REFERENCES places (id) ON DELETE CASCADE,
    mood         varchar(12) NOT NULL,
    type_score   double precision NOT NULL DEFAULT 0,
    moment_score double precision NOT NULL DEFAULT 0,
    UNIQUE (place_id, mood)
);

CREATE TABLE sessions (
    id               uuid PRIMARY KEY,
    code             varchar(8)  NOT NULL UNIQUE,
    organizer_id     uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status           varchar(10) NOT NULL DEFAULT 'OPEN',
    organizer_inputs jsonb       NOT NULL,
    search_id        uuid,
    winning_plan_id  uuid,
    expires_at       timestamptz NOT NULL,
    generated_at     timestamptz,
    created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE session_members (
    id           uuid PRIMARY KEY,
    session_id   uuid NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
    user_id      uuid REFERENCES users (id) ON DELETE SET NULL,
    display_name varchar(30) NOT NULL,
    is_organizer boolean     NOT NULL DEFAULT false,
    inputs       jsonb,
    has_answered boolean     NOT NULL DEFAULT false,
    member_token varchar(64) NOT NULL UNIQUE,
    created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX session_members_session_idx ON session_members (session_id);

CREATE TABLE searches (
    id          uuid PRIMARY KEY,
    user_id     uuid REFERENCES users (id) ON DELETE CASCADE,
    session_id  uuid REFERENCES sessions (id) ON DELETE CASCADE,
    inputs      jsonb       NOT NULL,
    seed        bigint      NOT NULL,
    month_key   varchar(10) NOT NULL,
    start_lat   double precision NOT NULL,
    start_lng   double precision NOT NULL,
    start_label varchar(200) NOT NULL,
    party_size  integer     NOT NULL DEFAULT 1,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX searches_user_month_idx ON searches (user_id, month_key);

CREATE TABLE plans (
    id               uuid PRIMARY KEY,
    search_id        uuid        NOT NULL REFERENCES searches (id) ON DELETE CASCADE,
    rank             integer     NOT NULL,
    shape            varchar(40) NOT NULL,
    total_minutes    integer     NOT NULL,
    total_cents      integer     NOT NULL,
    per_person_cents integer     NOT NULL,
    places_cents     integer     NOT NULL DEFAULT 0,
    tax_cents        integer     NOT NULL DEFAULT 0,
    tip_cents        integer     NOT NULL DEFAULT 0,
    travel_cents     integer     NOT NULL DEFAULT 0,
    reasons          text[]      NOT NULL DEFAULT '{}',
    saved            boolean     NOT NULL DEFAULT false,
    saved_at         timestamptz,
    created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX plans_search_idx ON plans (search_id);

CREATE TABLE plan_stops (
    id             uuid PRIMARY KEY,
    plan_id        uuid NOT NULL REFERENCES plans (id) ON DELETE CASCADE,
    position       integer NOT NULL,
    place_id       uuid NOT NULL REFERENCES places (id),
    arrive_at      timestamptz NOT NULL,
    depart_at      timestamptz NOT NULL,
    est_cost_cents integer NOT NULL
);
CREATE INDEX plan_stops_plan_idx ON plan_stops (plan_id);

CREATE TABLE plan_legs (
    id             uuid PRIMARY KEY,
    plan_id        uuid NOT NULL REFERENCES plans (id) ON DELETE CASCADE,
    position       integer NOT NULL,
    from_label     varchar(200) NOT NULL,
    to_label       varchar(200) NOT NULL,
    mode           varchar(10) NOT NULL,
    minutes        integer NOT NULL,
    est_cost_cents integer NOT NULL,
    member_id      uuid
);
CREATE INDEX plan_legs_plan_idx ON plan_legs (plan_id);

ALTER TABLE sessions ADD CONSTRAINT sessions_search_fk FOREIGN KEY (search_id) REFERENCES searches (id) ON DELETE SET NULL;
ALTER TABLE sessions ADD CONSTRAINT sessions_winner_fk FOREIGN KEY (winning_plan_id) REFERENCES plans (id) ON DELETE SET NULL;

CREATE TABLE votes (
    id         uuid PRIMARY KEY,
    session_id uuid NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
    member_id  uuid NOT NULL REFERENCES session_members (id) ON DELETE CASCADE,
    plan_id    uuid NOT NULL REFERENCES plans (id) ON DELETE CASCADE,
    liked      boolean NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (member_id, plan_id)
);

CREATE TABLE moments (
    id             uuid PRIMARY KEY,
    author_id      uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    place_id       uuid NOT NULL REFERENCES places (id),
    plan_id        uuid REFERENCES plans (id) ON DELETE SET NULL,
    visit_date     date NOT NULL,
    hide_date      varchar(5)  NOT NULL DEFAULT 'NONE',
    rating         smallint    NOT NULL,
    opinion        varchar(1000) NOT NULL DEFAULT '',
    would_go_again boolean     NOT NULL DEFAULT true,
    spent_cents    integer     NOT NULL DEFAULT 0,
    spent_basis    varchar(10) NOT NULL DEFAULT 'TOTAL',
    share_to_place boolean     NOT NULL DEFAULT false,
    verified_visit boolean     NOT NULL DEFAULT false,
    hidden         boolean     NOT NULL DEFAULT false,
    report_count   integer     NOT NULL DEFAULT 0,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX moments_author_idx ON moments (author_id, created_at DESC);
CREATE INDEX moments_place_idx ON moments (place_id);

CREATE TABLE moment_photos (
    moment_id uuid NOT NULL REFERENCES moments (id) ON DELETE CASCADE,
    url       text NOT NULL,
    position  integer NOT NULL,
    PRIMARY KEY (moment_id, position)
);

CREATE TABLE moment_moods (
    moment_id uuid NOT NULL REFERENCES moments (id) ON DELETE CASCADE,
    mood      varchar(12) NOT NULL,
    PRIMARY KEY (moment_id, mood)
);

CREATE TABLE moment_tags (
    id             uuid PRIMARY KEY,
    moment_id      uuid NOT NULL REFERENCES moments (id) ON DELETE CASCADE,
    tagged_user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status         varchar(10) NOT NULL DEFAULT 'PENDING',
    UNIQUE (moment_id, tagged_user_id)
);

CREATE TABLE reports (
    id          uuid PRIMARY KEY,
    moment_id   uuid NOT NULL REFERENCES moments (id) ON DELETE CASCADE,
    reporter_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    reason      varchar(500) NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (moment_id, reporter_id)
);

CREATE TABLE subscriptions (
    id                uuid PRIMARY KEY,
    user_id           uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    stripe_session_id varchar(255),
    status            varchar(20) NOT NULL,
    started_at        timestamptz NOT NULL DEFAULT now(),
    created_at        timestamptz NOT NULL DEFAULT now()
);
