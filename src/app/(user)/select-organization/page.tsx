import { listMyOrganizations } from "./_actions/server";
import { OrganizationPicker } from "./_components/organization-picker";

export default async function SelectOrganizationPage() {
  const organizations = await listMyOrganizations();

  return <OrganizationPicker organizations={organizations} />;
}
