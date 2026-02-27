/**
 * generate_advanced_1000.js
 *
 * Corrected & final advanced Stapubox dataset generator (≥1000 records).
 *
 * Fixes:
 * - Replaced accidental `rand()` boolean calls with `Math.random()` where appropriate.
 * - Added a defensive `rand()` implementation that validates input arrays.
 * - Ensures numeric fields are numbers (not strings).
 *
 * Usage:
 * 1) If you use ES modules (imports) make sure package.json contains: { "type": "module" }
 *    or rename file to generate_advanced_1000.mjs and run `node generate_advanced_1000.mjs`
 * 2) Run: `node generate_advanced_1000.js`
 *
 * Output: advanced_structured_1000.json
 */

import fs from "fs";

const cities = [
  { city: "Mumbai", state: "Maharashtra", lat: 19.076, lng: 72.877 },
  { city: "Delhi", state: "Delhi", lat: 28.7041, lng: 77.1025 },
  { city: "Bangalore", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
  { city: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
  { city: "Hyderabad", state: "Telangana", lat: 17.385, lng: 78.4867 }
];

const sports = [
  { name: "cricket", roles: ["left handed batsman", "right handed batsman", "fast bowler", "spin bowler", "all rounder", "wicketkeeper"] },
  { name: "football", roles: ["striker", "goalkeeper", "defender", "midfielder"] },
  { name: "badminton", roles: ["singles specialist", "doubles expert", "mixed doubles"] },
  { name: "chess", roles: ["rated 1400", "rated 1600", "rated 1800", "rated 2000"] },
  { name: "swimming", roles: ["freestyle sprinter", "butterfly", "backstroke", "breaststroke"] },
  { name: "athletics", roles: ["sprinter", "middle distance", "long distance", "jumper"] }
];

const accolades = ["district level", "state level", "national medalist"];
const competitiveLevels = ["beginner", "intermediate", "elite"];
const residenceFeaturesPool = ["AC", "non AC", "diet plan", "gym access", "near stadium", "laundry included"];
const facilitiesPool = ["parking", "floodlights", "gym", "indoor", "synthetic turf", "shower", "locker room"];
const companyTypes = ["academy", "equipment", "management", "sponsor"];
const hashtags = ["CricketTrials", "FootballTournament", "ViralSpike", "MatchHighlights", "JuniorCamp", "OpenTrials"];

const experienceBuckets = [
  [1, 3],
  [4, 7],
  [8, 12],
  [13, 20]
];

const ageBuckets = [12, 14, 16, 18, 21, 25]; // to create U12..U25
const feeBuckets = [100, 300, 800, 1500, 3000, 7000]; // helps generate <100, <1000 etc
const prizeBuckets = [10000, 30000, 100000, 300000, 800000];
const hostelBuckets = [3000, 5000, 8000, 11000];

let records = [];
let id = 1;

/* ---- helpers ---- */
function rand(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error("rand() requires a non-empty array argument");
  }
  return arr[Math.floor(Math.random() * arr.length)];
}
function randNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function floatRand(min, max, decimals = 1) {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}
function popularity() {
  return randNum(100, 5000);
}
function rating() {
  return Number((randNum(30, 50) / 10).toFixed(1)); // 3.0 - 5.0
}
function makeSearchBlob(parts) {
  // join and dedupe small set, return lowercased string
  const txt = parts.filter(Boolean).join(" ");
  return txt.replace(/\s+/g, " ").trim().toLowerCase();
}
function jitterLatLng(lat, lng, meters = 800) {
  // simple jitter: offset by up to ~meters in degrees (~111km per degree)
  const km = meters / 1000;
  const degLat = km / 111;
  const degLng = km / (111 * Math.cos(lat * Math.PI / 180));
  const newLat = lat + (Math.random() * 2 - 1) * degLat;
  const newLng = lng + (Math.random() * 2 - 1) * degLng;
  return { lat: Number(newLat.toFixed(6)), lng: Number(newLng.toFixed(6)) };
}

// Helper to build many synonyms/phrases for search_blob to increase match
function buildPhrases({ sport, role, city, age, accolade, exp, fee, prize, closeHour, price, teamSize, companyType, hashtag }) {
  const phrases = [];

  if (sport) {
    phrases.push(sport);
    phrases.push(`${sport} player`);
    phrases.push(`${sport} coach`);
    phrases.push(`${sport} tournament`);
    phrases.push(`${sport} ground`);
    phrases.push(`${sport} academy`);
  }
  if (role) {
    phrases.push(role);
    phrases.push(`${role} specialist`);
    phrases.push(`${role} training`);
  }
  if (city) {
    phrases.push(city);
    phrases.push(`${city} ${sport}`);
    phrases.push(`${city} sports`);
    phrases.push(`near ${city}`);
  }
  if (age) {
    phrases.push(`${age} years`);
    if (age <= 16) {
      phrases.push(`u${age}`);
      phrases.push(`under ${age}`);
      phrases.push(`junior`);
    } else {
      phrases.push(`senior`);
    }
  }
  if (accolade) {
    phrases.push(accolade);
    phrases.push(`${accolade} ${sport} player`);
  }
  if (typeof exp === "number") {
    phrases.push(`${exp} years experience`);
    phrases.push(`${exp}+ years`);
    if (exp >= 10) phrases.push("experienced coach");
  }
  if (typeof fee === "number") {
    phrases.push(`entry fee ${fee}`);
    if (fee <= 1000) phrases.push("under 1000");
    if (fee <= 500) phrases.push("cheap tournament");
  }
  if (typeof prize === "number") {
    phrases.push(`prize ${prize}`);
    if (prize >= 100000) phrases.push("prize pool above 1 lakh");
  }
  if (typeof closeHour === "number") {
    phrases.push(`open till ${closeHour}`);
    if (closeHour >= 22) phrases.push("open after 10pm");
    if (closeHour >= 23) phrases.push("late night");
  }
  if (typeof price === "number") {
    phrases.push(`price ${price}`);
    if (price <= 500) phrases.push("cheap coach");
    if (price <= 100) phrases.push("coach under 100 per session", "very cheap coach");
    if (price <= 2000) phrases.push("affordable");
  }
  if (teamSize) {
    phrases.push(`${teamSize} players`);
    if (teamSize >= 20) phrases.push("more than 20 players", "large squad");
  }
  if (companyType) {
    phrases.push(companyType);
    phrases.push(`${companyType} company`);
  }
  if (hashtag) {
    phrases.push(`#${hashtag}`);
    phrases.push(`${hashtag.toLowerCase()}`);
  }

  // general intent keywords
  phrases.push("trials", "tryouts", "open trials", "join now", "public", "private", "open to join", "book now", "near me", "best", "top rated", "verified", "affordable", "cheap", "premium");

  // dedupe and return
  return Array.from(new Set(phrases)).join(" ");
}

/* Distribution plan:
   players: 12 ages (balanced)
   coaches: 6 (experience buckets)
   events: 6 (fee/prize combos)
   venues: 4
   residences: 4
   squads: 4
   companies: 3
   posts: 4
   -> ~43 records per city×sport combo -> 5 cities × 6 sports × 43 = ~1290 records
*/

for (const city of cities) {
  for (const sportObj of sports) {
    const sport = sportObj.name;

    // PLAYERS (12 per sport per city)
    for (let aI = 0; aI < 12; aI++) {
      const age = rand(ageBuckets);
      const role = rand(sportObj.roles);
      const accolade = rand(accolades);
      const geo = jitterLatLng(city.lat, city.lng, randNum(50, 2000));
      const verified = Math.random() > 0.5;
      const social_shares = randNum(0, 5000);
      const reviews_count = randNum(0, 200);

      const blob = buildPhrases({ sport, role, city: city.city, age, accolade });

      records.push({
        objectID: `player_${id++}`,
        type: "player",
        name: `${sport}_${role}_${city.city}_${age}_${id}`,
        slug: `${sport}-${role}-${city.city}-${id}`,
        sport: [sport],
        skills: [role],
        accolades: [accolade],
        certifications: Math.random() > 0.8 ? ["state coach certified"] : [],
        age,
        gender: rand(["male", "female", "other"]),
        location_city: city.city,
        location_area: rand(["Central", "East", "West", "North", "South"]),
        location_state: city.state,
        location_country: "India",
        _geoloc: geo,
        popularity_score: popularity(),
        rating: rating(),
        reviews_count,
        social_shares,
        verified,
        is_active: true,
        content_body: `${role} training, plays ${sport}, ${accolade}. Available for trials.`,
        search_blob: makeSearchBlob([blob, "player profile", "youth", "academy trained"])
      });
    }

    // COACHES (6 per sport per city)
    for (let cI = 0; cI < 6; cI++) {
      const bucket = experienceBuckets[cI % experienceBuckets.length];
      const exp = randNum(bucket[0], bucket[1]);
      let price;
      // ensure some coaches under 100 exist intentionally
      if (cI === 0) price = randNum(50, 120); // cheap coaches
      else if (cI <= 2) price = randNum(200, 800);
      else price = randNum(900, 3500);

      const geo = jitterLatLng(city.lat, city.lng, randNum(50, 1500));
      const languages = randNum(1, 3) === 1 ? ["english"] : ["english", "hindi"];
      const certs = (Math.random() > 0.4) ? [`${sport.toUpperCase()} certified`, "level 2"] : [`${sport.toUpperCase()} certified`];
      const verified = Math.random() > 0.6;
      const lessons = randNum(100, 500);

      const blob = buildPhrases({ sport, exp, price, city: city.city });

      records.push({
        objectID: `coach_${id++}`,
        type: "coach",
        name: `${sport}_coach_${exp}yrs_${city.city}_${id}`,
        slug: `coach-${sport}-${city.city}-${id}`,
        sport: [sport],
        certifications: certs,
        experience_years: exp,
        languages,
        price_per_session: price,
        price_currency: "INR",
        availability: {
          days: randNum(5, 7),
          times: ["6:00-8:00", "17:00-21:00"]
        },
        location_city: city.city,
        location_area: rand(["Central", "East", "West", "North", "South"]),
        location_state: city.state,
        _geoloc: geo,
        popularity_score: popularity(),
        rating: rating(),
        reviews_count: randNum(0, 300),
        verified,
        is_active: true,
        content_body: `Coach with ${exp} years experience in ${sport}. Specializes in ${rand(sportObj.roles)}.`,
        search_blob: makeSearchBlob([blob, "private coach", "group coaching", "one-on-one", "trial session", price <= 100 ? "coach under 100 per session" : null])
      });
    }

    // EVENTS (6 per sport per city)
    for (let eI = 0; eI < 6; eI++) {
      const level = competitiveLevels[eI % competitiveLevels.length];
      const fee = feeBuckets[eI % feeBuckets.length];
      const prize = prizeBuckets[eI % prizeBuckets.length];
      const format = rand(["knockout", "league", "round robin"]);
      const startOffsetDays = randNum(1, 90);
      const durationDays = randNum(1, 5);
      const minAge = rand([12, 14, 16]);
      const maxAge = minAge + randNum(2, 10);
      const geo = jitterLatLng(city.lat, city.lng, randNum(100, 3000));
      const is_online = Math.random() > 0.9;

      const blob = buildPhrases({ sport, fee, prize, city: city.city });

      records.push({
        objectID: `event_${id++}`,
        type: "event",
        name: `${sport}_${level}_event_${city.city}_${eI}_${id}`,
        slug: `event-${sport}-${level}-${city.city}-${id}`,
        sport: [sport],
        entry_fee: fee,
        prize_pool: prize,
        competitive_level: level,
        event_format: format,
        min_age: minAge,
        max_age: maxAge,
        start_date: Date.now() + startOffsetDays * 24 * 60 * 60 * 1000,
        end_date: Date.now() + (startOffsetDays + durationDays) * 24 * 60 * 60 * 1000,
        location_city: city.city,
        location_state: city.state,
        _geoloc: geo,
        popularity_score: popularity(),
        rating: rating(),
        ticket_url: is_online ? `https://tickets.example.com/${id}` : null,
        is_online,
        content_body: `${sport} ${level} event in ${city.city}. Format: ${format}. Entry: ${fee}. Prize: ${prize}`,
        search_blob: makeSearchBlob([blob, level, format, "open to all", is_online ? "online" : "in-person", `min age ${minAge}`, `max age ${maxAge}`])
      });
    }

    // VENUES (4 per sport per city)
    for (let vI = 0; vI < 4; vI++) {
      const closeHour = [20, 22, 23, 24][vI % 4];
      const hourly = randNum(600, 4500);
      const facs = facilitiesPool.slice(0, randNum(2, facilitiesPool.length));
      const geo = jitterLatLng(city.lat, city.lng, randNum(50, 2000));
      const indoor = facs.includes("indoor");

      const blob = buildPhrases({ sport, closeHour, city: city.city, price: hourly });

      records.push({
        objectID: `venue_${id++}`,
        type: "venue",
        name: `${sport}_venue_${city.city}_${closeHour}_${id}`,
        slug: `venue-${sport}-${city.city}-${id}`,
        sport: [sport],
        facilities: facs,
        hourly_price: hourly,
        venue_timings: { open_hour: 6, close_hour: closeHour },
        booking_url: `https://book.example.com/${id}`,
        location_city: city.city,
        location_area: rand(["Central", "East", "West", "North", "South"]),
        location_state: city.state,
        _geoloc: geo,
        popularity_score: popularity(),
        rating: rating(),
        verified: Math.random() > 0.6,
        is_active: true,
        content_body: `${sport} venue with ${facs.join(", ")}. Available ${indoor ? "indoor" : "outdoor"}.`,
        search_blob: makeSearchBlob([blob, indoor ? "indoor" : "outdoor", "floodlights", "book now", "near stadium"])
      });
    }

    // RESIDENCES (4 per sport per city)
    for (let rI = 0; rI < 4; rI++) {
      const price = hostelBuckets[rI % hostelBuckets.length];
      const features = residenceFeaturesPool.slice(0, randNum(1, residenceFeaturesPool.length));
      const geo = jitterLatLng(city.lat, city.lng, randNum(200, 4000));
      const blob = buildPhrases({ sport, price, city: city.city });

      records.push({
        objectID: `residence_${id++}`,
        type: "residence",
        name: `${sport}_hostel_${city.city}_${price}_${id}`,
        slug: `res-${sport}-${city.city}-${id}`,
        monthly_price: price,
        residence_features: features,
        location_city: city.city,
        location_area: rand(["Near Stadium", "Central", "College Area", "Suburbs"]),
        location_state: city.state,
        _geoloc: geo,
        popularity_score: popularity(),
        rating: rating(),
        contactless_checkin: Math.random() > 0.6,
        content_body: `Athlete hostel ${features.join(", ")}. Monthly ${price}.`,
        search_blob: makeSearchBlob([blob, "athlete hostel", features.join(" "), `under ${price}`, "near stadium", "ac room"])
      });
    }

    // SQUADS (4 per sport per city)
    for (let sI = 0; sI < 4; sI++) {
      const size = [12, 18, 25, 30][sI % 4];
      const isPublic = Math.random() > 0.4;
      const openToJoin = isPublic ? Math.random() > 0.3 : Math.random() > 0.7;
      const geo = jitterLatLng(city.lat, city.lng, randNum(100, 2500));
      const blob = buildPhrases({ sport, teamSize: size, city: city.city });

      records.push({
        objectID: `squad_${id++}`,
        type: "squad",
        name: `${sport}_squad_${city.city}_${size}_${id}`,
        slug: `squad-${sport}-${city.city}-${id}`,
        sport: [sport],
        team_size: size,
        is_public: isPublic,
        open_to_join: openToJoin,
        location_city: city.city,
        location_state: city.state,
        _geoloc: geo,
        popularity_score: popularity(),
        rating: rating(),
        practice_schedule: ["Tue 18:00-20:00", "Thu 18:00-20:00", "Sat 08:00-11:00"],
        content_body: `Team training ${size} players. ${isPublic ? "Public" : "Private"} squad.`,
        search_blob: makeSearchBlob([blob, isPublic ? "public squad" : "private squad", openToJoin ? "open to join" : "closed", "join now"])
      });
    }

    // COMPANIES (3 per sport per city)
    for (let cI = 0; cI < 3; cI++) {
      const type = companyTypes[cI % companyTypes.length];
      const geo = jitterLatLng(city.lat, city.lng, randNum(100, 3000));
      const blob = buildPhrases({ sport, companyType: type, city: city.city });

      records.push({
        objectID: `company_${id++}`,
        type: "company",
        name: `${sport}_${type}_company_${city.city}_${id}`,
        slug: `company-${sport}-${type}-${city.city}-${id}`,
        company_type: type,
        sport: [sport],
        services: type === "academy" ? ["training", "coaching", "trials"] : (type === "equipment" ? ["retail", "wholesale"] : ["management", "sponsorship"]),
        location_city: city.city,
        location_state: city.state,
        _geoloc: geo,
        popularity_score: popularity(),
        rating: rating(),
        verified: Math.random() > 0.5,
        content_body: `${type} offering ${sport} services in ${city.city}.`,
        search_blob: makeSearchBlob([blob, type, `${sport} services`, "professional services"])
      });
    }

    // POSTS (4 per sport per city)
    for (let pI = 0; pI < 4; pI++) {
      const tag = rand(hashtags);
      const postType = rand(["highlight", "viral", "news", "announcement"]);
      const geo = jitterLatLng(city.lat, city.lng, randNum(50, 2000));
      const social_shares = randNum(0, 20000);
      const blob = buildPhrases({ sport, hashtag: tag, city: city.city });

      records.push({
        objectID: `post_${id++}`,
        type: "post",
        name: `${sport}_${postType}_${tag}_${city.city}_${id}`,
        slug: `post-${sport}-${postType}-${tag}-${city.city}-${id}`,
        post_type: postType,
        hashtags: [tag],
        sport: [sport],
        location_city: city.city,
        location_state: city.state,
        _geoloc: geo,
        popularity_score: popularity(),
        rating: rating(),
        social_shares,
        content_body: `${postType} about ${sport} in ${city.city}. Tag: ${tag}`,
        search_blob: makeSearchBlob([blob, postType, "match highlights", "viral", "latest"])
      });
    }
  }
}

// Final safety: ensure numeric types and reasonable sizes, then write to disk
console.log("Generated records before trimming:", records.length);

// If the generator produced fewer than 1000 records, fail loudly.
if (records.length < 1000) {
  throw new Error("Generator produced fewer than 1000 records — adjust distribution.");
}

// write file
const outFile = "advanced_structured_1000.json";
fs.writeFileSync(outFile, JSON.stringify(records, null, 2));
console.log(`Advanced structured dataset generated: ${records.length} records -> ${outFile}`);