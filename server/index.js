// server/index.js
import express from "express";
import cors from "cors";
import { algoliasearch } from "algoliasearch";
import { parseQuery } from "./queryParser.js";

const APP_ID = process.env.ALGOLIA_APP_ID || "NR8W0UR9NT";
const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY || "d450521bdef0224929b026f02805c167";
const INDEX_NAME = process.env.ALGOLIA_INDEX || "stapubox_global_v1";

const client = algoliasearch(APP_ID, ADMIN_KEY);

const app = express();

app.use(cors());
app.use(express.json());

app.post("/search", async (req, res) => {
    try {
        const q = req.body.q || "";
        const userLat = req.body.lat || null;
        const userLng = req.body.lng || null;
        const page = Number(req.body.page || 0);
        const hitsPerPage = Number(req.body.hitsPerPage || 20);

        const parsed = parseQuery(q, { userLat, userLng });

        const requestPayload = {
            requests: [
                {
                    indexName: INDEX_NAME,
                    query: parsed.query,
                    page,
                    hitsPerPage,
                    filters: parsed.filters || undefined,
                    numericFilters: parsed.numericFilters || undefined,
                    getRankingInfo: true,
                    attributesToHighlight: ["name", "full_name", "title"],
                }
            ]
        };

        if (parsed.aroundLatLng) {
            requestPayload.requests[0].aroundLatLng = parsed.aroundLatLng;
            requestPayload.requests[0].aroundRadius = parsed.aroundRadius;
        } else if (userLat && userLng) {
            requestPayload.requests[0].aroundLatLng = `${userLat},${userLng}`;
            requestPayload.requests[0].aroundRadius = 10000;
        }

        const result = await client.search(requestPayload);

        res.json({
            ok: true,
            parsed,
            algolia: result.results[0]
        });

    } catch (err) {
        console.error("search error", err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
    console.log(`Search server listening on ${PORT}`);
});