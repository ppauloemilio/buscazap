import {
  createSponsorBannerAction,
  deleteSponsorBannerAction,
  updateSponsorBannerAction,
} from "@/actions/admin-actions";
import { AdvertisementImage } from "@/components/advertisement/advertisement-image";
import { ImageFileInput } from "@/components/advertisement/image-file-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  formatSponsorBannerSizeHint,
  SPONSOR_BANNER_RECOMMENDATION,
} from "@/config/sponsor-banners";
import type { SponsorBannerRecord } from "@/application/services/sponsor-banner-service";
import { formatMaxImageSizeLabel } from "@/shared/utils/image-file-validation";

interface AdminSponsorBannersManagerProps {
  readonly banners: readonly SponsorBannerRecord[];
}

export function AdminSponsorBannersManager({
  banners,
}: AdminSponsorBannersManagerProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Novo banner</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-muted-foreground">
            Área comercial da home (carrossel a cada{" "}
            {SPONSOR_BANNER_RECOMMENDATION.rotateIntervalMs / 1000}s).{" "}
            {formatSponsorBannerSizeHint()} JPG, PNG ou WebP até{" "}
            {formatMaxImageSizeLabel()}.
          </p>
          <form
            action={createSponsorBannerAction}
            encType="multipart/form-data"
            className="space-y-3"
          >
            <div>
              <label htmlFor="banner-title" className="mb-1 block text-sm font-medium">
                Título / patrocinador
              </label>
              <Input
                id="banner-title"
                name="title"
                required
                placeholder="Ex.: Clínica Exemplo"
              />
            </div>
            <div>
              <label htmlFor="banner-link" className="mb-1 block text-sm font-medium">
                Link ao clicar{" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </label>
              <Input
                id="banner-link"
                name="linkUrl"
                type="url"
                placeholder="https://..."
              />
            </div>
            <div>
              <label htmlFor="banner-image" className="mb-1 block text-sm font-medium">
                Imagem
              </label>
              <ImageFileInput
                id="banner-image"
                name="image"
                label="Banner"
                required
                hint={`${formatSponsorBannerSizeHint()} Máx. ${formatMaxImageSizeLabel()}.`}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked
                className="h-4 w-4 accent-[hsl(var(--whatsapp))]"
              />
              Ativo no carrossel
            </label>
            <Button type="submit" variant="whatsapp">
              Adicionar banner
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          Banners cadastrados ({banners.length})
        </h3>
        {banners.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum banner ainda. Cadastre o primeiro acima e libere a seção em
            Admin → Home.
          </p>
        ) : (
          banners.map((banner) => (
            <Card key={banner.id}>
              <CardContent className="space-y-3 pt-4">
                <div className="relative aspect-[3/1] max-w-xl overflow-hidden rounded-lg border bg-muted">
                  <AdvertisementImage
                    src={banner.imageUrl}
                    alt={banner.title}
                    fill
                    className="object-cover"
                    sizes="576px"
                  />
                </div>
                <form
                  action={updateSponsorBannerAction}
                  encType="multipart/form-data"
                  className="grid gap-3 sm:grid-cols-2"
                >
                  <input type="hidden" name="id" value={banner.id} />
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium">Título</label>
                    <Input name="title" required defaultValue={banner.title} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium">Link</label>
                    <Input
                      name="linkUrl"
                      type="url"
                      defaultValue={banner.linkUrl ?? ""}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Ordem</label>
                    <Input
                      name="sortOrder"
                      type="number"
                      defaultValue={banner.sortOrder}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Trocar imagem (opcional)
                    </label>
                    <ImageFileInput
                      name="image"
                      label="Banner"
                      hint={formatSponsorBannerSizeHint()}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={banner.isActive}
                      className="h-4 w-4 accent-[hsl(var(--whatsapp))]"
                    />
                    Ativo no carrossel
                  </label>
                  <div className="flex flex-wrap gap-2 sm:col-span-2">
                    <Button type="submit" size="sm" variant="whatsapp">
                      Salvar
                    </Button>
                  </div>
                </form>
                <form action={deleteSponsorBannerAction}>
                  <input type="hidden" name="id" value={banner.id} />
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                  >
                    Excluir
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
