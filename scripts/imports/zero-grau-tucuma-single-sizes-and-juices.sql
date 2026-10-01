-- Run after zero-grau-tucuma.sql and zero-grau-tucuma-sizes.sql.
-- Required single-choice size groups are auto-selected by ProductDetailsModal.
-- Green juice bases become explicit flavor variants; no conditional group needed.
BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '60s';
SELECT pg_advisory_xact_lock(hashtext('menu-import/01a0f62e-f662-7d28-801d-f4eea0f9be24'));
CREATE TEMP TABLE single_size (id text, old_title text, title text, slug text, size text, price integer) ON COMMIT DROP;
INSERT INTO single_size VALUES
('758e4be7-059e-50c1-bf0f-c119bc81aec3','Suco 390 ml','Suco','suco','390 ml',1300),
('1c96e374-4f20-5662-b3f6-0aa819de96d1','Água mineral 500 ml','Água mineral','agua-mineral','500 ml',300),
('7fe27200-d876-52fa-8a08-950ce5a5e853','H2O 500 ml','H2O','h2o','500 ml',800),
('490b214e-7c58-5627-af60-ba168011ad29','Sorvete — 1 bola','Sorvete','sorvete','1 bola',900),
('13f4428f-45d5-5f81-9044-5611facd9506','Sorvete self-service — 1 kg','Sorvete self-service','sorvete-self-service','1 kg',5999);
CREATE TEMP TABLE juice_merge (id text, title text) ON COMMIT DROP;
INSERT INTO juice_merge VALUES
('1f7bef3c-9725-55c5-9a81-cc988fabf7ba','Suco de morango 390 ml'),
('8c5a1084-4a23-5206-972b-d728ccbfca90','Suco verde 390 ml');
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM single_size s LEFT JOIN product p ON p.id=s.id
 WHERE p.id IS NULL OR p.title<>s.old_title OR p."basePriceCents"<>s.price
 OR p."companyId"<>'01a0f62e-f662-7d28-801d-f4eea0f9be24')
 OR EXISTS (SELECT 1 FROM juice_merge s LEFT JOIN product p ON p.id=s.id
 WHERE p.id IS NULL OR p.title<>s.title OR p."basePriceCents"<>1400
 OR p."companyId"<>'01a0f62e-f662-7d28-801d-f4eea0f9be24') THEN
 RAISE EXCEPTION 'Unexpected source catalog or correction already applied'; END IF;
 IF EXISTS (SELECT 1 FROM unit_product WHERE "productId" IN (SELECT id FROM single_size UNION SELECT id FROM juice_merge))
 OR EXISTS (SELECT 1 FROM product_review WHERE "productId" IN (SELECT id FROM juice_merge))
 OR EXISTS (SELECT 1 FROM product_recipe_ingredient WHERE "productId" IN (SELECT id FROM juice_merge))
 OR EXISTS (SELECT 1 FROM option_recipe_ingredient r JOIN option o ON o.id=r."optionId" JOIN option_group g ON g.id=o."groupId" WHERE g."productId" IN (SELECT id FROM juice_merge)) THEN
 RAISE EXCEPTION 'Catalog dependencies require explicit merge'; END IF;
 IF (SELECT count(*) FROM option WHERE "groupId"='02a16a87-672c-5cb3-8aae-11a449ac4b2e' AND name IN ('Abacaxi','Maracujá','Laranja') AND "priceDeltaCents"=0 AND available)<>3 THEN
 RAISE EXCEPTION 'Unexpected green juice bases'; END IF;
 IF (SELECT count(*) FROM option o JOIN option_group g ON g.id=o."groupId"
 WHERE g."productId" IN (SELECT id FROM juice_merge UNION SELECT id FROM single_size WHERE title='Suco') AND g.name='Adicionais' AND o.name='Leite' AND o."priceDeltaCents"=200 AND g."maxSelect"=1 AND NOT g.required)<>3 THEN
 RAISE EXCEPTION 'Unexpected juice additions'; END IF;
 IF (SELECT count(*) FROM option o JOIN option_group g ON g.id=o."groupId" WHERE g."productId" IN (SELECT id FROM juice_merge))<>5 THEN
 RAISE EXCEPTION 'Unexpected juice customizations'; END IF;
END $$;
UPDATE option_group SET "sortOrder"="sortOrder"+1,"updatedAt"=CURRENT_TIMESTAMP WHERE "productId" IN (SELECT id FROM single_size);
INSERT INTO option_group (id,"productId",name,required,"maxSelect","sortOrder","updatedAt")
SELECT 'size/'||id,id,'Tamanho',true,1,0,CURRENT_TIMESTAMP FROM single_size;
INSERT INTO option (id,"groupId",name,"priceDeltaCents","maxPerItem","sortOrder","updatedAt")
SELECT 'size-option/'||id,'size/'||id,size,0,1,0,CURRENT_TIMESTAMP FROM single_size;
UPDATE product p SET title=s.title,slug=s.slug,"updatedAt"=CURRENT_TIMESTAMP FROM single_size s WHERE p.id=s.id;
INSERT INTO option (id,"groupId",name,"priceDeltaCents","maxPerItem","sortOrder","updatedAt") VALUES
('juice-flavor/morango','36d4bf6f-3f3a-5bf3-a0d2-2b5817bb52cf','Morango',100,1,10,CURRENT_TIMESTAMP);
-- Preserve option IDs and historical snapshots for the green juice bases.
UPDATE option SET "groupId"='36d4bf6f-3f3a-5bf3-a0d2-2b5817bb52cf',name='Verde — '||name,
 description='Suco verde com base de '||lower(name)||'.',"priceDeltaCents"=100,"sortOrder"="sortOrder"+11,"updatedAt"=CURRENT_TIMESTAMP
WHERE "groupId"='02a16a87-672c-5cb3-8aae-11a449ac4b2e';
INSERT INTO product_category ("productId","categoryId")
SELECT DISTINCT '758e4be7-059e-50c1-bf0f-c119bc81aec3',c."categoryId" FROM product_category c JOIN juice_merge j ON j.id=c."productId" ON CONFLICT DO NOTHING;
INSERT INTO product_tag ("productId","tagId")
SELECT DISTINCT '758e4be7-059e-50c1-bf0f-c119bc81aec3',t."tagId" FROM product_tag t JOIN juice_merge j ON j.id=t."productId" ON CONFLICT DO NOTHING;
UPDATE order_item SET "productId"='758e4be7-059e-50c1-bf0f-c119bc81aec3' WHERE "productId" IN (SELECT id FROM juice_merge);
UPDATE product SET popularity=popularity+(SELECT sum(popularity) FROM product WHERE id IN (SELECT id FROM juice_merge)) WHERE id='758e4be7-059e-50c1-bf0f-c119bc81aec3';
DELETE FROM product WHERE id IN (SELECT id FROM juice_merge);
DO $$ BEGIN
 IF (SELECT count(*) FROM single_size s JOIN product p ON p.id=s.id JOIN option_group g ON g.id='size/'||s.id
 JOIN option o ON o."groupId"=g.id WHERE g.required AND g."maxSelect"=1 AND o.name=s.size AND o."priceDeltaCents"=0 AND p."basePriceCents"=s.price)<>5
 OR (SELECT count(*) FROM option WHERE "groupId"='36d4bf6f-3f3a-5bf3-a0d2-2b5817bb52cf')<>14 THEN
 RAISE EXCEPTION 'Final size/flavor validation failed'; END IF;
END $$;
COMMIT;
