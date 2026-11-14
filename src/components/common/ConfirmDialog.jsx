import React from 'react';
import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';
import { AlertTriangle } from 'lucide-react';

/**
 * Reusable Confirmation Dialog
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={isDestructive ? 'danger' : 'primary'}
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3 py-2">
        <div className={`p-2 rounded-lg shrink-0 ${isDestructive ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{message}</p>
      </div>
    </Modal>
  );
}
