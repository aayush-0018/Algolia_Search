import React from "react";
import "./ResultCard.css";

const headerKeys = [
  "name",
  "title",
  "type",
  "location_city",
  "location_area",
  "rating",
  "popularity_score",
  "search_blob",
];

function isPrimitive(val) {
  return val === null || val === undefined || ["string", "number", "boolean"].includes(typeof val);
}

function formatValue(key, val) {
  if (val == null) return "—";
  if (typeof val === "number" && /(price|fee|cost|amount|rent|entry)/i.test(key)) {
    return `₹${new Intl.NumberFormat("en-IN").format(val)}`;
  }
  return String(val);
}

function KeyValueRow({ k, v }) {
  return (
    <div className="key-row">
      <div className="key-name">{k}</div>
      <div className="key-value">{v}</div>
    </div>
  );
}

function GenericRenderer({ data, exclude = [] }) {
  const keys = Object.keys(data).filter(k => !exclude.includes(k));

  return (
    <div style={{ marginTop: 12 }}>
      {keys.map(k => {
        const v = data[k];
        if (isPrimitive(v)) return <KeyValueRow key={k} k={k} v={formatValue(k, v)} />;
        if (Array.isArray(v)) return <KeyValueRow key={k} k={k} v={v.join(", ")} />;
        if (typeof v === "object" && v !== null) return <KeyValueRow key={k} k={k} v={JSON.stringify(v)} />;
        return null;
      })}
    </div>
  );
}

export default function ResultCard({ hit }) {
  const name = hit.name || hit.title || "Untitled";
  const type = hit.type || hit.category || "";
  const location = hit.location_city
    ? `${hit.location_city}${hit.location_area ? ` • ${hit.location_area}` : ""}`
    : "";

  const rating = hit.rating ?? "—";
  const score = hit.popularity_score ?? 0;
  const blob = hit.search_blob || hit.description || "";

  return (
    <div className="result-card">
      <div className="result-header">
        <div>
          <div className="result-name">{name}</div>
          <div>
            {type && <span className="result-type-badge">{type}</span>}
            <span className="result-location">{location}</span>
          </div>
        </div>

        <div className="result-rating">
          <div className="result-rating-score">{rating}</div>
          <div className="result-score">{score} score</div>
        </div>
      </div>

      {blob && <p className="result-description">{blob}</p>}

      <GenericRenderer data={hit} exclude={headerKeys} />
    </div>
  );
}