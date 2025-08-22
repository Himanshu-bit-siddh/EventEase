"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import NavBar from "@/components/NavBar";

interface Event {
  _id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  location?: string;
  isPublic: boolean;
  tags?: string[];
  maxAttendees?: number;
  registrationCount?: number;
  imageUrl?: string;
}

interface User {
  id: string;
  name?: string;
  email: string;
  role: "ADMIN" | "STAFF" | "OWNER";
}

export default function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpForm, setRsvpForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { id } = await params;
        
        // Fetch event data
        const eventResponse = await fetch(`/api/events/${id}`);
        if (eventResponse.ok) {
          const eventData = await eventResponse.json();
          setEvent(eventData.event);
        }

        // Fetch user data
        const userResponse = await fetch("/api/auth/me");
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params]);

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRsvpLoading(true);

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: event?._id,
          ...rsvpForm,
        }),
      });

      if (response.ok) {
        setRsvpSuccess(true);
        setRsvpForm({ name: "", email: "", phone: "" });
      }
    } catch (error) {
      console.error("RSVP failed:", error);
    } finally {
      setRsvpLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50">
        <NavBar user={user} />
        <div className="container py-8">
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="text-center">
              <div className="spinner-lg mx-auto mb-4"></div>
              <p className="text-secondary-600">Loading event details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-secondary-50">
        <NavBar user={user} />
        <div className="container py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-secondary-900 mb-4">Event Not Found</h1>
            <p className="text-secondary-600 mb-6">The event you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <Button onClick={() => router.push("/events")}>
              Browse Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <NavBar user={user} />
      
      <div className="container py-8">
        {/* Event Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              }
            >
              Back
            </Button>
            <div className="h-6 w-px bg-secondary-300"></div>
            <Link href="/events" className="text-sm text-secondary-600 hover:text-secondary-900">
              All Events
            </Link>
          </div>
          
          <h1 className="text-4xl font-bold text-secondary-900 mb-4">{event.title}</h1>
          
          {event.description && (
            <p className="text-lg text-secondary-600 mb-6 max-w-3xl">
              {event.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            {event.imageUrl && (
              <Card>
                <CardContent className="p-0">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-64 object-cover rounded-t-lg"
                  />
                </CardContent>
              </Card>
            )}

            {/* Event Information */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-secondary-900">Event Details</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-secondary-900">Date & Time</p>
                      <p className="text-secondary-600">{formatDate(event.startAt)}</p>
                      {event.endAt && (
                        <p className="text-sm text-secondary-500">Ends: {formatDate(event.endAt)}</p>
                      )}
                    </div>
                  </div>

                  {event.location && (
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center mt-0.5">
                        <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-secondary-900">Location</p>
                        <p className="text-secondary-600">{event.location}</p>
                      </div>
                    </div>
                  )}

                  {event.tags && event.tags.length > 0 && (
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center mt-0.5">
                        <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-secondary-900">Tags</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {event.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RSVP Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <h2 className="text-xl font-semibold text-secondary-900">RSVP for this Event</h2>
                {event.maxAttendees && (
                  <p className="text-sm text-secondary-600">
                    {event.registrationCount || 0} of {event.maxAttendees} spots filled
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {rsvpSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-secondary-900 mb-2">RSVP Confirmed!</h3>
                    <p className="text-secondary-600 mb-4">You&apos;re all set for this event.</p>
                    <Button
                      variant="outline"
                      onClick={() => setRsvpSuccess(false)}
                    >
                      RSVP for Another Person
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleRsvpSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-secondary-900 mb-2">
                        Full Name
                      </label>
                      <Input
                        id="name"
                        name="name"
                        required
                        value={rsvpForm.name}
                        onChange={(e) => setRsvpForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-secondary-900 mb-2">
                        Email Address
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={rsvpForm.email}
                        onChange={(e) => setRsvpForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter your email"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-secondary-900 mb-2">
                        Phone Number
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        value={rsvpForm.phone}
                        onChange={(e) => setRsvpForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={rsvpLoading}
                    >
                      {rsvpLoading ? "Submitting..." : "Confirm RSVP"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


