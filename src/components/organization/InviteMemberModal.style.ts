export const getInviteMemberModalCSS = () => `
  .organization-invite-modal-root,
  .organization-invite-select-dropdown {
    --org-invite-bg: #ffffff;
    --org-invite-text: rgba(0, 0, 0, 0.88);
    --org-invite-text-secondary: rgba(0, 0, 0, 0.62);
    --org-invite-text-tertiary: rgba(0, 0, 0, 0.45);
    --org-invite-border: rgba(0, 0, 0, 0.08);
    --org-invite-border-strong: rgba(0, 0, 0, 0.14);
    --org-invite-control-bg: #ffffff;
    --org-invite-control-disabled-bg: rgba(0, 0, 0, 0.035);
    --org-invite-shadow: 0 18px 48px rgba(15, 23, 42, 0.16);
    --org-invite-primary-bg: #111111;
    --org-invite-primary-hover: #333333;
    --org-invite-primary-text: #ffffff;
    --org-invite-focus: #1677ff;
  }

  html[data-theme='dark'] .organization-invite-modal-root,
  html[data-theme='dark'] .organization-invite-select-dropdown {
    --org-invite-bg: #1f1f1f;
    --org-invite-text: rgba(255, 255, 255, 0.9);
    --org-invite-text-secondary: rgba(255, 255, 255, 0.66);
    --org-invite-text-tertiary: rgba(255, 255, 255, 0.46);
    --org-invite-border: rgba(255, 255, 255, 0.1);
    --org-invite-border-strong: rgba(255, 255, 255, 0.18);
    --org-invite-control-bg: rgba(255, 255, 255, 0.04);
    --org-invite-control-disabled-bg: rgba(255, 255, 255, 0.07);
    --org-invite-shadow: 0 18px 56px rgba(0, 0, 0, 0.46);
    --org-invite-primary-bg: #f5f5f5;
    --org-invite-primary-hover: #ffffff;
    --org-invite-primary-text: #111111;
    --org-invite-focus: #1677ff;
  }

  .organization-invite-modal-root .ant-modal {
    max-width: calc(100vw - 32px);
  }

  .organization-invite-modal-root .ant-modal-content {
    background: var(--org-invite-bg) !important;
    border: 1px solid var(--org-invite-border) !important;
    border-radius: 12px !important;
    box-shadow: var(--org-invite-shadow) !important;
    color: var(--org-invite-text) !important;
    overflow: hidden;
  }

  .organization-invite-modal-root .ant-modal-header {
    background: var(--org-invite-bg) !important;
    border-bottom: 1px solid var(--org-invite-border) !important;
    padding: 18px 24px !important;
    margin-bottom: 0 !important;
  }

  .organization-invite-modal-root .ant-modal-title {
    color: var(--org-invite-text) !important;
    font-size: 17px !important;
    font-weight: 600 !important;
  }

  .organization-invite-modal-root .ant-modal-close {
    color: var(--org-invite-text-tertiary) !important;
  }

  .organization-invite-modal-root .ant-modal-close:hover {
    color: var(--org-invite-text) !important;
    background: var(--org-invite-control-disabled-bg) !important;
  }

  .organization-invite-modal-root .ant-modal-body {
    background: var(--org-invite-bg) !important;
    color: var(--org-invite-text) !important;
    padding: 24px !important;
  }

  .organization-invite-modal-root .ant-modal-footer {
    background: var(--org-invite-bg) !important;
    border-top: 1px solid var(--org-invite-border) !important;
    padding: 14px 24px !important;
    margin-top: 0 !important;
  }

  .organization-invite-modal-root .organization-invite-modal-form .ant-form-item-label > label {
    color: var(--org-invite-text-secondary) !important;
    font-weight: 500 !important;
  }

  .organization-invite-modal-root .ant-input,
  .organization-invite-modal-root .ant-input-affix-wrapper,
  .organization-invite-modal-root .ant-input-textarea textarea,
  .organization-invite-modal-root .ant-select-selector {
    background: var(--org-invite-control-bg) !important;
    border-color: var(--org-invite-border-strong) !important;
    color: var(--org-invite-text) !important;
  }

  .organization-invite-modal-root .ant-select-selection-item,
  .organization-invite-modal-root .ant-select-selection-placeholder,
  .organization-invite-modal-root .ant-select-arrow {
    color: var(--org-invite-text) !important;
  }

  .organization-invite-modal-root .ant-select-selection-placeholder {
    color: var(--org-invite-text-tertiary) !important;
  }

  .organization-invite-modal-root .ant-input:hover,
  .organization-invite-modal-root .ant-input-affix-wrapper:hover,
  .organization-invite-modal-root .ant-input-textarea textarea:hover,
  .organization-invite-modal-root .ant-select:hover .ant-select-selector {
    border-color: var(--org-invite-text-tertiary) !important;
  }

  .organization-invite-modal-root .ant-input:focus,
  .organization-invite-modal-root .ant-input-focused,
  .organization-invite-modal-root .ant-input-affix-wrapper-focused,
  .organization-invite-modal-root .ant-input-textarea textarea:focus,
  .organization-invite-modal-root .ant-select-focused .ant-select-selector {
    border-color: var(--org-invite-focus) !important;
    box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.16) !important;
  }

  .organization-invite-modal-root .ant-input::placeholder,
  .organization-invite-modal-root .ant-input-affix-wrapper input::placeholder,
  .organization-invite-modal-root .ant-input-textarea textarea::placeholder {
    color: var(--org-invite-text-tertiary) !important;
  }

  .organization-invite-modal-root .ant-input-textarea-show-count::after,
  .organization-invite-modal-root .ant-input-data-count {
    color: var(--org-invite-text-tertiary) !important;
  }

  .organization-invite-modal-root .ant-form-item-explain-error {
    color: #ff4d4f !important;
  }

  .organization-invite-modal-root .ant-modal-footer .ant-btn {
    border-radius: 8px !important;
    font-weight: 500 !important;
  }

  .organization-invite-modal-root .ant-modal-footer .ant-btn-default {
    background: var(--org-invite-control-bg) !important;
    border-color: var(--org-invite-border-strong) !important;
    color: var(--org-invite-text) !important;
  }

  .organization-invite-modal-root .ant-modal-footer .ant-btn-default:hover:not(:disabled) {
    border-color: var(--org-invite-text-tertiary) !important;
    color: var(--org-invite-text) !important;
  }

  .organization-invite-modal-root .ant-modal-footer .ant-btn-primary {
    background: var(--org-invite-primary-bg) !important;
    border-color: var(--org-invite-primary-bg) !important;
    color: var(--org-invite-primary-text) !important;
    box-shadow: none !important;
  }

  .organization-invite-modal-root .ant-modal-footer .ant-btn-primary:hover:not(:disabled) {
    background: var(--org-invite-primary-hover) !important;
    border-color: var(--org-invite-primary-hover) !important;
    color: var(--org-invite-primary-text) !important;
    transform: none !important;
  }

  .organization-invite-modal-root .ant-select-dropdown,
  .organization-invite-select-dropdown {
    background: var(--org-invite-bg) !important;
    border: 1px solid var(--org-invite-border) !important;
    box-shadow: var(--org-invite-shadow) !important;
  }

  .organization-invite-modal-root .ant-select-item,
  .organization-invite-select-dropdown .ant-select-item {
    color: var(--org-invite-text) !important;
  }

  .organization-invite-modal-root .ant-select-item-option-active,
  .organization-invite-select-dropdown .ant-select-item-option-active {
    background: var(--org-invite-control-disabled-bg) !important;
  }

  .organization-invite-modal-root .ant-select-item-option-selected,
  .organization-invite-select-dropdown .ant-select-item-option-selected {
    background: rgba(22, 119, 255, 0.14) !important;
  }

  @media (max-width: 575px) {
    .organization-invite-modal-root .ant-modal {
      max-width: calc(100vw - 24px);
    }

    .organization-invite-modal-root .ant-modal-header,
    .organization-invite-modal-root .ant-modal-body,
    .organization-invite-modal-root .ant-modal-footer {
      padding-left: 18px !important;
      padding-right: 18px !important;
    }

    .organization-invite-modal-root .ant-modal-footer {
      display: flex;
      flex-direction: column-reverse;
      gap: 8px;
    }

    .organization-invite-modal-root .ant-modal-footer .ant-btn {
      width: 100%;
      margin-inline-start: 0 !important;
    }
  }
`;
