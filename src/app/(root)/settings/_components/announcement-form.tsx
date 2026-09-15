"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { broadcastAnnouncement } from "@/actions/notification-actions";

export function AnnouncementForm() {
  const t = useTranslations("settings");
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [link, setLink] = useState("");

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      toast.error(t("announcement.validation"));
      return;
    }

    startTransition(async () => {
      const result = await broadcastAnnouncement({
        title,
        message,
        imageUrl: imageUrl || undefined,
        link: link || undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(t("announcement.success"));
      setTitle("");
      setMessage("");
      setImageUrl("");
      setLink("");
    });
  };

  return (
    <Card className="p-5 space-y-3">
      <div>
        <h2 className="font-semibold flex items-center gap-2">
          <Megaphone className="w-4 h-4" />
          {t("announcement.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t("announcement.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t("announcement.titleLabel")}</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>{t("announcement.linkLabel")}</Label>
          <Input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/pos"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>{t("announcement.messageLabel")}</Label>
        <Input value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label>{t("announcement.imageLabel")}</Label>
        <Input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSend} disabled={pending}>
          {pending ? t("announcement.sending") : t("announcement.send")}
        </Button>
      </div>
    </Card>
  );
}
