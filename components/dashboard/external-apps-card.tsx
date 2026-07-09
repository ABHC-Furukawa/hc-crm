import { ExternalLink } from "lucide-react";
import { EXTERNAL_APPS } from "@/lib/constants/external-apps";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ExternalAppsCard() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>アプリケーション</CardTitle>
        <CardDescription>業務で使う外部ツール</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {EXTERNAL_APPS.map((app) => (
            <li key={app.id}>
              <a
                href={app.href}
                target="_blank"
                rel="noopener noreferrer"
                className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-3 transition-colors hover:bg-muted/60"
              >
                <div className="min-w-0">
                  <p className="font-medium text-primary">{app.name}</p>
                  <p className="text-xs text-muted-foreground">{app.description}</p>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
