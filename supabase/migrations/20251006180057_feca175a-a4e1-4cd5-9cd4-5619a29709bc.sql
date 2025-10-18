-- Mettre à jour le premier "Bazar" dans faritra "fahatelo" en "Bazar I"
UPDATE adherents 
SET quartier = 'Bazar I' 
WHERE id_adherent = (
  SELECT id_adherent 
  FROM adherents 
  WHERE quartier = 'Bazar' AND faritra = 'fahatelo'
  ORDER BY created_at ASC
  LIMIT 1
);

-- Mettre à jour tous les autres "Bazar" en "Bazar II"
UPDATE adherents 
SET quartier = 'Bazar II' 
WHERE quartier = 'Bazar';