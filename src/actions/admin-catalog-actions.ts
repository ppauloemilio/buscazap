"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCategoryAsAdmin,
  createCityAsAdmin,
  createStateAsAdmin,
  deleteCategoryAsAdmin,
  deleteCityAsAdmin,
  deleteStateAsAdmin,
  updateCategoryAsAdmin,
  updateCityAsAdmin,
  updateStateAsAdmin,
} from "@/application/services/admin-catalog-service";
import { getCurrentAdmin } from "@/lib/admin-session";
import {
  createCategorySchema,
  createCitySchema,
  createStateSchema,
  updateCategorySchema,
  updateCitySchema,
  updateStateSchema,
} from "@/schemas/admin-catalog-schemas";

const CATALOG_PATHS = [
  "/admin/categorias",
  "/admin/estados",
  "/admin/cidades",
  "/",
  "/categorias",
  "/cidades",
  "/buscar",
  "/painel/anuncios/novo",
  "/painel/perfil",
] as const;

function revalidateCatalogPaths() {
  for (const path of CATALOG_PATHS) {
    revalidatePath(path);
  }
}

function redirectWithCatalogError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createCategoryAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const parsed = createCategorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    icon: formData.get("icon") || "Tag",
    sortOrder: formData.get("sortOrder") || "0",
  });

  if (!parsed.success) {
    redirectWithCatalogError(
      "/admin/categorias",
      parsed.error.errors[0]?.message ?? "Dados inválidos"
    );
  }

  try {
    await createCategoryAsAdmin({
      adminId: admin.id,
      ...parsed.data,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("Unique constraint")
        ? "Já existe uma categoria com este nome ou identificador na URL"
        : error instanceof Error
          ? error.message
          : "Não foi possível criar a categoria";
    redirectWithCatalogError("/admin/categorias", message);
  }

  revalidateCatalogPaths();
  redirect("/admin/categorias?saved=1");
}

export async function updateCategoryAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const parsed = updateCategorySchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    icon: formData.get("icon"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    redirectWithCatalogError(
      "/admin/categorias",
      parsed.error.errors[0]?.message ?? "Dados inválidos"
    );
  }

  try {
    await updateCategoryAsAdmin({
      adminId: admin.id,
      ...parsed.data,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("Unique constraint")
        ? "Já existe uma categoria com este nome ou identificador na URL"
        : error instanceof Error
          ? error.message
          : "Não foi possível atualizar a categoria";
    redirectWithCatalogError("/admin/categorias", message);
  }

  revalidateCatalogPaths();
  redirect("/admin/categorias?saved=1");
}

export async function deleteCategoryAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");
  const id = formData.get("id");
  if (typeof id !== "string" || !id) redirect("/admin/categorias");

  try {
    await deleteCategoryAsAdmin({ adminId: admin.id, id });
  } catch (error) {
    redirectWithCatalogError(
      "/admin/categorias",
      error instanceof Error ? error.message : "Não foi possível excluir a categoria"
    );
  }

  revalidateCatalogPaths();
  redirect("/admin/categorias?deleted=1");
}

export async function createStateAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const parsed = createStateSchema.safeParse({
    uf: formData.get("uf"),
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder") || "0",
  });

  if (!parsed.success) {
    redirectWithCatalogError(
      "/admin/estados",
      parsed.error.errors[0]?.message ?? "Dados inválidos"
    );
  }

  try {
    await createStateAsAdmin({ adminId: admin.id, ...parsed.data });
  } catch (error) {
    redirectWithCatalogError(
      "/admin/estados",
      error instanceof Error ? error.message : "Não foi possível criar o estado"
    );
  }

  revalidateCatalogPaths();
  redirect("/admin/estados?saved=1");
}

export async function updateStateAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const parsed = updateStateSchema.safeParse({
    id: formData.get("id"),
    uf: formData.get("uf"),
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    redirectWithCatalogError(
      "/admin/estados",
      parsed.error.errors[0]?.message ?? "Dados inválidos"
    );
  }

  try {
    await updateStateAsAdmin({ adminId: admin.id, ...parsed.data });
  } catch (error) {
    redirectWithCatalogError(
      "/admin/estados",
      error instanceof Error ? error.message : "Não foi possível atualizar o estado"
    );
  }

  revalidateCatalogPaths();
  redirect("/admin/estados?saved=1");
}

export async function deleteStateAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");
  const id = formData.get("id");
  if (typeof id !== "string" || !id) redirect("/admin/estados");

  try {
    await deleteStateAsAdmin({ adminId: admin.id, id });
  } catch (error) {
    redirectWithCatalogError(
      "/admin/estados",
      error instanceof Error ? error.message : "Não foi possível excluir o estado"
    );
  }

  revalidateCatalogPaths();
  redirect("/admin/estados?deleted=1");
}

export async function createCityAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const parsed = createCitySchema.safeParse({
    name: formData.get("name"),
    stateId: formData.get("stateId"),
  });

  if (!parsed.success) {
    redirectWithCatalogError(
      "/admin/cidades",
      parsed.error.errors[0]?.message ?? "Dados inválidos"
    );
  }

  try {
    await createCityAsAdmin({ adminId: admin.id, ...parsed.data });
  } catch (error) {
    redirectWithCatalogError(
      "/admin/cidades",
      error instanceof Error ? error.message : "Não foi possível criar a cidade"
    );
  }

  revalidateCatalogPaths();
  redirect("/admin/cidades?saved=1");
}

export async function updateCityAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const parsed = updateCitySchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    stateId: formData.get("stateId"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    redirectWithCatalogError(
      "/admin/cidades",
      parsed.error.errors[0]?.message ?? "Dados inválidos"
    );
  }

  try {
    await updateCityAsAdmin({ adminId: admin.id, ...parsed.data });
  } catch (error) {
    redirectWithCatalogError(
      "/admin/cidades",
      error instanceof Error ? error.message : "Não foi possível atualizar a cidade"
    );
  }

  revalidateCatalogPaths();
  redirect("/admin/cidades?saved=1");
}

export async function deleteCityAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");
  const id = formData.get("id");
  if (typeof id !== "string" || !id) redirect("/admin/cidades");

  try {
    await deleteCityAsAdmin({ adminId: admin.id, id });
  } catch (error) {
    redirectWithCatalogError(
      "/admin/cidades",
      error instanceof Error ? error.message : "Não foi possível excluir a cidade"
    );
  }

  revalidateCatalogPaths();
  redirect("/admin/cidades?deleted=1");
}
