"use client";

import type { AssignableUser } from "@/lib/users/queries";
import { CreateUserForm } from "@/components/users/create-user-form";
import { InviteUserForm } from "@/components/users/invite-user-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type MemberOnboardingSectionProps = {
  managers: AssignableUser[];
  canAssignDevelop: boolean;
  showDirectCreate: boolean;
};

export function MemberOnboardingSection({
  managers,
  canAssignDevelop,
  showDirectCreate,
}: MemberOnboardingSectionProps) {
  if (!showDirectCreate) {
    return (
      <InviteUserForm
        managers={managers}
        canAssignDevelop={canAssignDevelop}
      />
    );
  }

  return (
    <Tabs defaultValue="invite">
      <TabsList>
        <TabsTrigger value="invite">招待メール</TabsTrigger>
        <TabsTrigger value="create">直接作成（DEVELOP）</TabsTrigger>
      </TabsList>
      <TabsContent value="invite">
        <InviteUserForm
          managers={managers}
          canAssignDevelop={canAssignDevelop}
        />
      </TabsContent>
      <TabsContent value="create">
        <CreateUserForm
          managers={managers}
          canAssignDevelop={canAssignDevelop}
        />
      </TabsContent>
    </Tabs>
  );
}
