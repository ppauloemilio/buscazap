import { AdvertisementType } from "@/domain/enums";

export const CATEGORY_OTHER_VALUE = "__OUTRO__";

export const ADVERTISEMENT_TYPE_OPTIONS = [
  { value: AdvertisementType.PROFESSIONAL, label: "Profissional" },
  { value: AdvertisementType.COMPANY, label: "Empresa" },
  { value: AdvertisementType.PRODUCT, label: "Produto" },
  { value: AdvertisementType.SERVICE, label: "Serviço" },
] as const;
