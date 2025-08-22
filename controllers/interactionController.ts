import connectToDatabase from "@/lib/mongodb";
import Event from "@/models/Event";
import Interaction from "@/models/Interaction";
import Participant from "@/models/Participant";
import type { InteractionInput } from "@/validators/eventSchemas";
import type { JwtUser } from "@/lib/auth";

export async function createInteraction(
  eventId: string, 
  input: InteractionInput, 
  participantId?: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
) {
  await connectToDatabase();
  
  // Check if event exists and is public
  const event = await Event.findById(eventId);
  if (!event) return { error: "Event not found" as const };
  if (!event.isPublic) return { error: "Event is not public" as const };
  
  // Validate that either participantId or userId is provided
  if (!participantId && !userId) {
    return { error: "Either participantId or userId is required" as const };
  }
  
  // Create interaction
  const interaction = await Interaction.create({
    eventId: event._id,
    participantId,
    userId,
    type: input.type,
    content: input.content,
    metadata: {
      ...input.metadata,
      ipAddress,
      userAgent,
      timestamp: new Date()
    }
  });
  
  return { interaction };
}

export async function getEventInteractions(
  eventId: string, 
  type?: string,
  includeModerated = false
) {
  await connectToDatabase();
  
  const event = await Event.findById(eventId);
  if (!event) return { error: "Event not found" as const };
  
  const filter: any = { eventId: event._id };
  
  if (type) {
    filter.type = type;
  }
  
  if (!includeModerated) {
    filter.isModerated = false;
  }
  
  const interactions = await Interaction.find(filter)
    .populate("participantId", "name email")
    .populate("userId", "name email role")
    .sort({ createdAt: -1 })
    .limit(100);
  
  return { interactions };
}

export async function moderateInteraction(
  current: JwtUser,
  interactionId: string,
  action: "approve" | "reject",
  reason?: string
) {
  await connectToDatabase();
  
  // Check if user has moderation permissions
  if (current.role !== "ADMIN" && current.role !== "STAFF") {
    return { error: "Forbidden" as const };
  }
  
  const interaction = await Interaction.findById(interactionId);
  if (!interaction) return { error: "Interaction not found" as const };
  
  if (action === "approve") {
    interaction.isModerated = false;
    interaction.moderatedBy = undefined;
    interaction.moderatedAt = undefined;
    interaction.moderationReason = undefined;
  } else {
    interaction.isModerated = true;
    interaction.moderatedBy = current.id as any;
    interaction.moderatedAt = new Date();
    interaction.moderationReason = reason || "Content violation";
  }
  
  await interaction.save();
  
  return { interaction };
}

export async function deleteInteraction(
  current: JwtUser,
  interactionId: string
) {
  await connectToDatabase();
  
  const interaction = await Interaction.findById(interactionId);
  if (!interaction) return { error: "Interaction not found" as const };
  
  // Check permissions
  const canDelete = current.role === "ADMIN" || 
                   (current.role === "STAFF" && interaction.type !== "COMMENT") ||
                   (interaction.userId && String(interaction.userId) === current.id);
  
  if (!canDelete) return { error: "Forbidden" as const };
  
  await interaction.deleteOne();
  
  return { ok: true as const };
}

export async function getInteractionStats(eventId: string) {
  await connectToDatabase();
  
  const event = await Event.findById(eventId);
  if (!event) return { error: "Event not found" as const };
  
  const stats = await Interaction.aggregate([
    { $match: { eventId: event._id } },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        moderatedCount: {
          $sum: { $cond: ["$isModerated", 1, 0] }
        }
      }
    }
  ]);
  
  const totalInteractions = await Interaction.countDocuments({ eventId: event._id });
  const moderatedInteractions = await Interaction.countDocuments({ 
    eventId: event._id, 
    isModerated: true 
  });
  
  return {
    totalInteractions,
    moderatedInteractions,
    typeBreakdown: stats,
    moderationRate: totalInteractions > 0 ? (moderatedInteractions / totalInteractions) * 100 : 0
  };
}

export async function bulkModerateInteractions(
  current: JwtUser,
  interactionIds: string[],
  action: "approve" | "reject",
  reason?: string
) {
  await connectToDatabase();
  
  // Check permissions
  if (current.role !== "ADMIN" && current.role !== "STAFF") {
    return { error: "Forbidden" as const };
  }
  
  const results = [];
  
  for (const interactionId of interactionIds) {
    try {
      const result = await moderateInteraction(current, interactionId, action, reason);
      results.push({ interactionId, success: true, result });
    } catch (error) {
      results.push({ 
        interactionId, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  return { results };
} 