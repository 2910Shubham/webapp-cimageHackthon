import { requireRole } from "@/lib/roles";
import { UserManagement } from "@/components/admin/UserManagement";

export default async function AdminPage() {
  const session = await requireRole("ADMIN");

  return (
    <main className="px-4 pt-6 lg:px-8 lg:pt-10">
      <header>
        <p className="text-sm font-medium text-violet-600">Administration</p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900 lg:text-4xl">
          User Management
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage user roles and access levels. You are signed in as{" "}
          <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
            {session.user.role}
          </span>
        </p>
      </header>

      <section className="mt-8">
        <UserManagement currentUserRole={session.user.role} currentUserId={session.user.id} />
      </section>
    </main>
  );
}
