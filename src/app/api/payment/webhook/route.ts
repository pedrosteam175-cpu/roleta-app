// Endpoint legado — mantido por compatibilidade (o registro automático de webhook
// do Asaas em /api/admin/webhook ainda referencia esta URL).
// O endpoint principal e recomendado para a Stripe é /api/webhooks/stripe.
export { POST, GET } from '../../webhooks/stripe/route';
