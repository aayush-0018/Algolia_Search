// generate_advanced_1000.js
// Production-aligned dataset generator (NO search_blob)
// Node 14+ (set "type":"module" in package.json if using import syntax)

import fs from "fs";

/* ---------- Config ---------- */
const cities = [
  { city: "Mumbai", state: "Maharashtra", lat: 19.076, lng: 72.877 },
  { city: "Delhi", state: "Delhi", lat: 28.7041, lng: 77.1025 },
  { city: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
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

const experienceBuckets = [[1, 3], [4, 7], [8, 12], [13, 20]];
const ageBuckets = [12, 14, 16, 18, 21, 25];
const feeBuckets = [100, 300, 800, 1500, 3000, 7000];
const prizeBuckets = [10000, 30000, 100000, 300000, 800000];
const hostelBuckets = [3000, 5000, 8000, 11000];

/* ---------- Name Pools ---------- */
const maleFirst = ["Rohit", "Virat", "Sachin", "Saurabh", "Amit", "Vijay", "Rahul", "Arjun", "Rohan", "Siddharth", "Aniket", "Karan", "Dev", "Manish", "Ravi"];
const femaleFirst = ["Pooja", "Ananya", "Priya", "Neha", "Isha", "Kavya", "Shruti", "Ritika", "Meera", "Sneha", "Shreya", "Lakshmi", "Kriti"];
const lastNames = ["Sharma", "Verma", "Gupta", "Patel", "Singh", "Kumar", "Jain", "Agarwal", "Mehta", "Rao", "Reddy", "Nair", "Iyer", "Das", "Bose", "Chopra", "Malhotra", "Jha", "Khan", "Kapoor", "Joshi", "Shah", "Pillai", "Ghosh", "Pandey"];

/* ---------- Helpers ---------- */
function rand(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randNum(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function popularity() { return randNum(100, 5000) }
function rating() { return Number((randNum(30, 50) / 10).toFixed(1)) }

function jitterLatLng(lat, lng, meters = 800) {
  const km = meters / 1000;
  const degLat = km / 111;
  const degLng = km / (111 * Math.cos(lat * Math.PI / 180));
  return {
    lat: Number((lat + (Math.random() * 2 - 1) * degLat).toFixed(6)),
    lng: Number((lng + (Math.random() * 2 - 1) * degLng).toFixed(6))
  }
}

function genIndianName(preferGender = null) {
  const useMale = preferGender ? preferGender === "male" : Math.random() < 0.5;
  const first = useMale ? rand(maleFirst) : rand(femaleFirst);
  const last = rand(lastNames);
  return { first_name: first, last_name: last, full_name: `${first} ${last}` };
}

/* ---------- Generator ---------- */
let records = [];
let id = 1;

for (const city of cities) {
  for (const sportObj of sports) {
    const sport = sportObj.name;

    // PLAYERS
    for (let i = 0; i < 12; i++) {
      const { first_name, last_name, full_name } = genIndianName();
      const geo = jitterLatLng(city.lat, city.lng, randNum(50, 2000));
      records.push({
        objectID: `player_${id}`,
        type: "player",
        first_name,
        last_name,
        full_name,
        sport: [sport],
        positions: [rand(sportObj.roles)],
        age: rand(ageBuckets),
        handedness: Math.random() > 0.5 ? "right" : "left",
        accolades: Math.random() > 0.6 ? [rand(accolades)] : [],
        location_city: city.city,
        location_state: city.state,
        _geoloc: geo,
        popularity_score: popularity(),
        rating: rating(),
        verified: Math.random() > 0.6
      });
      id++;
    }

    // COACHES
    for (let i = 0; i < 6; i++) {
      const { first_name, last_name, full_name } = genIndianName("male");
      const geo = jitterLatLng(city.lat, city.lng, randNum(50, 1500));
      const bucket = experienceBuckets[i % experienceBuckets.length];
      records.push({
        objectID: `coach_${id}`,
        type: "coach",
        first_name,
        last_name,
        full_name,
        sport: [sport],
        experience_years: randNum(bucket[0], bucket[1]),
        price_per_session: randNum(100, 3000),
        languages: ["english", "hindi"],
        location_city: city.city,
        location_state: city.state,
        _geoloc: geo,
        popularity_score: popularity(),
        rating: rating(),
        verified: Math.random() > 0.6
      });
      id++;
    }

    // EVENTS
    for (let i = 0; i < 6; i++) {
      const geo = jitterLatLng(city.lat, city.lng, randNum(100, 3000));
      records.push({
        objectID: `event_${id}`,
        type: "event",
        title: `${sport.toUpperCase()} ${rand(["Cup", "Tournament", "Meet"])}`,
        sport: [sport],
        competitive_level: rand(competitiveLevels),
        entry_fee: rand(feeBuckets),
        prize_pool: rand(prizeBuckets),
        location_city: city.city,
        location_state: city.state,
        _geoloc: geo,
        popularity_score: popularity(),
        rating: rating()
      });
      id++;
    }

    // VENUES
    for (let i = 0; i < 4; i++) {
      const geo = jitterLatLng(city.lat, city.lng, randNum(50, 2000));
      records.push({
        objectID: `venue_${id}`,
        type: "venue",
        name: `${rand(lastNames)} ${rand(["Ground", "Arena", "Stadium", "Complex"])}`,
        sport: [sport],
        facilities: facilitiesPool.slice(0, randNum(2, 5)),
        hourly_price: randNum(600, 4500),
        location_city: city.city,
        location_state: city.state,
        _geoloc: geo,
        popularity_score: popularity(),
        rating: rating()
      });
      id++;
    }

    // RESIDENCES
    for (let i = 0; i < 4; i++) {
      const geo = jitterLatLng(city.lat, city.lng, randNum(200, 4000));
      records.push({
        objectID: `residence_${id}`,
        type: "residence",
        name: `Sports Hostel - ${city.city}`,
        monthly_price: rand(hostelBuckets),
        residence_features: residenceFeaturesPool.slice(0, randNum(1, 4)),
        location_city: city.city,
        location_state: city.state,
        _geoloc: geo,
        popularity_score: popularity(),
        rating: rating()
      });
      id++;
    }

    // SQUADS
    for (let i = 0; i < 4; i++) {
      const geo = jitterLatLng(city.lat, city.lng, randNum(100, 2500));
      records.push({
        objectID: `squad_${id}`,
        type: "squad",
        name: `${rand(lastNames)} ${sport.toUpperCase()} Squad`,
        sport: [sport],
        team_size: rand([12, 18, 25, 30]),
        is_public: Math.random() > 0.4,
        open_to_join: Math.random() > 0.5,
        location_city: city.city,
        location_state: city.state,
        _geoloc: geo,
        popularity_score: popularity(),
        rating: rating()
      });
      id++;
    }

    // COMPANIES
    for (let i = 0; i < 3; i++) {
      const geo = jitterLatLng(city.lat, city.lng, randNum(100, 3000));
      records.push({
        objectID: `company_${id}`,
        type: "company",
        name: `${rand(lastNames)} ${rand(["Sports Academy", "Enterprises", "Foundation"])}`,
        company_type: rand(companyTypes),
        sport: [sport],
        location_city: city.city,
        location_state: city.state,
        _geoloc: geo,
        popularity_score: popularity(),
        rating: rating()
      });
      id++;
    }

    // POSTS
    for (let i = 0; i < 4; i++) {
      const geo = jitterLatLng(city.lat, city.lng, randNum(50, 2000));
      records.push({
        objectID: `post_${id}`,
        type: "post",
        sport: [sport],
        hashtags: [rand(hashtags)],
        location_city: city.city,
        location_state: city.state,
        _geoloc: geo,
        popularity_score: popularity(),
        rating: rating()
      });
      id++;
    }
  }
}

console.log("Generated:", records.length);
if (records.length < 1000) throw new Error("Less than 1000 records");

fs.writeFileSync("advanced_structured_1000.json", JSON.stringify(records, null, 2));
console.log("advanced_structured_1000.json created successfully.");