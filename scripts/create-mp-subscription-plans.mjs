/**
 * Cria planos de assinatura (Básico / Pro) no Mercado Pago.
 *
 * USA APENAS o token da app Assinaturas — NÃO usa MERCADOPAGO_ACCESS_TOKEN (PIX).
 *
 * Uso (PowerShell):
 *   $env:MERCADOPAGO_SUBSCRIPTIONS_ACCESS_TOKEN="TEST-..."
 *   node scripts/create-mp-subscription-plans.mjs
 *
 * Opcional:
 *   $env:APP_URL="https://buscazapp.com.br"
 *   node scripts/create-mp-subscription-plans.mjs --list
 */

const SUBSCRIPTIONS_TOKEN = process.env.MERCADOPAGO_SUBSCRIPTIONS_ACCESS_TOKEN?.trim();
const PIX_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
const APP_URL = (
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://buscazapp.com.br"
)
  .trim()
  .replace(/\/$/, "");

const listOnly = process.argv.includes("--list");

if (!SUBSCRIPTIONS_TOKEN) {
  console.error(
    "Defina MERCADOPAGO_SUBSCRIPTIONS_ACCESS_TOKEN com o Access Token da app Assinaturas (TEST-... ou APP_USR-...)."
  );
  console.error(
    "NÃO use MERCADOPAGO_ACCESS_TOKEN aqui — esse token é do PIX e não deve ser misturado."
  );
  process.exit(1);
}

if (PIX_TOKEN && PIX_TOKEN === SUBSCRIPTIONS_TOKEN) {
  console.error(
    "O token de Assinaturas é igual ao MERCADOPAGO_ACCESS_TOKEN (PIX)."
  );
  console.error(
    "Use o Access Token da aplicação Buscazapp-Assinaturas, não o do Checkout Transparente."
  );
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${SUBSCRIPTIONS_TOKEN}`,
  "Content-Type": "application/json",
};

async function listPlans() {
  const response = await fetch(
    "https://api.mercadopago.com/preapproval_plan/search?limit=50",
    { headers: { Authorization: headers.Authorization }, cache: "no-store" }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `Falha ao listar planos (HTTP ${response.status}): ${JSON.stringify(data)}`
    );
  }
  return data.results ?? [];
}

async function createPlan({ reason, amount }) {
  const body = {
    reason,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: amount,
      currency_id: "BRL",
    },
    back_url: `${APP_URL}/painel/assinatura`,
  };

  const response = await fetch("https://api.mercadopago.com/preapproval_plan", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `Falha ao criar "${reason}" (HTTP ${response.status}): ${JSON.stringify(data)}`
    );
  }

  return data;
}

function printPlan(label, plan) {
  console.log(`\n${label}`);
  console.log(`  reason:  ${plan.reason ?? "(sem reason)"}`);
  console.log(`  id:      ${plan.id}`);
  console.log(`  status:  ${plan.status ?? "n/a"}`);
  if (plan.auto_recurring?.transaction_amount != null) {
    console.log(
      `  amount:  R$ ${Number(plan.auto_recurring.transaction_amount).toFixed(2)} / ${plan.auto_recurring.frequency_type}`
    );
  }
  if (plan.init_point) {
    console.log(`  checkout: ${plan.init_point}`);
  }
}

try {
  console.log("Mercado Pago — planos de assinatura");
  console.log(`back_url base: ${APP_URL}/painel/assinatura`);
  console.log(
    `token: ${SUBSCRIPTIONS_TOKEN.slice(0, 8)}… (app Assinaturas; PIX não alterado)\n`
  );

  if (listOnly) {
    const plans = await listPlans();
    if (plans.length === 0) {
      console.log("Nenhum plano encontrado nesta conta/app.");
    } else {
      console.log(`${plans.length} plano(s):`);
      for (const plan of plans) {
        printPlan(`• ${plan.reason ?? plan.id}`, plan);
      }
    }
    process.exit(0);
  }

  const existing = await listPlans();
  const byReason = new Map(
    existing.map((plan) => [String(plan.reason ?? "").toLowerCase(), plan])
  );

  const basicReason = "BuscaZapp Plano Básico";
  const plusReason = "BuscaZapp Plano Pro";

  let basic =
    byReason.get(basicReason.toLowerCase()) ??
    existing.find(
      (p) =>
        Number(p.auto_recurring?.transaction_amount) === 9.99 &&
        String(p.reason ?? "").toLowerCase().includes("básico")
    );

  let plus =
    byReason.get(plusReason.toLowerCase()) ??
    existing.find(
      (p) =>
        Number(p.auto_recurring?.transaction_amount) === 14.99 &&
        String(p.reason ?? "").toLowerCase().includes("pro")
    );

  if (basic) {
    console.log("Plano Básico já existe — reutilizando.");
  } else {
    console.log("Criando plano Básico (R$ 9,99/mês)…");
    basic = await createPlan({ reason: basicReason, amount: 9.99 });
  }

  if (plus) {
    console.log("Plano Pro já existe — reutilizando.");
  } else {
    console.log("Criando plano Pro (R$ 14,99/mês)…");
    plus = await createPlan({ reason: plusReason, amount: 14.99 });
  }

  printPlan("Plano Básico", basic);
  printPlan("Plano Pro", plus);

  console.log("\n--- Cole na Vercel (Environment Variables) ---\n");
  console.log(`MERCADOPAGO_PLAN_BASIC_ID=${basic.id}`);
  console.log(`MERCADOPAGO_PLAN_PLUS_ID=${plus.id}`);
  console.log(
    "\nPIX não foi alterado. Redeploy só depois que o código ler esses IDs."
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
