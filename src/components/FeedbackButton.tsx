import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { FeedbackModal } from "./FeedbackModal";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <MessageSquare className="h-4 w-4" />
        {t("feedback.button")}
      </Button>
      <FeedbackModal open={open} onOpenChange={setOpen} />
    </>
  );
}
