import { permanentRedirect } from "next/navigation";

/** Alias em plural — redireciona para o pré-cadastro. */
export default function ParceirosAliasPage() {
  permanentRedirect("/parceiro");
}
