import { redirect } from "next/navigation";
import { listAdminAuditLogs } from "@/application/services/admin-service";
import {
  CATEGORY_AUDIT_ENTITY_LABEL,
  CATEGORY_SUGGESTION_AUDIT_ENTITY_LABEL,
  formatCategoryAuditMetadata,
  getCategoryAuditActionLabel,
} from "@/config/category-catalog";
import { AdminLayout } from "@/features/admin/components/admin-layout";
import { getCurrentAdmin } from "@/lib/admin-session";
import { Card, CardContent } from "@/components/ui/card";

function formatAuditAction(action: string, entityType: string): string {
  if (
    entityType === "CatalogCategory" ||
    entityType === "CategorySuggestion"
  ) {
    return getCategoryAuditActionLabel(action) ?? action;
  }

  return action;
}

function formatAuditEntityType(entityType: string): string {
  if (entityType === "CatalogCategory") {
    return CATEGORY_AUDIT_ENTITY_LABEL;
  }

  if (entityType === "CategorySuggestion") {
    return CATEGORY_SUGGESTION_AUDIT_ENTITY_LABEL;
  }

  return entityType;
}

export default async function AdminAuditPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/entrar");

  const logs = await listAdminAuditLogs();

  return (
    <AdminLayout>
      <h2 className="mb-6 text-xl font-semibold">Auditoria</h2>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma ação registrada ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const categoryMetadata =
              log.entityType === "CatalogCategory" ||
              log.entityType === "CategorySuggestion"
                ? formatCategoryAuditMetadata(log.metadata)
                : null;

            return (
            <Card key={log.id}>
              <CardContent className="p-4 text-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium">
                    {formatAuditAction(log.action, log.entityType)}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {log.createdAt.toLocaleString("pt-BR")}
                  </span>
                </div>
                <p className="text-muted-foreground">
                  {formatAuditEntityType(log.entityType)}
                  {log.entityId ? ` · ${log.entityId}` : ""}
                </p>
                <p className="text-muted-foreground">
                  Por {log.admin.name} ({log.admin.email})
                </p>
                {categoryMetadata ? (
                  <p className="mt-2 rounded bg-muted p-2 text-xs">{categoryMetadata}</p>
                ) : (
                  log.metadata && (
                    <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 text-xs">
                      {log.metadata}
                    </pre>
                  )
                )}
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
