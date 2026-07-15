import { SERVICE_AREA_OPTIONS } from "@/config/service-area";
import { ServiceArea } from "@/domain/enums";

interface ServiceAreaFieldProps {
  readonly name?: string;
  readonly id?: string;
  readonly defaultValue?: string;
  readonly labelClassName?: string;
  readonly selectClassName?: string;
  readonly showHint?: boolean;
}

export function ServiceAreaField({
  name = "serviceArea",
  id = "serviceArea",
  defaultValue = ServiceArea.NEIGHBORHOOD_ONLY,
  labelClassName = "mb-1 block text-sm font-medium",
  selectClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm",
  showHint = true,
}: ServiceAreaFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
        Área de atendimento
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        required
        className={selectClassName}
      >
        {SERVICE_AREA_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {showHint && (
        <p className="mt-1 text-xs text-muted-foreground">
          Deixe claro se você atende só no bairro ou em toda a cidade.
        </p>
      )}
    </div>
  );
}
