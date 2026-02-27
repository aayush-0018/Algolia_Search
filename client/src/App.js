import React, { useState } from "react";
import ResultCard from "./ResultCard";
import "./App.css";

function App() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  async function runSearch(e) {
    e && e.preventDefault();
    setLoading(true);

    const body = { q, hitsPerPage: 20 };
    if (lat && lng) {
      body.lat = Number(lat);
      body.lng = Number(lng);
    }

    const resp = await fetch("http://localhost:5002/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await resp.json();
    setLoading(false);

    if (json.ok) {
      setHits(json.algolia.hits || []);
    } else {
      alert("Search error: " + json.error);
    }
  }

  return (
    <div className="app-container">
      <div className="app-header">Stapubox Search</div>

      <div className="content-wrapper">
        <div className="search-card">
          <form onSubmit={runSearch}>
            <div className="search-row">
              <input
                className="search-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search e.g. football coach under 100 per session in Mumbai"
              />
              <button className="search-button" type="submit">
                Search
              </button>
            </div>
          </form>

          <div className="location-row">
            <input
              className="location-input"
              placeholder="Lat"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
            <input
              className="location-input"
              placeholder="Lng"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
            />
            <button
              className="location-button"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(pos => {
                    setLat(String(pos.coords.latitude));
                    setLng(String(pos.coords.longitude));
                  });
                }
              }}
            >
              Use my location
            </button>
          </div>
        </div>

        <div className="results-section">
          <div className="results-title">
            Results ({hits.length})
          </div>

          {loading ? (
            <div className="loading-text">Loading...</div>
          ) : (
            hits.map(hit => (
              <ResultCard key={hit.objectID} hit={hit} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;