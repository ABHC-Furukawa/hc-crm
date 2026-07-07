import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function JobCsvDownloadButton() {
  return (
    <Button asChild variant="outline" className="w-full sm:w-auto">
      <a href="/api/jobs/export" download>
        <Download className="mr-2 h-4 w-4" />
        CSVダウンロード
      </a>
    </Button>
  );
}
