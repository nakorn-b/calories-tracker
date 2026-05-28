import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "info";
}

export function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info",
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-sm bg-surface-container rounded-[2.5rem] p-8 border border-outline shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="text-center">
          {type === "danger" && (
            <div className="w-16 h-16 bg-error/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-error/20">
              <span className="material-symbols-outlined text-3xl text-error">delete_forever</span>
            </div>
          )}
          
          <h3 className="font-headline text-2xl font-black text-on-surface tracking-tighter mb-2">
            {title}
          </h3>
          <p className="text-on-surface-variant text-sm font-medium leading-relaxed mb-8">
            {message}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              className={`w-full py-4 rounded-2xl font-headline font-bold text-sm tracking-widest uppercase transition-all active:scale-95 ${
                type === "danger" 
                ? "bg-error text-white shadow-lg shadow-error/20 hover:brightness-110" 
                : "bg-primary text-on-primary shadow-lg shadow-primary/20 hover:brightness-110"
              }`}
            >
              {confirmText}
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl font-headline font-bold text-sm tracking-widest uppercase text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
