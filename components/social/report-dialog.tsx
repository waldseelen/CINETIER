"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Flag, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ReportDialogProps {
    targetType: "comment" | "review" | "tier_list" | "profile";
    targetId: string;
    trigger?: React.ReactNode;
}

const REPORT_REASONS = [
    { value: "spam", label: "Spam" },
    { value: "harassment", label: "Taciz veya zorbalık" },
    { value: "hate_speech", label: "Nefret söylemi" },
    { value: "inappropriate", label: "Uygunsuz içerik" },
    { value: "misinformation", label: "Yanlış bilgi" },
    { value: "other", label: "Diğer" },
];

export function ReportDialog({ targetType, targetId, trigger }: ReportDialogProps) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!reason) {
            toast.error("Lütfen bir sebep seçin");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetType,
                    targetId,
                    reason: `${reason}${details ? `: ${details}` : ""}`,
                }),
            });

            if (!res.ok) throw new Error("Report failed");

            toast.success("Rapor gönderildi. İncelememiz için teşekkürler.");
            setOpen(false);
            setReason("");
            setDetails("");
        } catch (error) {
            toast.error("Rapor gönderilemedi");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                        <Flag className="h-4 w-4" />
                        Raporla
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>İçeriği Raporla</DialogTitle>
                    <DialogDescription>
                        Bu içeriği neden raporluyorsunuz? Raporunuz gizli tutulacaktır.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium">Sebep</label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sebep seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                {REPORT_REASONS.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Detaylar (opsiyonel)
                        </label>
                        <Textarea
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder="Ek bilgi vermek isterseniz..."
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        İptal
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting || !reason}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Raporla
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
