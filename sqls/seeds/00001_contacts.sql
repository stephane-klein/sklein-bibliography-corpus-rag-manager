INSERT INTO contacts (firstname, lastname)
SELECT 'John' || n, 'Doe' || n
  FROM generate_series(1, 1000) AS n
  ON CONFLICT DO NOTHING;
