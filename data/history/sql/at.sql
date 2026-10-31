delete from country_flag_history where id = 2318 and iso_code = 'at';
delete from country_flag_history where id = 1483 and iso_code = 'at';
update country_flag_history set image_url = '/flags/history/at-1804.svg' where id = 1481 and iso_code = 'at';
update country_flag_history set image_url = '/flags/history/at-1918.svg' where id = 1482 and iso_code = 'at';
update country_flag_history set image_url = '/flags/history/at-2000.svg' where id = 1986 and iso_code = 'at';
update country_flag_history set image_url = '/flags/history/at-2018.svg' where id = 1987 and iso_code = 'at';
insert into country_flag_history (iso_code, image_url, date_start, date_end, label_fr, label_en, notes_fr, notes_en) values ('at', '/flags/history/at-1230.svg', '1230-01-01', '1804-08-11', 'Duché puis archiduché d''Autriche (bannière rouge-blanc-rouge)', 'Duchy, then Archduchy of Austria (red-white-red banner)', 'Le rouge-blanc-rouge apparaît sur un sceau du duc Frédéric II de Babenberg en 1230. La légende l''attribue à la tunique ensanglantée de Léopold V au siège d''Acre en 1191.', 'Red-white-red appears on a seal of Duke Frederick II of Babenberg in 1230. Legend traces it to Leopold V''s blood-soaked tunic at the siege of Acre in 1191.');
