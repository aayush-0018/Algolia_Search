// server/queryParser.js
// Robust rule-based query parser for Stapubox
// Returns { query, filters (string), aroundLatLng, aroundRadius, hitsPerPage }

const SPORTS = ["cricket", "football", "badminton", "chess", "swimming", "athletics"];
const BOOL_MAP = {
    "public": "is_public:true",
    "private": "is_public:false",
    "open to join": "open_to_join:true",
    "open_to_join": "open_to_join:true",
    "verified": "verified:true",
    "active": "is_active:true"
};

const DEFAULT_RADIUS_METERS = 10000;

function parseNumberToken(token) {
    // parse numeric token like "1,000", "1000", "1k", "1 lakh", "1l"
    token = (token || "").replace(/,/g, "").toLowerCase().trim();
    if (!token) return null;
    const lakhMatch = token.match(/(\d+(\.\d+)?)\s*(lakh|l|lac)/);
    if (lakhMatch) return Math.round(parseFloat(lakhMatch[1]) * 100000);
    const kMatch = token.match(/(\d+(\.\d+)?)\s*k/);
    if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);
    const num = Number(token);
    if (!isNaN(num)) return num;
    return null;
}

function hourStringTo24(hStr) {
    // convert strings like "10pm", "10 pm", "22:00" to number 0-24
    if (!hStr) return null;
    const m = hStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const ampm = m[3] ? m[3].toLowerCase() : null;
    if (ampm === "pm" && h < 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;
    return h;
}

function extractHashtags(q) {
    const tags = [];
    const re = /#([A-Za-z0-9_]+)/g;
    let m;
    while ((m = re.exec(q)) !== null) tags.push(m[1]);
    return tags;
}

function extractUage(q) {
    // matches "u16", "u-16", "under 16", "under-16", "under 16 years", "under 18"
    const m = q.match(/\bu[-\s]?(\d{1,2})\b/i) || q.match(/\bunder\s+(\d{1,2})\b/i);
    if (m) return Number(m[1]);
    return null;
}

function extractExperience(q) {
    // matches "10 years", "10+ years", "experience > 5", "experience 5", "with experience 5"
    const m = q.match(/experience\s*(?:of)?\s*(?:>=|<=|>|<)?\s*(\d{1,3})/i)
        || q.match(/(\d{1,2})\+?\s*years? (?:experience|exp)/i)
        || q.match(/(\d{1,2})\s*years? experience/i);
    if (m) return Number(m[1]);
    // fallback numeric near coach token later
    return null;
}

function extractNumericComparisons(q) {
    // generic patterns like "under 1000", "less than 500", "below 1000", "above 1000", "greater than 100k"
    const operators = [];
    // under / below => <=
    const under = q.match(/\b(?:under|below|less than|<)\s+([0-9,\.kKmMlL]+)\b/);
    if (under) {
        const n = parseNumberToken(under[1]);
        if (n !== null) operators.push({ fieldHint: null, op: "<=", value: n });
    }
    const above = q.match(/\b(?:above|over|greater than|>|>=)\s+([0-9,\,\.kKmMlL]+)\b/);
    if (above) {
        const n = parseNumberToken(above[1]);
        if (n !== null) operators.push({ fieldHint: null, op: ">=", value: n });
    }

    // currency-like "per session", "entry fee", "entry", "prize pool", "monthly", "monthly price"
    // Examples: "coach under 100 per session", "tournament under 1000 entry fee"
    const pricePerSession = q.match(/coach\s+(?:under|below|<=|<)\s*([0-9,\.kKmMlL]+)\s*(?:per session|session|\/session)?/i);
    if (pricePerSession) {
        const n = parseNumberToken(pricePerSession[1]); if (n != null) operators.push({ fieldHint: "price_per_session", op: "<=", value: n });
    }
    const entryFee = q.match(/\b(?:entry fee|entry|fee)\s*(?:under|below|<=|<|over|above|>=|>)?\s*([0-9,\,\.kKmMlL]+)\b/i);
    if (entryFee) {
        const n = parseNumberToken(entryFee[1]); if (n != null) operators.push({ fieldHint: "entry_fee", op: "<=", value: n });
    }
    // special: "under 1000 entry fee" or "tournament under 1000"
    const tournamentUnder = q.match(/\btournament[s]?\s+(?:under|below)\s+([0-9,\,\.kKmMlL]+)\b/i);
    if (tournamentUnder) { const n = parseNumberToken(tournamentUnder[1]); if (n != null) operators.push({ fieldHint: "entry_fee", op: "<=", value: n }); }

    // monthly price / hostel
    const hostelUnder = q.match(/\b(hostel|hostels|hostel under|residence) (?:under|below)\s*([0-9,\,\.kKmMlL]+)\b/i);
    if (hostelUnder) { const n = parseNumberToken(hostelUnder[2]); if (n != null) operators.push({ fieldHint: "monthly_price", op: "<=", value: n }); }

    // prize pool
    const prizeAbove = q.match(/\b(prize pool|prize)\s*(?:above|over|greater than|>)\s*([0-9,\,\.kKmMlL]+)\b/i);
    if (prizeAbove) { const n = parseNumberToken(prizeAbove[2]); if (n != null) operators.push({ fieldHint: "prize_pool", op: ">=", value: n }); }

    return operators;
}

function detectSport(q) {
    // return sport name if found
    for (const s of SPORTS) {
        const re = new RegExp(`\\b${s}\\b`, "i");
        if (re.test(q)) return s;
    }
    return null;
}

function detectVenueOpenAfter(q) {
    // matches "open after 10pm", "open after 22", "open till 11pm", "open till 23"
    const mAfter = q.match(/open after\s+(\d{1,2}(?::\d{2})?\s*(am|pm)?)/i);
    if (mAfter) return hourStringTo24(mAfter[1]);
    const mTill = q.match(/open (?:till|until)\s+(\d{1,2}(?::\d{2})?\s*(am|pm)?)/i);
    if (mTill) return hourStringTo24(mTill[1]);
    // "open till 11pm" fallback already covered
    return null;
}

function buildFilterString(filtersArray) {
    if (!filtersArray || filtersArray.length === 0) return "";
    // filtersArray elements are expected to be full filters like "type:coach", "experience_years >= 6"
    // Algolia uses format: "type:coach AND experience_years >= 6"
    return filtersArray.join(" AND ");
}

// MAIN parser
function parseQuery(q, opts = {}) {
    const raw = (q || "").trim();
    const lc = raw.toLowerCase();

    const result = {
        query: raw,
        filters: "",
        aroundLatLng: null,
        aroundRadius: null,
        hitsPerPage: opts.hitsPerPage || 20,
        page: opts.page || 0,
        debug: { reasons: [] }
    };

    if (!raw) {
        result.query = "";
        return result;
    }

    // 1. Extract hashtags -> convert to filters on hashtags
    const hashtags = extractHashtags(raw);
    if (hashtags.length) {
        // Algolia stores hashtags without '#', we will OR them
        const hFilters = hashtags.map(tag => `hashtags:${tag}`);
        result.filters = buildFilterString([...(result.filters ? [result.filters] : []), `(${hFilters.join(" OR ")})`]);
        result.debug.reasons.push("hashtags");
    }

    // 2. Extract U-age (U16 / under 16)
    const uage = extractUage(raw);
    if (uage) {
        // add filter age <= uage (players)
        result.filters = buildFilterString([...(result.filters ? [result.filters] : []), `age <= ${uage}`, `type:player`]);
        result.debug.reasons.push("uage");
    }

    // 3. Detect explicit sport mention
    const sport = detectSport(raw);
    if (sport) {
        result.filters = buildFilterString([...(result.filters ? [result.filters] : []), `sport:${sport}`]);
        result.debug.reasons.push("sport");
    }

    // 4. Detect entity type keywords (player, coach, venue, residence, event, squad, company, post)
    const types = [];
    const typeWords = ["player", "coach", "venue", "residence", "event", "tournament", "squad", "company", "post", "hostel", "academy"];
    for (const t of typeWords) if (new RegExp(`\\b${t}s?\\b`, "i").test(raw)) {
        // normalize tournament -> event, hostel -> residence, academy -> company/academy
        if (t === "tournament") types.push("event");
        else if (t === "hostel" || t === "residence") types.push("residence");
        else if (t === "academy") types.push("company");
        else types.push(t);
    }
    if (types.length) {
        // choose first unique
        const uniq = Array.from(new Set(types));
        // put as OR for multiple types? We'll prefer AND with first if single
        const primary = uniq[0];
        result.filters = buildFilterString([...(result.filters ? [result.filters] : []), `type:${primary}`]);
        result.debug.reasons.push("type");
    }

    // 5. Boolean keywords (public/private/open to join/verified)
    for (const phrase of Object.keys(BOOL_MAP)) {
        if (lc.includes(phrase)) {
            const expression = BOOL_MAP[phrase];
            result.filters = buildFilterString([...(result.filters ? [result.filters] : []), expression]);
            result.debug.reasons.push(`bool:${phrase}`);
        }
    }

    // 6. Experience extraction (for coaches)
    const exp = extractExperience(raw);
    if (exp) {
        result.filters = buildFilterString([...(result.filters ? [result.filters] : []), `experience_years >= ${Math.max(1, exp)}`, `type:coach`]);
        result.debug.reasons.push("experience");
    }

    // 7. Numeric comparisons: entry_fee, prize_pool, price_per_session, monthly_price, etc.
    const numericOps = extractNumericComparisons(raw);
    for (const op of numericOps) {
        // op.fieldHint suggests likely field (price_per_session, entry_fee, monthly_price, etc.)
        const field = op.fieldHint || (() => {
            // heuristic based on nearby keywords in query
            if (/entry|fee|tournament/.test(lc)) return "entry_fee";
            if (/prize|prize pool/.test(lc)) return "prize_pool";
            if (/hostel|monthly|per month|monthly price/.test(lc)) return "monthly_price";
            if (/hour|hourly|venue/.test(lc)) return "hourly_price";
            return null;
        })();

        if (field) {
            result.filters = buildFilterString([...(result.filters ? [result.filters] : []), `${field} ${op.op} ${op.value}`]);
            result.debug.reasons.push(`numeric:${field}`);
        }
    }

    // 8. Venue time queries "open after 10pm"
    const openAfter = detectVenueOpenAfter(raw);
    if (openAfter !== null) {
        // We'll add a filter requiring venue_timings.close_hour >= openAfter
        result.filters = buildFilterString([...(result.filters ? [result.filters] : []), `venue_timings.close_hour >= ${openAfter}`]);
        result.debug.reasons.push("openAfter");
    }

    // 9. "near me" or "near <place>"
    if (/\bnear me\b/i.test(raw) && opts.userLat && opts.userLng) {
        result.aroundLatLng = `${opts.userLat},${opts.userLng}`;
        result.aroundRadius = opts.radiusMeters || DEFAULT_RADIUS_METERS;
        result.debug.reasons.push("near_me");
    } else {
        // detect "near <city/area>"
        for (const c of ["mumbai", "delhi", "bangalore", "pune", "hyderabad"]) {
            if (new RegExp(`near\\s+${c}`, "i").test(raw) || new RegExp(`in\\s+${c}`, "i").test(raw)) {
                // you can map city to coordinates or set a filter
                result.filters = buildFilterString([...(result.filters ? [result.filters] : []), `location_city:${c.charAt(0).toUpperCase() + c.slice(1)}`]);
                result.debug.reasons.push("near_city");
            }
        }
    }

    // 10. Hashtag-only queries: if query is just "#CricketTrials" we already added hashtag filter; set query to empty to rely on filters
    if (raw.trim().startsWith("#") && hashtagsMatch(raw)) {
        result.query = ""; // return results that match hashtag filters
        result.debug.reasons.push("hashtag_only");
    }

    // 11. Final fallback: keep the original query as the "query" for full text match
    // BUT we want to remove numeric phrases that we already converted into filters so they don't confuse ranking
    // (optional improvement: strip price numbers from query)
    // For now keep query intact.

    return result;
}

// helper to detect hashtags existence - simple
function hashtagsMatch(q) {
    return /#([A-Za-z0-9_]+)/.test(q);
}

export { parseQuery };