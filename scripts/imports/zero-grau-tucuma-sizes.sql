-- Zero Grau: consolidate size variants; preserve original order snapshots.
-- Run after zero-grau-tucuma.sql. One transaction; rejects unsafe catalog changes.
BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '60s';
SELECT pg_advisory_xact_lock(hashtext('menu-import/01a0f62e-f662-7d28-801d-f4eea0f9be24'));
CREATE TEMP TABLE size_variant (id text, target text, old_title text, title text, slug text, size text, price integer, position integer) ON COMMIT DROP;
INSERT INTO size_variant VALUES
('3a9fe21f-a957-50e1-bf7b-2d83de0d86b9', '3a9fe21f-a957-50e1-bf7b-2d83de0d86b9', 'Açaí 350 ml', 'Açaí', 'acai', '350 ml', 1400, 0),
('efac9f48-2f00-526d-9c12-7bf6ceb841f7', '3a9fe21f-a957-50e1-bf7b-2d83de0d86b9', 'Açaí 500 ml', 'Açaí', 'acai', '500 ml', 1800, 1),
('3f8d8888-f3aa-5d87-9e85-009fb90bbbe1', '3f8d8888-f3aa-5d87-9e85-009fb90bbbe1', 'Creme de cupuaçu 350 ml', 'Creme de cupuaçu', 'creme-de-cupuacu', '350 ml', 1400, 0),
('ed63d440-5c60-5c55-88cd-c55d19b5339b', '3f8d8888-f3aa-5d87-9e85-009fb90bbbe1', 'Creme de cupuaçu 500 ml', 'Creme de cupuaçu', 'creme-de-cupuacu', '500 ml', 1800, 1),
('08421643-e702-5c74-afc4-63e288f8d5dc', '08421643-e702-5c74-afc4-63e288f8d5dc', 'Casadinho 350 ml', 'Casadinho', 'casadinho', '350 ml', 1400, 0),
('2768616b-df95-5e49-9487-3193ac16c978', '08421643-e702-5c74-afc4-63e288f8d5dc', 'Casadinho 500 ml', 'Casadinho', 'casadinho', '500 ml', 1800, 1),
('94df9cd1-3fca-51f4-add8-efe92942466c', '94df9cd1-3fca-51f4-add8-efe92942466c', 'Batata frita pequena', 'Batata frita', 'batata-frita', 'Pequena', 2000, 0),
('25c7cb09-abdd-5087-b733-d1729b35ced8', '94df9cd1-3fca-51f4-add8-efe92942466c', 'Batata frita grande', 'Batata frita', 'batata-frita', 'Grande', 2600, 1),
('e5310e52-a8dd-5817-b233-c5f126d5b6a4', 'e5310e52-a8dd-5817-b233-c5f126d5b6a4', 'Milk shake pequeno', 'Milk shake', 'milk-shake', 'Pequeno', 1400, 0),
('c5db0a2b-8436-583e-94b4-f0b4bcef5f94', 'e5310e52-a8dd-5817-b233-c5f126d5b6a4', 'Milk shake grande', 'Milk shake', 'milk-shake', 'Grande', 1800, 1),
('3d0483d1-a393-5418-a442-5301dee5d73c', '3d0483d1-a393-5418-a442-5301dee5d73c', 'Refrigerante lata 350 ml', 'Refrigerante', 'refrigerante', 'Lata 350 ml', 700, 0),
('f655f0e7-7cf2-54d0-a41c-c93b57199786', '3d0483d1-a393-5418-a442-5301dee5d73c', 'Refrigerante 500 ml', 'Refrigerante', 'refrigerante', '500 ml', 800, 1),
('71699b05-c87b-5dcd-9ca0-b7b81f224f55', '3d0483d1-a393-5418-a442-5301dee5d73c', 'Refrigerante 600 ml', 'Refrigerante', 'refrigerante', '600 ml', 800, 2),
('cd5dcfde-963f-5a99-9024-fbe8f4241b6f', '3d0483d1-a393-5418-a442-5301dee5d73c', 'Refrigerante 1 litro', 'Refrigerante', 'refrigerante', '1 litro', 1100, 3),
('31a70960-6ef7-5954-8522-559437280e1e', '3d0483d1-a393-5418-a442-5301dee5d73c', 'Refrigerante 1,5 litro', 'Refrigerante', 'refrigerante', '1,5 litro', 1300, 4),
('1934a9d9-a3a3-5431-bd21-69d1dac1ad3b', '3d0483d1-a393-5418-a442-5301dee5d73c', 'Refrigerante 2 litros', 'Refrigerante', 'refrigerante', '2 litros', 1600, 5),
('370c898d-ea86-5e2b-8f79-a5e34ec0134a', '370c898d-ea86-5e2b-8f79-a5e34ec0134a', 'Guaraná Quinari 500 ml', 'Guaraná Quinari', 'guarana-quinari', '500 ml', 500, 0),
('5a371271-3c4c-55fd-b79a-b27239b36013', '370c898d-ea86-5e2b-8f79-a5e34ec0134a', 'Guaraná Quinari 1 litro', 'Guaraná Quinari', 'guarana-quinari', '1 litro', 800, 1),
('9349a641-55d7-54e8-ad27-34912d31a9dc', '370c898d-ea86-5e2b-8f79-a5e34ec0134a', 'Guaraná Quinari 2 litros', 'Guaraná Quinari', 'guarana-quinari', '2 litros', 1100, 2);
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM size_variant v LEFT JOIN product p ON p.id=v.id
 WHERE p.id IS NULL OR p."companyId" <> '01a0f62e-f662-7d28-801d-f4eea0f9be24'
 OR p.title <> v.old_title OR p."basePriceCents" <> v.price) THEN
 RAISE EXCEPTION 'Unexpected catalog: size correction already applied or source changed'; END IF;
 IF EXISTS (SELECT 1 FROM unit_product WHERE "productId" IN (SELECT id FROM size_variant))
 OR EXISTS (SELECT 1 FROM product_review WHERE "productId" IN (SELECT id FROM size_variant))
 OR EXISTS (SELECT 1 FROM product_recipe_ingredient WHERE "productId" IN (SELECT id FROM size_variant)) THEN
 RAISE EXCEPTION 'Size variants have unit/review/recipe dependencies; explicit merge required'; END IF;
 -- Additional options must match before redundant variant groups can be removed.
 IF EXISTS (
 SELECT 1 FROM size_variant v WHERE v.id <> v.target AND (
 (SELECT jsonb_agg(payload ORDER BY payload::text) FROM (
 SELECT jsonb_build_array(g.name,g.required,g."maxSelect",g."allowRepeatSelection",g."priceRule",g."sortOrder",o.name,o.description,o."imageUrl",o."priceDeltaCents",o."maxPerItem",o.available,o."sortOrder") payload
 FROM option_group g LEFT JOIN option o ON o."groupId"=g.id WHERE g."productId"=v.id) x)
 IS DISTINCT FROM
 (SELECT jsonb_agg(payload ORDER BY payload::text) FROM (
 SELECT jsonb_build_array(g.name,g.required,g."maxSelect",g."allowRepeatSelection",g."priceRule",g."sortOrder",o.name,o.description,o."imageUrl",o."priceDeltaCents",o."maxPerItem",o.available,o."sortOrder") payload
 FROM option_group g LEFT JOIN option o ON o."groupId"=g.id WHERE g."productId"=v.target) x))) THEN
 RAISE EXCEPTION 'Variant customizations differ'; END IF;
END $$;
INSERT INTO option_group (id,"productId",name,required,"maxSelect","sortOrder","updatedAt")
SELECT 'size/'||target,target,'Tamanho',true,1,0,CURRENT_TIMESTAMP FROM size_variant GROUP BY target;
UPDATE option_group SET "sortOrder"="sortOrder"+1,"updatedAt"=CURRENT_TIMESTAMP
WHERE "productId" IN (SELECT target FROM size_variant) AND name <> 'Tamanho';
INSERT INTO option (id,"groupId",name,"priceDeltaCents","maxPerItem","sortOrder","updatedAt")
SELECT 'size-option/'||v.id,'size/'||v.target,v.size,v.price-base.price,1,v.position,CURRENT_TIMESTAMP
FROM size_variant v JOIN size_variant base ON base.id=v.target;
INSERT INTO product_category ("productId","categoryId")
SELECT DISTINCT v.target,c."categoryId" FROM size_variant v JOIN product_category c ON c."productId"=v.id ON CONFLICT DO NOTHING;
INSERT INTO product_tag ("productId","tagId")
SELECT DISTINCT v.target,t."tagId" FROM size_variant v JOIN product_tag t ON t."productId"=v.id ON CONFLICT DO NOTHING;
-- Product names/prices on historical order items remain immutable.
UPDATE order_item i SET "productId"=v.target FROM size_variant v WHERE i."productId"=v.id AND v.id<>v.target;
UPDATE product p SET title=v.title,slug=v.slug,popularity=(SELECT sum(old.popularity) FROM product old JOIN size_variant s ON old.id=s.id WHERE s.target=v.target),"updatedAt"=CURRENT_TIMESTAMP
FROM size_variant v WHERE p.id=v.target AND v.id=v.target;
DELETE FROM product WHERE id IN (SELECT id FROM size_variant WHERE id<>target);
DO $$ BEGIN
 IF (SELECT count(*) FROM option o JOIN size_variant v ON o.id='size-option/'||v.id
 JOIN product p ON p.id=v.target JOIN option_group g ON g.id=o."groupId"
 WHERE p."basePriceCents"+o."priceDeltaCents"=v.price AND g.required AND g."maxSelect"=1) <> (SELECT count(*) FROM size_variant) THEN
 RAISE EXCEPTION 'Size price/selection validation failed'; END IF;
END $$;
COMMIT;
