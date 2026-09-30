import React from 'react';
import { AlertTriangle, Trash2, Power, X } from 'lucide-react';
import { Modal } from '../common/Modal/Modal';
import { Button } from '../common/Button/Button';
import './DeleteConfirmModal.css';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  isSoftDelete?: boolean;
  actionText?: string;
  variant?: 'danger' | 'warning';
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  isSoftDelete = true,
  actionText = 'Confirm',
  variant = 'danger',
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      footer={
        <div className="confirm-modal-footer">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            leftIcon={isSoftDelete ? <Power size={14} /> : <Trash2 size={14} />}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {actionText}
          </Button>
        </div>
      }
    >
      <div className="confirm-modal-body">
        <div className={`confirm-icon-box ${variant === 'danger' ? 'danger' : 'warning'}`}>
          <AlertTriangle size={24} />
        </div>
        <div className="confirm-text-area">
          <p className="confirm-primary-text">{message}</p>
          {itemName && (
            <div className="confirm-item-preview">
              <span className="confirm-item-label">Target:</span>
              <span className="confirm-item-name">{itemName}</span>
            </div>
          )}
          {isSoftDelete ? (
            <p className="confirm-notice-text">
              Note: This performs a safe soft-deactivation. The item will not be presented to students,
              but remains stored in your history and can be reactivated anytime.
            </p>
          ) : (
            <p className="confirm-notice-text danger-notice">
              Warning: This action will permanently remove this record from the database.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
