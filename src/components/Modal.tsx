import React from "react";
import { Icon } from "@iconify/react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-dark-900 border border-dark-800 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-dark-800">
          <h3 className="text-white font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-dark-500 hover:text-white transition-colors"
          >
            <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
