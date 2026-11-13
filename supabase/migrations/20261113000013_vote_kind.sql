-- =============================================================================
-- KRISMA · Waitlist — 13 : nouveau type de points « vote »
-- Seul dans son fichier : une valeur d'enum ajoutée ne peut pas être utilisée
-- dans la même transaction (voir migration 14).
-- =============================================================================

alter type public.point_kind add value if not exists 'vote';
