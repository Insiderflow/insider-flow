-- Missing Issuers
INSERT INTO "Issuer" ("id", "name", "ticker") VALUES ('1571408', 'Unknown Issuer', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO "Issuer" ("id", "name", "ticker") VALUES ('430568', 'Unknown Issuer', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO "Issuer" ("id", "name", "ticker") VALUES ('432429', 'Unknown Issuer', NULL) ON CONFLICT (id) DO NOTHING;

-- Trades
INSERT INTO "Trade" ("id", "politician_id", "issuer_id", "traded_at", "type", "size_min", "size_max", "published_at", "filed_after_days", "owner", "price", "source_url", "raw", "created_at") VALUES
('20003791158', 'M001218', '1571408', '2023-03-14T16:00:00.000Z', 'buy', 1000, 15000, '2025-09-17T16:00:00.000Z', 917, 'Undisclosed', 200.78, 'https://www.capitoltrades.com/trades/20003791158', '{"ticker":null,"sizeText":"1K–15K","issuerName":"L3Harris Technologies Inc","politicianName":"Rich McCormick","politicianChamber":null}', '2025-09-24T18:16:17.764Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO "Trade" ("id", "politician_id", "issuer_id", "traded_at", "type", "size_min", "size_max", "published_at", "filed_after_days", "owner", "price", "source_url", "raw", "created_at") VALUES
('20003791014', 'M001136', '430568', '2025-08-03T16:00:00.000Z', 'sell', 1000, 15000, '2025-09-14T16:00:00.000Z', 39, 'Spouse', 68.48999999999999, 'https://www.capitoltrades.com/trades/20003791014', '{"ticker":null,"sizeText":"1K–15K","issuerName":"Cisco Systems Inc","politicianName":"Lisa McClain","politicianChamber":null}', '2025-09-24T18:16:17.764Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO "Trade" ("id", "politician_id", "issuer_id", "traded_at", "type", "size_min", "size_max", "published_at", "filed_after_days", "owner", "price", "source_url", "raw", "created_at") VALUES
('20003791059', 'M001136', '432429', '2025-08-03T16:00:00.000Z', 'buy', 1000, 15000, '2025-09-14T16:00:00.000Z', 39, 'Spouse', 16.48, 'https://www.capitoltrades.com/trades/20003791059', '{"ticker":null,"sizeText":"1K–15K","issuerName":"Infosys Ltd","politicianName":"Lisa McClain","politicianChamber":null}', '2025-09-24T18:16:17.764Z')
ON CONFLICT (id) DO NOTHING;