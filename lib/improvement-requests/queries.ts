import { prisma } from "@/lib/prisma";

export async function listImprovementRequestsForDeveloper() {
  return prisma.improvementRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      submittedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}
