"use client";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
export function NotificationSelect({ label, value, items, onChange, disabled }: {
    label: string;
    value: string;
    items: {
        value: string;
        label: string;
    }[];
    onChange: (v: string) => void;
    disabled?: boolean;
}) { return <Select value={value} onValueChange={v => { if (v !== null)
    onChange(String(v)); }} disabled={disabled}><SelectTrigger aria-label={label} className="pc-not-select"><SelectValue>{items.find(i => i.value === value)?.label || label}</SelectValue></SelectTrigger><SelectContent>{items.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent></Select>; }
