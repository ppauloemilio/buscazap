/**
 * Cria um comprador de teste no Mercado Pago e exibe o e-mail correto.
 *
 * Uso:
 *   set MERCADOPAGO_ACCESS_TOKEN=TEST-seu-token
 *   node scripts/create-mp-test-buyer.mjs
 */

const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();

if (!token) {
  console.error("Defina MERCADOPAGO_ACCESS_TOKEN com o token TEST-... do Mercado Pago.");
  process.exit(1);
}

const response = await fetch("https://api.mercadopago.com/users/test", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    site_id: "MLB",
    description: "Comprador BuscaZap",
  }),
});

const data = await response.json();

if (!response.ok) {
  console.error("Erro ao criar comprador de teste:");
  console.error(JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log("Comprador de teste criado com sucesso!\n");
console.log(`E-mail para MERCADOPAGO_TEST_PAYER_EMAIL:`);
console.log(data.email);
console.log(`\nUsuário: ${data.nickname}`);
console.log(`Senha: ${data.password}`);
console.log(`User ID: ${data.id}`);
