import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);

  const provider = await prisma.provider.upsert({
    where: { email: "demo@buscazap.com.br" },
    update: {},
    create: {
      name: "Demo Prestador",
      email: "demo@buscazap.com.br",
      whatsapp: "5511999999999",
      passwordHash,
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const premiumExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const seedAds = [
    {
      title: "Dr. Carlos Mendes - Cardiologista",
      description:
        "Consultas cardiológicas com atendimento humanizado e equipamentos modernos.",
      type: "PROFESSIONAL",
      category: "Saúde",
      city: "São Paulo",
      state: "SP",
      neighborhood: "Moema",
      whatsappNumber: "5511999887766",
      rating: 4.9,
      reviewCount: 127,
      premiumExpiresAt,
    },
    {
      title: "TechFix Assistência Técnica",
      description:
        "Conserto de celulares, notebooks e tablets. Atendimento em domicílio.",
      type: "SERVICE",
      category: "Tecnologia",
      city: "Rio de Janeiro",
      state: "RJ",
      neighborhood: "Copacabana",
      whatsappNumber: "5521988776655",
      rating: 4.7,
      reviewCount: 89,
    },
    {
      title: "Sabor & Arte Restaurante",
      description: "Comida caseira com ingredientes frescos. Delivery e retirada.",
      type: "COMPANY",
      category: "Alimentação",
      city: "Belo Horizonte",
      state: "MG",
      neighborhood: "Savassi",
      whatsappNumber: "5531977665544",
      rating: 4.8,
      reviewCount: 234,
      premiumExpiresAt,
    },
    {
      title: "Móveis Planejados Silva",
      description: "Projetos personalizados para cozinhas, quartos e escritórios.",
      type: "PRODUCT",
      category: "Construção",
      city: "Curitiba",
      state: "PR",
      neighborhood: "Batel",
      whatsappNumber: "5541966554433",
      rating: 4.6,
      reviewCount: 56,
    },
    {
      title: "Studio Bella - Estética",
      description: "Tratamentos faciais, corporais e design de sobrancelhas.",
      type: "SERVICE",
      category: "Beleza",
      city: "Brasília",
      state: "DF",
      neighborhood: "Asa Sul",
      whatsappNumber: "5561855443322",
      rating: 5.0,
      reviewCount: 178,
      premiumExpiresAt,
    },
    {
      title: "Auto Center Premium",
      description: "Mecânica geral, funilaria e pintura automotiva.",
      type: "COMPANY",
      category: "Automotivo",
      city: "Salvador",
      state: "BA",
      neighborhood: "Pituba",
      whatsappNumber: "5571944332211",
      rating: 4.5,
      reviewCount: 92,
    },
  ];

  await prisma.advertisement.deleteMany({ where: { providerId: provider.id } });

  for (const ad of seedAds) {
    await prisma.advertisement.create({
      data: {
        providerId: provider.id,
        status: "APPROVED",
        ...ad,
      },
    });
  }

  console.log("Seed concluído. Login demo: demo@buscazap.com.br / 123456");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
