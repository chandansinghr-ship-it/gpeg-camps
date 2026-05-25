-- DDL Migration: Expand Schema to Parity with WorkMate, Camp Details, and KPI Program Ingress
-- Target Table: gpeg_camp_cases

ALTER TABLE gpeg_camp_cases ADD COLUMN (
  client_division STRING(256),                -- Client division or brand (e.g. Starcom, GroupM)
  channel_products STRING(256),               -- Core products (e.g. Video, Search, Analytics)
  agency_type STRING(32),                     -- Segment classification: LCS or GCS
  proposed_time STRING(64),                   -- Timeslot representation
  camp_attendance INT64,                      -- Confirmed number of practitioners
  gpeg_poc_2 STRING(128),                     -- Secondary presenter
  gpeg_poc_3 STRING(128),                     -- Supporting presenter / backup
  platform STRING(32),                        -- GVC, MS Teams, etc.
  mos_topic STRING(256),                      -- Assigned Menu of Services topic
  product_category STRING(256),               -- Underlying product category
  timeslot STRING(64),                        -- Target timeslot
  ist_timeslot STRING(64),                    -- Equivalent IST slot
  content_deck STRING(MAX),                   -- Target presentation deck URL
  session_title STRING(256),                  -- Session title description
  calendar_invite_link STRING(MAX),           -- Calendar event URL
  google_meet_link STRING(MAX),               -- Dedicated Meet link
  target_audience STRING(256),                -- Target audience role
  duration STRING(64),                        -- Session duration (e.g. 60 mins, 90 mins)
  pre_camp_survey_link STRING(MAX),           -- Discovery Form URL (LCS)
  post_feedback_survey_link STRING(MAX),      -- Feedback Form URL (GCS/Torso)
  session_recording STRING(MAX),              -- Recorded session link
  session_transcripts STRING(MAX),            -- Video transcripts document
  pdf_format_of_deck STRING(MAX),             -- PDF archive of presentation
  impact_report STRING(MAX),                  -- PDF of campaign impact analysis
  comments STRING(MAX),                       -- Session specific comments and notes

  -- Expanded KPI Tracking and Financial Impact Fields
  is_kpi_program BOOL DEFAULT (false),        -- Flags if session belongs to an official GCAS KPI track
  gcas_kpi_id STRING(128),                    -- Maps to 'Related KPIs' column (e.g. KPI-10, KPI-3)
  agency_shared_drive_link STRING(MAX),       -- Maps to pre-negotiated shared Google Drive folders
  revenue_covered_m NUMERIC,                  -- Quarterly Revenue Covered ($M)
  arr_uplift_m NUMERIC,                       -- Projected ARR Uplift ($M)
  language STRING(32) DEFAULT "English"       -- Session delivery language (e.g. English, Italian)
);
