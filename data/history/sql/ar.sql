delete from country_flag_history where id = 2317 and iso_code = 'ar';
update country_flag_history set image_url = '/flags/history/ar-1810.svg' where id = 1961 and iso_code = 'ar';
update country_flag_history set image_url = '/flags/history/ar-1812.svg' where id = 1962 and iso_code = 'ar';
update country_flag_history set image_url = '/flags/history/ar-1818.svg' where id = 1963 and iso_code = 'ar';
update country_flag_history set image_url = '/flags/history/ar-1819.svg' where id = 1964 and iso_code = 'ar';
insert into country_flag_history (iso_code, image_url, date_start, date_end, label_fr, label_en, notes_fr, notes_en) values ('ar', '/flags/history/ar-1840.svg', '1840-01-01', '1852-02-03', 'Confédération argentine (Rosas)', 'Argentine Confederation (Rosas)', 'Sous Juan Manuel de Rosas, le bleu devient plus foncé et des bonnets phrygiens rouges, couleur du parti fédéral, apparaissent aux coins ; ce drapeau disparaît après la bataille de Caseros (1852).', 'Under Juan Manuel de Rosas the blue turned darker and red Phrygian caps, the colour of the Federalist party, appeared in the corners; the flag vanished after the Battle of Caseros (1852).');
