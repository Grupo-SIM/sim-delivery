UPDATE "order_status_event" e
SET "status" = 'falta_de_pagamento'
FROM "order" o
WHERE e."orderId" = o."id"
  AND e."status" = 'cancelado'
  AND o."status" = 'cancelado'
  AND o."cancelReason" = 'Pagamento não confirmado em até 1 hora.';

UPDATE "order"
SET "status" = 'falta_de_pagamento'
WHERE "status" = 'cancelado'
  AND "cancelReason" = 'Pagamento não confirmado em até 1 hora.';
