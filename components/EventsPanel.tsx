"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";

type User = { id: string; email: string; role: "ADMIN" | "STAFF" | "OWNER" } | null;
type Event = {
  _id: string;
  title: string;
  startAt: string;
  endAt?: string;
  location?: string;
  isPublic: boolean;
};

export default function EventsPanel() {
  const [user, setUser] = useState<User>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState(""); // Add description state
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]); 
  // Form state
  const [title, setTitle] = useState("");
  const [startAt, setStartAt] = useState("");
  const [location, setLocation] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const canCreate = useMemo(() => {
    if (!user) return false;
    if (user.role === "ADMIN" || user.role === "OWNER") return true;
    return false;
  }, [user]);

  async function loadSession() {
    const r = await fetch("/api/auth/me", { cache: "no-store" });
    const data = await r.json();
    setUser(data.user);
  }

  async function loadEvents() {
    const r = await fetch("/api/events", { cache: "no-store" });
    const data = await r.json();
    setEvents(data.events || []);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await Promise.all([loadSession(), loadEvents()]);
      } catch (e) {
        if (mounted) setError("Failed to load events");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, startAt: new Date(startAt).toISOString(), location, isPublic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create event");
      setTitle("");
      setStartAt("");
      setLocation("");
      setDescription("");
      setCustomFields([]);
      await loadEvents();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    }
  }

  if (loading) return <div className="text-sm">Loading events...</div>;

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Events</h2>
        <p className="text-sm text-gray-600">Public events are visible to everyone. Owners/Admins can create events.</p>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {canCreate && (
        <form onSubmit={createEvent} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Start</Label>
              <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
             <div className="space-y-1 sm:col-span-2">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input id="isPublic" type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
              <Label htmlFor="isPublic" className="text-sm">Public</Label>
            </div>
            
          </div>
          <Button type="submit">Create event</Button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {events.length === 0 && <div className="p-4 text-sm text-gray-600">No events yet.</div>}
        {events.map((ev) => (
          <Card key={ev._id} className="transition-transform hover:-translate-y-0.5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="font-medium">{ev.title}</div>
                <Badge>{ev.isPublic ? "Public" : "Private"}</Badge>
              </div>
              <div className="text-xs text-gray-600 mt-1">{new Date(ev.startAt).toLocaleString()} {ev.location ? `• ${ev.location}` : ""}</div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-700">This is a sample event. Manage details in the dashboard.</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


