"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import NavBar from "@/components/NavBar";

// Proper Label typing
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

function Label({ children, ...props }: LabelProps) {
  return (
    <label {...props} className={`block text-sm font-medium ${props.className}`}>
      {children}
    </label>
  );
}

export default function CreateEventPage() {
  const router = useRouter();

  // Match your EventSchema fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");       // optional field in schema
  const [location, setLocation] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [tags, setTags] = useState("");         // comma separated string
  const [maxAttendees, setMaxAttendees] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          startAt: new Date(startAt).toISOString(),
          endAt: endAt ? new Date(endAt).toISOString() : undefined,
          location,
          isPublic,
          tags: tags ? tags.split(",").map(tag => tag.trim()) : [],
          maxAttendees: maxAttendees || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create event");

      router.push("/events");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container py-8 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Create Event</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="startAt">Start Date & Time</Label>
            <Input id="startAt" type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} required />
          </div>

          <div>
            <Label htmlFor="endAt">End Date & Time (Optional)</Label>
            <Input id="endAt" type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={location} onChange={e => setLocation(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input id="tags" value={tags} onChange={e => setTags(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="maxAttendees">Max Attendees</Label>
            <Input
              id="maxAttendees"
              type="number"
              min={1}
              value={maxAttendees}
              onChange={e => setMaxAttendees(e.target.value ? Number(e.target.value) : "")}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isPublic"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="isPublic" className="text-sm select-none">Public</Label>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Event"}
          </Button>
        </form>
      </div>
    </div>
  );
}
