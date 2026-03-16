import React, { useState } from 'react';

const ConfirmModal = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  promptMode = false,
  promptPlaceholder = "",
  promptDefault = "",
}) => {
  const [inputValue, setInputValue] = useState(promptDefault);

  return (
    <div style={{
      width: '400px',
      padding: '24px',
      background: 'rgba(30, 30, 30, 0.85)',
      backdropFilter: 'blur(16px) saturate(180%)',
      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.125)',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    }}>
      <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '15px', fontWeight: '600' }}>{title}</h3>
      <p style={{ color: '#aaa', margin: '0 0 18px 0', lineHeight: 1.5, fontSize: '13px' }}>{message}</p>

      {promptMode && (
        <input
          autoFocus
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && inputValue.trim()) onConfirm(inputValue.trim()); }}
          placeholder={promptPlaceholder}
          maxLength={80}
          style={{
            width: '100%',
            padding: '8px 12px',
            marginBottom: '18px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            background: 'rgba(255, 255, 255, 0.06)',
            color: '#fff',
            fontSize: '13px',
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        {cancelText && (
          <button
            onClick={onCancel}
            style={{
              padding: '7px 16px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#ccc',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
          >
            {cancelText}
          </button>
        )}
        <button
          onClick={() => promptMode ? onConfirm(inputValue.trim()) : onConfirm()}
          style={{
            padding: '7px 16px',
            borderRadius: '6px',
            border: 'none',
            background: isDestructive ? '#cc3326' : 'var(--accent, #0d99ff)',
            color: '#fff',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
};

export default ConfirmModal;
