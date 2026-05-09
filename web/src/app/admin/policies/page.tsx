import { AdminFrame } from "../AdminFrame";
import { PageHeader } from "@/components/layout";
import { listPolicies } from "@/lib/demo-store";
import { PoliciesClient } from "./PoliciesClient";

export const dynamic = "force-dynamic";

export default function PoliciesPage() {
  const policies = listPolicies();

  return (
    <AdminFrame>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Admin"
          title="Modificar policies"
          description="Trae todas las policies mockeadas y permite modificar una a una, agregar nuevas, desactivar o sacar reglas."
        />
        <PoliciesClient initialPolicies={policies} />
      </div>
    </AdminFrame>
  );
}
