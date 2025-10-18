-- Activer les notifications temps réel pour toutes les tables
ALTER PUBLICATION supabase_realtime ADD TABLE adherents;
ALTER PUBLICATION supabase_realtime ADD TABLE contributions;
ALTER PUBLICATION supabase_realtime ADD TABLE groupes;
ALTER PUBLICATION supabase_realtime ADD TABLE system_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE adherents_groupes;

-- Configurer REPLICA IDENTITY FULL pour capturer toutes les données
ALTER TABLE adherents REPLICA IDENTITY FULL;
ALTER TABLE contributions REPLICA IDENTITY FULL;
ALTER TABLE groupes REPLICA IDENTITY FULL;
ALTER TABLE system_settings REPLICA IDENTITY FULL;
ALTER TABLE adherents_groupes REPLICA IDENTITY FULL;