// upload_to_algolia.js
// Production-aligned uploader (NO search_blob)

import fs from "fs";
import { algoliasearch } from "algoliasearch";

const APP_ID = "NR8W0UR9NT";
const ADMIN_KEY = "d450521bdef0224929b026f02805c167";
const INDEX_NAME = "stapubox_global_v1";

const client = algoliasearch(APP_ID, ADMIN_KEY);

async function run() {
  // 1️⃣ Read dataset
  const data = JSON.parse(
    fs.readFileSync("advanced_structured_1000.json", "utf8")
  );

  console.log(`Uploading ${data.length} records...`);

  // 2️⃣ Clear index (optional but recommended for fresh upload)
  await client.clearObjects({ indexName: INDEX_NAME });
  console.log("Index cleared.");

  // 3️⃣ Upload records
  await client.saveObjects({
    indexName: INDEX_NAME,
    objects: data,
  });

  console.log("Upload complete.");

  // 4️⃣ Apply production-aligned settings
  const settings = {
    // ------------------------------------------------
    // SEARCHABLE FIELDS (ORDER MATTERS FOR RANKING)
    // ------------------------------------------------
    searchableAttributes: [

      // 🔥 Primary identity fields (highest weight)
      "unordered(full_name)",
      "unordered(name)",
      "unordered(title)",

      // 🔥 Core intent fields
      "unordered(sport)",
      "unordered(positions)",
      "unordered(company_type)",
      "unordered(competitive_level)",

      // 🔥 Discoverability fields
      "unordered(hashtags)",
      "unordered(accolades)",
      "unordered(facilities)",
      "unordered(residence_features)",

      // 🔥 Location searchable (important for dumb queries)
      "unordered(location_city)",
      "unordered(location_state)",

      // 🔥 Type LAST (so “coach” doesn’t dominate ranking)
      "unordered(type)"
    ],

    // ------------------------------------------------
    // FACETING / STRUCTURED FILTERS
    // ------------------------------------------------
    attributesForFaceting: [

      // Core entity filter
      "filterOnly(type)",

      // Sport filtering
      "searchable(sport)",

      // Location filtering
      "searchable(location_city)",
      "filterOnly(location_state)",

      // Role filtering
      "filterOnly(positions)",
      "filterOnly(accolades)",

      // Entity-specific filters
      "filterOnly(company_type)",
      "filterOnly(competitive_level)",
      "filterOnly(is_public)",
      "filterOnly(open_to_join)",
      "filterOnly(residence_features)",
      "filterOnly(facilities)",
      "filterOnly(verified)"
    ],

    // ------------------------------------------------
    // RANKING STRATEGY
    // ------------------------------------------------
    customRanking: [
      "desc(popularity_score)",
      "desc(rating)",
      "desc(verified)"
    ],

    // ------------------------------------------------
    // SEARCH BEHAVIOR
    // ------------------------------------------------
    advancedSyntax: true,
    minWordSizefor1Typo: 4,
    minWordSizefor2Typos: 8,
    removeWordsIfNoResults: "lastWords",

    // ------------------------------------------------
    // HIGHLIGHTING
    // ------------------------------------------------
    attributesToHighlight: [
      "full_name",
      "name",
      "title",
      "sport",
      "positions",
      "company_type",
      "location_city"
    ]
  };

  await client.setSettings({
    indexName: INDEX_NAME,
    indexSettings: settings,
  });

  console.log("Index settings applied successfully.");
}

run().catch(err => {
  console.error("Upload failed:", err);
  process.exit(1);
});