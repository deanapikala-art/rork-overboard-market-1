import { z } from "zod";
import { publicProcedure } from "../../../create-context";

export const submitFeedbackProcedure = publicProcedure
  .input(
    z.object({
      page: z.string(),
      issue: z.string(),
      userType: z.enum(["customer", "vendor", "admin", "guest"]).optional(),
      email: z.string().email().optional(),
      timestamp: z.string(),
      deviceInfo: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("📝 Feedback received:", {
      page: input.page,
      issue: input.issue,
      userType: input.userType,
      email: input.email,
      timestamp: input.timestamp,
      deviceInfo: input.deviceInfo,
    });

    return {
      success: true,
      message: "Thank you for your feedback! We'll review it shortly.",
    };
  });
