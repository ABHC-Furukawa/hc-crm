import type { Prisma } from "@prisma/client";

/** 横断連絡一覧用 include */
export const communicationListInclude = {
  user: { select: { id: true, name: true } },
  candidate: {
    select: {
      id: true,
      lastName: true,
      firstName: true,
      assignments: {
        where: { unassignedAt: null },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  },
  call: { include: { answeredBy: { select: { name: true } } } },
  lineMessage: true,
  emailMessage: true,
} satisfies Prisma.CommunicationInclude;

export type CommunicationListItem = Prisma.CommunicationGetPayload<{
  include: typeof communicationListInclude;
}>;
