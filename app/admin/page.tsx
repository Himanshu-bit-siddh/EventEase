import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getBaseUrl } from "@/lib/getBaseUrl";

type UserLite = { _id: string; email: string; role: "ADMIN" | "STAFF" | "OWNER" };

async function fetchUsers(): Promise<{ users: UserLite[] }> {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/admin/users`, { cache: "no-store" });
  if (!res.ok) return { users: [] };
  return res.json();
}

export default async function AdminPage() {
  const current = await getSessionUser();
  if (!current) redirect("/register");
  if (current.role !== "ADMIN") redirect("/dashboard");
  const { users } = await fetchUsers();
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Admin • Users</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((u: UserLite) => (
          <Card key={u._id}>
            <CardHeader>
              <div className="font-medium">{u.email}</div>
              <div className="text-xs text-gray-600">Role: {u.role}</div>
            </CardHeader>
            <CardContent>
              <form action="/api/admin/users" method="post" className="flex gap-2 items-center">
                <input type="hidden" name="userId" value={u._id} />
                <select name="role" className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm">
                  <option value="OWNER">Owner</option>
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <Button type="submit">Update</Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


