# Algolia Relevance Score Calculation - Complete Guide

## 📊 What is the Relevance Score?

The **relevance score** is a numerical value (typically 0-100) that Algolia calculates for each search result. It determines **how well a record matches the user's search query**. Higher scores = better match = appears higher in results.

---

## 🔍 How Algolia Calculates the Score

Algolia uses a **multi-factor ranking system** to compute the relevance score. Here's your complete configuration:

### **1. Textual Relevance (Primary Factor)**

#### A. **Searchable Attributes Matching**
Your current configuration:
```javascript
searchableAttributes: [
  "unordered(full_name)",      // 🥇 Higher priority
  "unordered(name)",
  "unordered(title)",
  "unordered(sport)",
  "unordered(positions)",
  "unordered(company_type)",
  "unordered(competitive_level)",
  "unordered(hashtags)",
  "unordered(accolades)",
  "unordered(facilities)",
  "unordered(residence_features)",
  "unordered(location_city)",
  "unordered(location_state)",
  "unordered(type)"            // 🥉 Lower priority (last)
]
```

**How it works:**
- **Order matters!** Fields listed first have higher weight
- When you search "coach", Algolia checks:
  1. Full name field first (highest score if match)
  2. Then name field (slightly lower)
  3. Then title field... and so on
  4. Type field last (lowest weight)

**Scoring for each field:**
- ✅ **Exact match** (word matches completely) = Highest score
- ✅ **Prefix match** ("coach" matches "coaching") = High score
- ✅ **Partial match** = Medium score
- ✅ **Typo tolerance** (4+ char words) = Lower score

**Example - Search: "coach"**
```
Record 1: type="coach", name="John Smith"         → Score: 85
  ↑ "coach" matches type field (but type is last)
  ↑ Bonus for exact match

Record 2: type="player", title="Basketball Coach"  → Score: 92
  ↑ "coach" matches title field (higher priority than type)
  ↑ Better ranking

Record 3: type="coach", full_name="Coach Sarah"   → Score: 98
  ↑ "coach" matches full_name (highest priority field)
  ↑ Best result
```

---

#### B. **`unordered()` Modifier Impact**
```javascript
"unordered(full_name)"
```

- **`unordered()`** = Word order doesn't matter
- Alternative: **`ordered()`** = Word order matters
- Using `unordered()` for all fields means "coach john" = "john coach" in scoring

---

#### C. **Typo Tolerance**
```javascript
minWordSizefor1Typo: 4,
minWordSizefor2Typos: 8,
```

**What this means:**
- Words with **4+ characters** get 1 typo tolerance
  - Search "coachh" → Still matches "coach" (1 typo allowed)
- Words with **8+ characters** get 2 typos tolerance
  - Search "coachhing" → Matches "coaching" (2 typos allowed)

**Score impact:**
- Exact match = 100 points
- 1 typo match = 95 points (5 point penalty)
- 2 typo matches = 90 points (10 point penalty)

---

### **2. Custom Ranking (Secondary Factor)**

```javascript
customRanking: [
  "desc(popularity_score)",    // 🥇 Most important
  "desc(rating)",
  "desc(verified)"             // 🥉 Least important
]
```

**How it works:**
After textual relevance is calculated, Algolia applies **custom attributes** as tiebreakers:

1. **`popularity_score` (Descending)** - Records with higher popularity boost score
   - Example: Record A score=92, popularity=5000 → Ranked higher
   - Example: Record B score=92, popularity=3000 → Ranked lower
   
2. **`rating` (Descending)** - If popularity is equal, higher rated records win
   - Example: Record A score=92, popularity=5000, rating=4.8 → Better
   - Example: Record B score=92, popularity=5000, rating=4.5 → Worse

3. **`verified` (Descending)** - Final tiebreaker
   - Example: Record A = verified=true → Wins
   - Example: Record B = verified=false → Loses

**Real Example - Search: "coach"**
```
All records matched with score ~90:

Record A:
  - Textual score: 90
  - popularity_score: 5000
  - rating: 4.8
  - verified: true
  → Final Ranking: #1

Record B:
  - Textual score: 90
  - popularity_score: 3000
  - rating: 4.9
  - verified: true
  → Final Ranking: #2 (lower popularity, even with higher rating)

Record C:
  - Textual score: 90
  - popularity_score: 3000
  - rating: 4.9
  - verified: false
  → Final Ranking: #3 (not verified)
```

---

### **3. Filters (Pre-filtering, Not Score)**

```javascript
attributesForFaceting: [
  "filterOnly(type)",
  "searchable(sport)",
  "filterOnly(location_city)",
  // ... etc
]
```

**Important:** Filters **do NOT affect score**. They are applied **before** scoring:

**Example:**
```javascript
// Query: "coach" with filter: type="coach"
// Results returned: ONLY records where type="coach"
// Score calculation: Still based on textual relevance + ranking above

// Without filter: All records with "coach" returned
// With filter: Only coaches with "coach" in them returned (smaller set)
```

---

### **4. Distance/Geolocation (If used)**

Your current data has `_geoloc` field:
```json
{
  "objectID": "player_1",
  "full_name": "Priya Jain",
  "_geoloc": {
    "lat": 19.065273,
    "lng": 72.866583
  }
}
```

**Currently:** No geo-ranking configured, so distance doesn't affect score.

**If you wanted to add geo-ranking:**
```javascript
aroundLatLng: "19.065273, 72.866583",  // Search center
aroundRadius: 50000,                   // In meters
// Then geo-distance would become a ranking factor
```

---

## 📈 Complete Score Calculation Flow

```
SEARCH QUERY: "coach"
↓
STEP 1: TEXT MATCHING
  ├─ Match against all searchableAttributes
  ├─ Calculate relevance for each field (weight by position)
  ├─ Apply typo tolerance if needed
  └─ Result: Base Textual Score (0-100)
↓
STEP 2: CUSTOM RANKING
  ├─ Sort by popularity_score (desc)
  ├─ Then by rating (desc)
  ├─ Then by verified (desc)
  └─ Result: Final Ranked Order
↓
STEP 3: APPLY FILTERS (if any)
  ├─ Remove records that don't match filters
  └─ Return filtered + ranked results
↓
FINAL RESULTS: Sorted by score + custom ranking
```

---

## 🎯 Score Calculation Examples

### **Example 1: Simple Search "coach"**

**Data:**
```json
{
  "objectID": "1",
  "full_name": "Coach John Smith",
  "title": "Basketball Coach",
  "type": "coach",
  "popularity_score": 5000,
  "rating": 4.8,
  "verified": true
}
```

**Calculation:**
```
1. TEXT MATCHING:
   - "coach" in full_name (field #1, highest priority): +40 points
   - "coach" in title (field #3): +30 points
   - "coach" in type (field #14, lowest): +10 points
   = Base Score: 80/100

2. CUSTOM RANKING:
   - popularity_score: 5000 (very high, boosts ranking)
   - rating: 4.8/5 (excellent, boosts ranking)
   - verified: true (boosts ranking)
   
3. FINAL SCORE: 80 + adjustments = ~85-95
```

---

### **Example 2: Typo in Search "coachh"**

**Calculation:**
```
1. TEXT MATCHING:
   - "coachh" vs "coach" in full_name: Typo detected
   - minWordSizefor1Typo: 4 ✓ (coach has 5 chars)
   - Match with 1 typo allowed: Acceptable
   = Base Score: 75/100 (5 point penalty for typo)

2. CUSTOM RANKING: Same as above
   
3. FINAL SCORE: 75 + adjustments = ~80-90
```

---

### **Example 3: Partial Match "coac"**

**Calculation:**
```
1. TEXT MATCHING:
   - "coac" matches prefix of "coach"
   - Prefix matching bonus applied
   = Base Score: 70/100 (lower than exact match)

2. CUSTOM RANKING: Same as above
   
3. FINAL SCORE: 70 + adjustments = ~75-85
```

---

## 🔧 Configuration Impact on Score

### **Current Settings Impact:**

| Setting | Impact on Score |
|---------|-----------------|
| `searchableAttributes` order | **HIGH** - Earlier fields = higher scores |
| `customRanking` | **HIGH** - Separates results with same text score |
| `minWordSizefor1Typo: 4` | **MEDIUM** - Allows fuzzy matching |
| `minWordSizefor2Typos: 8` | **MEDIUM** - Extra tolerance for longer words |
| `removeWordsIfNoResults: "lastWords"` | **MEDIUM** - Removes query words if no results |
| `advancedSyntax: true` | **LOW** - Enables AND/OR syntax |

---

## 🚀 How to Optimize Scores for Better Results

### **1. Reorder searchableAttributes**
```javascript
// If coaches are important, move "type" higher:
searchableAttributes: [
  "unordered(full_name)",
  "unordered(type)",           // ← Move type up if coaches are priority
  "unordered(name)",
  "unordered(title)",
  // ... rest
]
```

### **2. Improve Custom Ranking**
```javascript
// Add a coach-specific field if it exists:
customRanking: [
  "desc(is_coach)",            // ← If this field exists
  "desc(popularity_score)",
  "desc(rating)",
  "desc(verified)"
]
```

### **3. Add a Score Boost for Type**
```javascript
// In frontend query, add weight:
algoliaClient.search({
  queries: [{
    indexName: 'stapubox_global_v1',
    query: 'coach',
    facetFilters: ['type:coach']  // Pre-filter to coaches only
  }]
})
```

---

## 🔎 How Scoring Appears in Results

When you receive search results from Algolia, you get something like:

```javascript
{
  "hits": [
    {
      "objectID": "coach_123",
      "full_name": "John Coach Smith",
      "type": "coach",
      "popularity_score": 5000,
      "_score": 0.95,              // ← Relevance score (0-1 scale)
      "_highlightResult": {
        "full_name": {
          "value": "<em>Coach</em> John Smith",
          "matchLevel": "full"
        }
      }
    },
    {
      "objectID": "coach_124",
      "full_name": "Sarah Williams",
      "title": "Head <em>Coach</em>",
      "_score": 0.92,              // ← Slightly lower score
      // ...
    }
  ]
}
```

**Note:** Frontend JavaScript receives `_score`, but internal ranking uses the full 0-100 scale.

---

## 📊 Quick Reference: Score Formula

```
FINAL SCORE = 
  (Text Relevance Score) +
  (CustomRanking Boost based on popularity) +
  (CustomRanking Boost based on rating) +
  (CustomRanking Boost based on verified) -
  (Typo Penalties if any)
```

---

## ✅ Key Takeaways

1. **Position in `searchableAttributes` matters** - Earlier = higher weight
2. **Custom ranking breaks ties** - When text scores are similar
3. **Typo tolerance reduces score** - But still allows fuzzy matching
4. **Filters exclude, not score** - They limit the result set first
5. **"coach" search should work now** - Because you added "type" to searchable attributes

---

## 🔧 Your Current Configuration Score Impact

✅ **Good:**
- `searchableAttributes` includes all important fields
- `customRanking` uses meaningful metrics (popularity, rating, verified)
- Typo tolerance is reasonable (4+ chars, 8+ chars)

⚠️ **Could Improve:**
- `type` is at the end of `searchableAttributes` (lower priority)
- If coaches are a primary entity, moving `type` earlier would boost coach-related searches
- No geo-ranking (if location matters)

---

Would you like me to explain any specific aspect further or optimize the configuration?
