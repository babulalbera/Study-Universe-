"use client";
import Modal from "./Modal";
import Button from "./Button";

type Props = { open: boolean; title: string; text: string; onConfirm: () => void; onCancel: () => void };

export default function ConfirmDialog({ open, title, text, onConfirm, onCancel }: Props) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="su-muted">{text}</p>
      <div className="su-row">
        <Button variant="ghost" onClick={onCancel}>Nahi</Button>
        <Button onClick={onConfirm}>Haan, pakka</Button>
      </div>
    </Modal>
  );
}
