-- Extensions utilisées par Lokky :
-- PostGIS : lieux des sorties et recherche par distance (spec backend §8).
-- citext : emails comparés sans tenir compte de la casse (spec backend §6).
CREATE EXTENSION IF NOT EXISTS postgis;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS citext;
