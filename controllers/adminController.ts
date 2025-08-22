import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Event from "@/models/Event";
import Registration from "@/models/Registration";
import Interaction from "@/models/Interaction";
import type { JwtUser } from "@/lib/auth";

export async function getSystemStats(current: JwtUser) {
  await connectToDatabase();
  
  if (current.role !== "ADMIN") {
    return { error: "Forbidden" as const };
  }
  
  const [
    totalUsers,
    totalEvents,
    totalRegistrations,
    totalInteractions,
    recentEvents,
    recentRegistrations
  ] = await Promise.all([
    User.countDocuments(),
    Event.countDocuments(),
    Registration.countDocuments(),
    Interaction.countDocuments(),
    Event.find().sort({ createdAt: -1 }).limit(10).select("title createdAt ownerId"),
    Registration.find().sort({ createdAt: -1 }).limit(10).populate("eventId", "title")
  ]);
  
  // Get user role distribution
  const userRoleStats = await User.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Get event status distribution
  const eventStats = await Event.aggregate([
    {
      $group: {
        _id: "$isPublic",
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Get registration status distribution
  const registrationStats = await Registration.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);
  
  return {
    totalUsers,
    totalEvents,
    totalRegistrations,
    totalInteractions,
    userRoleStats,
    eventStats,
    registrationStats,
    recentEvents,
    recentRegistrations
  };
}

export async function listUsers(current: JwtUser, page = 1, limit = 20) {
  await connectToDatabase();
  
  if (current.role !== "ADMIN") {
    return { error: "Forbidden" as const };
  }
  
  const skip = (page - 1) * limit;
  
  const [users, totalUsers] = await Promise.all([
    User.find()
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments()
  ]);
  
  return {
    users,
    totalUsers,
    page,
    limit,
    totalPages: Math.ceil(totalUsers / limit)
  };
}

export async function updateUserRole(current: JwtUser, userId: string, newRole: string) {
  await connectToDatabase();
  
  if (current.role !== "ADMIN") {
    return { error: "Forbidden" as const };
  }
  
  if (!["ADMIN", "STAFF", "OWNER"].includes(newRole)) {
    return { error: "Invalid role" as const };
  }
  
  // Prevent admin from changing their own role
  if (String(current.id) === userId) {
    return { error: "Cannot change your own role" as const };
  }
  
  const user = await User.findById(userId);
  if (!user) {
    return { error: "User not found" as const };
  }
  
  user.role = newRole as any;
  await user.save();
  
  return { 
    user: { 
      id: String(user._id), 
      email: user.email, 
      role: user.role 
    } 
  };
}

export async function deleteUser(current: JwtUser, userId: string) {
  await connectToDatabase();
  
  if (current.role !== "ADMIN") {
    return { error: "Forbidden" as const };
  }
  
  // Prevent admin from deleting themselves
  if (String(current.id) === userId) {
    return { error: "Cannot delete your own account" as const };
  }
  
  const user = await User.findById(userId);
  if (!user) {
    return { error: "User not found" as const };
  }
  
  // Check if user owns any events
  const ownedEvents = await Event.countDocuments({ ownerId: user._id });
  if (ownedEvents > 0) {
    return { error: "Cannot delete user with owned events" as const };
  }
  
  // Delete user's registrations and interactions
  await Promise.all([
    Registration.deleteMany({ userId: user._id }),
    Interaction.deleteMany({ userId: user._id })
  ]);
  
  await user.deleteOne();
  
  return { ok: true as const };
}

export async function getEventAnalytics(current: JwtUser, eventId: string) {
  await connectToDatabase();
  
  if (current.role !== "ADMIN") {
    return { error: "Forbidden" as const };
  }
  
  const event = await Event.findById(eventId);
  if (!event) {
    return { error: "Event not found" as const };
  }
  
  const [
    registrationStats,
    interactionStats,
    checkInRate,
    waitlistCount
  ] = await Promise.all([
    Registration.aggregate([
      { $match: { eventId: event._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]),
    Interaction.aggregate([
      { $match: { eventId: event._id } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 }
        }
      }
    ]),
    Registration.aggregate([
      { $match: { eventId: event._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          checkedIn: { $sum: { $cond: [{ $eq: ["$status", "CHECKED_IN"] }, 1, 0] } }
        }
      }
    ]),
    Registration.countDocuments({ eventId: event._id, status: "WAITLISTED" })
  ]);
  
  const totalRegistrations = registrationStats.reduce((sum, stat) => sum + stat.count, 0);
  const checkedInCount = registrationStats.find(s => s._id === "CHECKED_IN")?.count || 0;
  
  return {
    event: {
      id: String(event._id),
      title: event.title,
      startAt: event.startAt,
      isPublic: event.isPublic
    },
    registrationStats,
    interactionStats,
    checkInRate: totalRegistrations > 0 ? (checkedInCount / totalRegistrations) * 100 : 0,
    waitlistCount,
    totalRegistrations
  };
}

export async function getSystemHealth(current: JwtUser) {
  await connectToDatabase();
  
  if (current.role !== "ADMIN") {
    return { error: "Forbidden" as const };
  }
  
  try {
    // Test database connection
    const dbStatus = await connectToDatabase();
    
    // Get basic system info
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
    
    return {
      status: "healthy" as const,
      database: "connected",
      systemInfo
    };
  } catch (error) {
    return {
      status: "unhealthy" as const,
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}


