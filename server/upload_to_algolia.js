// upload_to_algolia.js
import fs from "fs";
import { algoliasearch } from "algoliasearch";

const APP_ID = "NR8W0UR9NT";
const ADMIN_KEY = "d450521bdef0224929b026f02805c167";
const INDEX_NAME = "stapubox_global_v1";

const client = algoliasearch(APP_ID, ADMIN_KEY);

async function run() {
  // 1) Read dataset
  const data = JSON.parse(
    fs.readFileSync("advanced_structured_1000.json", "utf8")
  );

  console.log(`Uploading ${data.length} records...`);

  // 2) Upload records
  await client.saveObjects({
    indexName: INDEX_NAME,
    objects: data,
  });

  console.log("Upload complete.");

  // 3) Apply settings
  const settings = {
    searchableAttributes: [
      "name",
      "search_blob",
      "sport",
      "skills",
      "accolades",
      "certifications",
      "location_city",
      "location_area",
      "company_type",
      "post_type",
      "competitive_level",
      "content_body"
    ],
    attributesForFaceting: [
      "type",
      "sport",
      "location_city",
      "location_area",
      "age",
      "experience_years",
      "entry_fee",
      "prize_pool",
      "monthly_price",
      "hourly_price",
      "price_per_session",
      "team_size",
      "is_public",
      "open_to_join",
      "competitive_level",
      "post_type",
      "company_type",
      "skills",
      "accolades",
      "residence_features",
      "facilities",
      "verified"
    ],
    customRanking: [
      "desc(popularity_score)",
      "desc(rating)",
      "desc(verified)"
    ],
    advancedSyntax: true,
    minWordSizefor1Typo: 4,
    minWordSizefor2Typos: 8,
    removeWordsIfNoResults: "none",
    attributesToHighlight: ["name", "search_blob", "content_body"],
    attributesToSnippet: ["content_body:40"]
  };

  await client.setSettings({
    indexName: INDEX_NAME,
    indexSettings: settings,
  });

  console.log("Index settings applied.");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});