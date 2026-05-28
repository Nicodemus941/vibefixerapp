-- ============================================
-- E2E test follow-up: GDPR-safe account deletion
-- ============================================
-- Surfaced by the e2e test cleanup: 11 FKs referencing profiles or
-- engagements were defaulting to NO ACTION, blocking the existing
-- deleteOwnAccount() flow whenever the user had any of: messages,
-- conversations, matches, engagements, feed_events. Convert them all
-- to ON DELETE CASCADE so the documented "delete my account" flow
-- actually completes in production.

ALTER TABLE conversations
  DROP CONSTRAINT conversations_participant_a_fkey,
  ADD  CONSTRAINT conversations_participant_a_fkey
       FOREIGN KEY (participant_a) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE conversations
  DROP CONSTRAINT conversations_participant_b_fkey,
  ADD  CONSTRAINT conversations_participant_b_fkey
       FOREIGN KEY (participant_b) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE matches
  DROP CONSTRAINT matches_seeker_id_fkey,
  ADD  CONSTRAINT matches_seeker_id_fkey
       FOREIGN KEY (seeker_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE matches
  DROP CONSTRAINT matches_provider_id_fkey,
  ADD  CONSTRAINT matches_provider_id_fkey
       FOREIGN KEY (provider_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE messages
  DROP CONSTRAINT messages_sender_id_fkey,
  ADD  CONSTRAINT messages_sender_id_fkey
       FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE engagements
  DROP CONSTRAINT engagements_seeker_id_fkey,
  ADD  CONSTRAINT engagements_seeker_id_fkey
       FOREIGN KEY (seeker_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE engagements
  DROP CONSTRAINT engagements_provider_id_fkey,
  ADD  CONSTRAINT engagements_provider_id_fkey
       FOREIGN KEY (provider_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE engagements
  DROP CONSTRAINT engagements_match_id_fkey,
  ADD  CONSTRAINT engagements_match_id_fkey
       FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE SET NULL;

ALTER TABLE feed_events
  DROP CONSTRAINT feed_events_primary_user_id_fkey,
  ADD  CONSTRAINT feed_events_primary_user_id_fkey
       FOREIGN KEY (primary_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE feed_events
  DROP CONSTRAINT feed_events_secondary_user_id_fkey,
  ADD  CONSTRAINT feed_events_secondary_user_id_fkey
       FOREIGN KEY (secondary_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE feed_events
  DROP CONSTRAINT feed_events_related_engagement_fkey,
  ADD  CONSTRAINT feed_events_related_engagement_fkey
       FOREIGN KEY (related_engagement) REFERENCES engagements(id) ON DELETE SET NULL;

ALTER TABLE reputation_events
  DROP CONSTRAINT reputation_events_related_engagement_fkey,
  ADD  CONSTRAINT reputation_events_related_engagement_fkey
       FOREIGN KEY (related_engagement) REFERENCES engagements(id) ON DELETE SET NULL;
