"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import NavBar from "@/components/NavBar";

interface User {
  id: string;
  name?: string;
  email: string;
  role: "ADMIN" | "STAFF" | "OWNER";
}

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
  checkedInCount?: number;
}

interface DashboardStats {
  totalEvents: number;
  upcomingEvents: number;
  totalRegistrations: number;
  totalCheckIns: number;
  recentActivity: unknown[];
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    upcomingEvents: 0,
    totalRegistrations: 0,
    totalCheckIns: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch("/api/auth/me");
        if (!userResponse.ok) {
          router.push("/login");
          return;
        }
        const userData = await userResponse.json();
        setUser(userData.user);

        // Fetch events
        const eventsResponse = await fetch("/api/events");
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          setEvents(eventsData.events || []);
          
          // Calculate stats
          const allEvents = eventsData.events || [];
          const now = new Date();
          const upcomingEvents = allEvents.filter((event: Event) => new Date(event.startAt) > now);
          const totalRegistrations = allEvents.reduce((sum: number, event: Event) => sum + (event.registrationCount || 0), 0);
          const totalCheckIns = allEvents.reduce((sum: number, event: Event) => sum + (event.checkedInCount || 0), 0);
          
          setStats({
            totalEvents: allEvents.length,
            upcomingEvents: upcomingEvents.length,
            totalRegistrations,
            totalCheckIns,
            recentActivity: []
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    setUser(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const startDate = new Date(event.startAt);
    const endDate = event.endAt ? new Date(event.endAt) : null;

    if (startDate > now) {
      return { status: "Upcoming", color: "default" };
    } else if (endDate && endDate < now) {
      return { status: "Completed", color: "secondary" };
    } else {
      return { status: "Ongoing", color: "default" };
    }
  };

  const getAttendanceRate = (event: Event) => {
    if (!event.maxAttendees || !event.registrationCount) return 0;
    return Math.round((event.registrationCount / event.maxAttendees) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar user={user} onLogout={handleLogout} />
        <div className="container py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar user={user} onLogout={handleLogout} />
      
      <div className="container py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.name || user?.email?.split('@')[0]}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your events today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="animate-in slide-in-from-bottom-4 duration-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-in slide-in-from-bottom-4 duration-700" style={{animationDelay: '100ms'}}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Upcoming Events</p>
                  <p className="text-2xl font-bold text-foreground">{stats.upcomingEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-in slide-in-from-bottom-4 duration-700" style={{animationDelay: '200ms'}}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Registrations</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalRegistrations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-in slide-in-from-bottom-4 duration-700" style={{animationDelay: '300ms'}}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Check-ins</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalCheckIns}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Events List */}
          <div className="lg:col-span-2">
            <Card className="animate-in slide-in-from-bottom-4 duration-700" style={{animationDelay: '400ms'}}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Your Events</h2>
                  <Link
                    href="/events"
                    className="text-sm text-primary hover:text-primary/80 font-medium"
                  >
                    View all
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {events.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No events yet</h3>
                    <p className="text-muted-foreground mb-4">Get started by creating your first event.</p>
                    <Button onClick={() => router.push("/events/create")}>
                      Create Your First Event
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {events.slice(0, 5).map((event) => {
                      const eventStatus = getEventStatus(event);
                      const attendanceRate = getAttendanceRate(event);
                      
                      return (
                        <div key={event._id} className="p-6 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-base font-medium text-foreground truncate">
                                  {event.title}
                                </h3>
                                <Badge variant={eventStatus.color as "default" | "secondary"}>
                                  {eventStatus.status}
                                </Badge>
                                {!event.isPublic && (
                                  <Badge variant="secondary">
                                    Private
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {formatDate(event.startAt)}
                                </div>
                                
                                {event.location && (
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {event.location}
                                  </div>
                                )}
                                
                                {event.maxAttendees && (
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    {event.registrationCount || 0} / {event.maxAttendees} registered
                                    {attendanceRate > 0 && (
                                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                        {attendanceRate}%
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/events/${event._id}`)}
                              >
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/events/${event._id}/edit`)}
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card className="animate-in slide-in-from-bottom-4 duration-700" style={{animationDelay: '500ms'}}>
              <CardHeader>
                <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push("/events/create")}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New Event
                </Button>
                
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push("/events")}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Browse All Events
                </Button>
                
                {user?.role === "ADMIN" && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => router.push("/admin")}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Admin Panel
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="animate-in slide-in-from-bottom-4 duration-700" style={{animationDelay: '600ms'}}>
              <CardHeader>
                <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                  <p className="text-xs text-muted-foreground mt-1">Activity will appear here as you use the platform</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


