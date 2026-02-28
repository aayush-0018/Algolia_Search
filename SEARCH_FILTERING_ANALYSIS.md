# Algolia Search Configuration Analysis - "Coach" Search Issue

## 🔴 Problem Identified
When searching for "coach", **no results are returned** even though coach records exist in the dataset.

---

## 📊 Current Configuration Breakdown

### 1. **Searchable Attributes** (What gets searched)
```javascript
searchableAttributes: [
  "unordered(full_name)",
  "unordered(name)",
  "unordered(title)",
  "unordered(sport)",
  "unordered(positions)",
  "unordered(hashtags)",
  "unordered(company_type)"
]
```

**The Problem:** 
- The `title` field is searchable, but it seems coach data may not populate this field
- No `type` field is in searchable attributes (if coaches are identified by type="coach")
- If coaches are identified by a different field (like "role", "profession", "position_type"), that field is **NOT searchable**

---

### 2. **Attributes for Faceting** (What can be filtered)
```javascript
attributesForFaceting: [
  "filterOnly(type)",              // ← Can filter but NOT search
  "searchable(sport)",
  "filterOnly(location_city)",
  "filterOnly(location_state)",
  "filterOnly(positions)",
  "filterOnly(accolades)",
  "filterOnly(company_type)",
  "filterOnly(post_type)",
  "filterOnly(competitive_level)",
  "filterOnly(is_public)",
  "filterOnly(open_to_join)",
  "filterOnly(residence_features)",
  "filterOnly(facilities)",
  "filterOnly(verified)"
]
```

**The Problem:**
- `type` is `filterOnly` - you can filter by it (e.g., filter type="coach") but **cannot search by it**
- If someone searches "coach", Algolia won't look in the type field

---

### 3. **Custom Ranking** (How results are prioritized)
```javascript
customRanking: [
  "desc(popularity_score)",
  "desc(rating)",
  "desc(verified)"
]
```

**Impact:** Even if search worked, coaches would be ranked by popularity/rating rather than relevance.

---

## 🎯 Why "Coach" Search Returns No Results

### Root Causes:

1. **"coach" is likely stored in the `type` field**, which is:
   - NOT in `searchableAttributes` 
   - Only marked as `filterOnly` in `attributesForFaceting`
   
2. **"coach" might be in a field that doesn't exist in searchableAttributes**, such as:
   - `role`
   - `profession`
   - `position_type`
   - `job_title`

3. **The search configuration doesn't include a "catch-all" field** that contains the word "coach"

---

## ✅ Solutions

### **Solution 1: Add `type` to Searchable Attributes** (RECOMMENDED)
If coaches are identified by `type="coach"`:

```javascript
searchableAttributes: [
  "unordered(full_name)",
  "unordered(name)",
  "unordered(type)",           // ← ADD THIS
  "unordered(title)",
  "unordered(sport)",
  "unordered(positions)",
  "unordered(hashtags)",
  "unordered(company_type)"
]
```

**Impact:** Users can now search "coach" and find all records where type="coach"

---

### **Solution 2: Add Role/Profession Field**
If coaches have a dedicated field (like `role`, `profession`, or `position_type`):

```javascript
searchableAttributes: [
  "unordered(full_name)",
  "unordered(name)",
  "unordered(role)",            // ← ADD IF IT EXISTS
  "unordered(title)",
  "unordered(sport)",
  "unordered(positions)",
  "unordered(hashtags)",
  "unordered(company_type)"
]
```

---

### **Solution 3: Update `attributesForFaceting` for Better Filtering**
Change `type` from `filterOnly` to `searchable`:

```javascript
attributesForFaceting: [
  "searchable(type)",           // ← CHANGE FROM filterOnly
  "searchable(sport)",
  "filterOnly(location_city)",
  // ... rest of attributes
]
```

**Impact:** `type` becomes both searchable AND filterable

---

### **Solution 4: Improve Custom Ranking**
Add a field that identifies coaches more prominently:

```javascript
customRanking: [
  "desc(is_coach)",              // ← IF THIS FIELD EXISTS
  "desc(popularity_score)",
  "desc(rating)",
  "desc(verified)"
]
```

---

## 🔍 Debugging Steps

1. **Check the actual data structure:**
   ```bash
   grep -i "coach" advanced_structured_1000.json | head -5
   ```

2. **Verify what field identifies coaches:**
   - Is it `type: "coach"`?
   - Is it `role: "coach"`?
   - Is it `title: "Coach ..."`?
   - Is it something else?

3. **Test in Algolia Dashboard:**
   - Go to your Algolia index
   - Check the "Display" settings
   - Verify searchable attributes include the field where "coach" is stored

---

## 📋 Priority of Search/Filter Features

### Search Flow (How "coach" is looked for):
1. Full text search in `searchableAttributes` (HIGHEST PRIORITY)
2. Typo tolerance (if enabled)
3. Synonym matching (if configured)
4. `removeWordsIfNoResults` behavior (currently: "none" - don't remove words)

### Filter Flow (How filtering works):
1. Exact match on `attributesForFaceting` fields
2. Requires explicit filter parameter in query

---

## 🚀 Recommended Fix (Step-by-Step)

1. **Identify the exact field** where "coach" is stored
2. **Add that field to `searchableAttributes`**
3. **Update `attributesForFaceting`** - change `type` from `filterOnly` to `searchable`
4. **Update the custom ranking** to prioritize coaches if needed
5. **Re-run upload_to_algolia.js** to apply new settings

---

## 📝 Example Complete Fix

If coaches are identified by `type="coach"`:

```javascript
const settings = {
  searchableAttributes: [
    "unordered(full_name)",
    "unordered(name)",
    "unordered(type)",              // ← ADDED
    "unordered(title)",
    "unordered(sport)",
    "unordered(positions)",
    "unordered(hashtags)",
    "unordered(company_type)"
  ],

  attributesForFaceting: [
    "searchable(type)",             // ← CHANGED from filterOnly
    "searchable(sport)",
    "filterOnly(location_city)",
    "filterOnly(location_state)",
    "filterOnly(positions)",
    "filterOnly(accolades)",
    "filterOnly(company_type)",
    "filterOnly(post_type)",
    "filterOnly(competitive_level)",
    "filterOnly(is_public)",
    "filterOnly(open_to_join)",
    "filterOnly(residence_features)",
    "filterOnly(facilities)",
    "filterOnly(verified)"
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

  attributesToHighlight: [
    "full_name",
    "name",
    "title",
    "type"                          // ← ADDED for highlighting
  ]
};
```

---

## 🔑 Key Takeaways

| Setting | Purpose | Impact on "Coach" Search |
|---------|---------|--------------------------|
| `searchableAttributes` | Defines which fields are searched | ❌ If "type" is not here, coaches won't be found |
| `attributesForFaceting` | Defines what can be filtered/faceted | ✅ Can filter by type, but can't search by it |
| `filterOnly()` | Facet-only, not searchable | ❌ This is why "type" search doesn't work |
| `searchable()` | Both searchable AND filterable | ✅ Better for the "type" field |
| `customRanking` | Order of results | ⚠️ Ranks by score/rating, not relevance to "coach" |

---

## 📞 Next Steps
Please verify the exact field name where "coach" is stored and implement the appropriate solution above.
