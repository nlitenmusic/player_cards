Player Cards — authoritative context

Project root: products/player-cards-next

Core concept
- CPAST components per skill: C (Consistency), P (Power), A (Accuracy), S (Spin), T (Technique).
- Each session produces 7 skill rows: Serve, Return, Forehand, Backhand, Volley, Overhead, Movement.
- Movement only contains the T value.

Important constants (single source of truth)
- Skill labels (7, ordered):
  1. Serve
  2. Return
  3. Forehand
  4. Backhand
  5. Volley
  6. Overhead
  7. Movement

- MICRO (rating step): 3
  Use to compute tiers/levels: level = floor(rating / MICRO)

  Macro tiers (used as tier names and to choose colors)
- Explorer, Rally Starter, Emerging Player, Developing Player, Match Player,
  Growth Player, Competitor, Advanced Competitor, Performance Player,
  Elite Performer, College Performance, Professional Track

- Rank color mapping (JS hex)
    Explorer: #b76e2a
    Rally Starter: #9ca3af
    Emerging Player: #FFD700
    Developing Player: #00b4d8
    Match Player: #7c3aed
    Growth Player: #ef4444
    Competitor: #111827
    Advanced Competitor: #0b1220
    Performance Player: #10b981
    Elite Performer: #a78bfa
    College Performance: #f59e0b
    Professional Track: #06b6d4

Authoritative backend shapes (Supabase)
- players
  - id (uuid), first_name, last_name, sessions_count, avg_rating, row_averages (array or object), created_at, updated_at
- sessions
  - id (uuid), player_id (fk), session_date (date), notes, created_at
- session_stats
  - id (uuid), session_id (fk), skill_type (text — MUST TRIM), c (real|null), p (real|null), a (real|null), s (real|null), t (real|null)

Important rules
- Always normalize skill_type: skill_type = String(skill_type ?? "").trim()
- When computing a skill score, average only non-null components. Null ≠ 0.
  JS pattern: present = [c,p,a,s,t].filter(v => v != null); avg = present.length ? sum(present)/present.length : 0
- Movement (authoritative): When the normalized `skill_type` === "Movement", the displayed/computed skill MUST be derived exclusively from the `t` (Technique) component. Do NOT include `c`, `p`, `a`, or `s` in any averaging or aggregation for Movement. Treat missing or empty `t` as `NULL` (not zero).
- Treat legacy zeros for missing components as candidate noise; prefer converting zeros→NULL when appropriate.


Backend API (important endpoints)
- GET /api/players
  - Returns: { players: [ { id, first_name, last_name, sessions_count, avg_rating, row_averages, sessions } ] }
  - Note: `row_averages` is an array of per-skill averages (order matches Skill labels), but code accepts either `row_averages` (array) or `rowAverages` or keyed object — front-end normalizes it:
    const rowAverages = player.row_averages ?? player.rowAverages ?? []

- GET /api/admin/player-latest-stats?player_id=<id>
  - Returns { stats: [ { skill_type, c, p, a, s, t } ... ], session_date }
  - Purpose: modal prefills C/P/A/S/T components for the latest session.

- POST /api/admin/create-session
  - Accepts { player_id, session_date (YYYY-MM-DD), stats_components: [ { skill_type, c, p, a, s, t } x7 ] }
  - Backend inserts sessions row then one session_stats row per skill_type (components saved as c,p,a,s,t).
  - Backend normalizes skill_type with trim() and lower-case checks; valid skill keys: serve, return, forehand, backhand, volley, overhead, movement.

Averaging rules (authoritative)
- When computing a skill's displayed score, average only the non-null components.
  - Movement (strict): For any row where the normalized `skill_type` is "Movement", the computed/displayed score MUST be the `t` component only. Do NOT include `c`, `p`, `a`, or `s` in any averaging or aggregation for Movement. If `t` is missing or empty, treat it as `NULL` rather than `0`.
- Frontend and backend must agree: treat missing components as NULL (not zero).
- Implementation detail (JS):
  - Movement: `computed = r.t ?? null` (or `0` only for display fallbacks, but keep `NULL` semantics internally);
  - Other skills: `present = [r.c, r.p, r.a, r.s, r.t].filter(v => v != null); computed = present.length ? sum(present)/present.length : 0`

Frontend rules & components
- Shared `PlayerCard` component props:
  interface PlayerCardProps {
    player: any;
    isAdmin?: boolean;
    isTop?: boolean;
    maxStats?: Record<string, number>;
    onAddStats?: (player:any)=>void;
    onEditPlayer?: (player:any)=>void;
  }

- Admin vs User:
  - Admin UI shows edit controls (+ Stats, Edit) and an AddSession modal that sends C/P/A/S/T values.
  - User UI is read-only and consumes aggregated `avg_rating` and `row_averages`.

- Always prefer keyed lookup by skill name when possible (trim and lowercase skill_type).
  If backend returns an array, assume it follows the skill label order above.

Notes about common pitfalls
- DB rows sometimes have trailing spaces in skill_type (e.g., "Volley "). Always trim.
- Historical imports may have zeros for missing components; prefer converting zeros to NULL for Movement rows.

