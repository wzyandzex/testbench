/**
 * Scoped styles for the settings email-change modal.
 * The modal is rendered in a portal, so theme variables must live on the
 * Ant Design modal root class instead of a page-local container.
 */

export const getEmailChangeModalCSS = () => `
  .settings-email-change-modal-root {
    --email-modal-bg: #ffffff;
    --email-modal-text: rgba(0, 0, 0, 0.88);
    --email-modal-text-secondary: rgba(0, 0, 0, 0.62);
    --email-modal-text-tertiary: rgba(0, 0, 0, 0.45);
    --email-modal-border: rgba(0, 0, 0, 0.08);
    --email-modal-border-strong: rgba(0, 0, 0, 0.14);
    --email-modal-control-bg: #ffffff;
    --email-modal-control-disabled-bg: rgba(0, 0, 0, 0.035);
    --email-modal-alert-bg: rgba(22, 119, 255, 0.06);
    --email-modal-alert-border: rgba(22, 119, 255, 0.18);
    --email-modal-warning-bg: rgba(250, 173, 20, 0.1);
    --email-modal-warning-border: rgba(250, 173, 20, 0.28);
    --email-modal-success-bg: rgba(82, 196, 26, 0.1);
    --email-modal-success-border: rgba(82, 196, 26, 0.24);
    --email-modal-shadow: 0 18px 48px rgba(15, 23, 42, 0.16);
    --email-modal-primary-bg: #111111;
    --email-modal-primary-hover: #333333;
    --email-modal-primary-text: #ffffff;
  }

  html[data-theme='dark'] .settings-email-change-modal-root {
    --email-modal-bg: #1f1f1f;
    --email-modal-text: rgba(255, 255, 255, 0.9);
    --email-modal-text-secondary: rgba(255, 255, 255, 0.66);
    --email-modal-text-tertiary: rgba(255, 255, 255, 0.46);
    --email-modal-border: rgba(255, 255, 255, 0.1);
    --email-modal-border-strong: rgba(255, 255, 255, 0.18);
    --email-modal-control-bg: rgba(255, 255, 255, 0.04);
    --email-modal-control-disabled-bg: rgba(255, 255, 255, 0.07);
    --email-modal-alert-bg: rgba(22, 119, 255, 0.12);
    --email-modal-alert-border: rgba(22, 119, 255, 0.28);
    --email-modal-warning-bg: rgba(250, 173, 20, 0.14);
    --email-modal-warning-border: rgba(250, 173, 20, 0.34);
    --email-modal-success-bg: rgba(82, 196, 26, 0.14);
    --email-modal-success-border: rgba(82, 196, 26, 0.3);
    --email-modal-shadow: 0 18px 56px rgba(0, 0, 0, 0.46);
    --email-modal-primary-bg: #f5f5f5;
    --email-modal-primary-hover: #ffffff;
    --email-modal-primary-text: #111111;
  }

  .settings-email-change-modal-root .ant-modal {
    max-width: calc(100vw - 32px);
  }

  .settings-email-change-modal-root .ant-modal-content {
    background: var(--email-modal-bg) !important;
    border: 1px solid var(--email-modal-border) !important;
    border-radius: 12px !important;
    box-shadow: var(--email-modal-shadow) !important;
    color: var(--email-modal-text) !important;
    overflow: hidden;
  }

  .settings-email-change-modal-root .ant-modal-header {
    background: var(--email-modal-bg) !important;
    border-bottom: 1px solid var(--email-modal-border) !important;
    padding: 18px 24px !important;
    margin-bottom: 0 !important;
  }

  .settings-email-change-modal-root .ant-modal-title {
    color: var(--email-modal-text) !important;
    font-size: 17px !important;
    font-weight: 600 !important;
  }

  .settings-email-change-modal-root .ant-modal-close {
    color: var(--email-modal-text-tertiary) !important;
  }

  .settings-email-change-modal-root .ant-modal-close:hover {
    color: var(--email-modal-text) !important;
    background: var(--email-modal-control-disabled-bg) !important;
  }

  .settings-email-change-modal-root .ant-modal-body {
    background: var(--email-modal-bg) !important;
    color: var(--email-modal-text) !important;
    padding: 24px !important;
  }

  .settings-email-change-modal-root .ant-modal-footer {
    background: var(--email-modal-bg) !important;
    border-top: 1px solid var(--email-modal-border) !important;
    padding: 14px 24px !important;
    margin-top: 0 !important;
  }

  .settings-email-change-modal-root .email-change-modal-content {
    width: 100%;
  }

  .settings-email-change-modal-root .email-change-modal-steps {
    width: 100%;
  }

  .settings-email-change-modal-root .ant-steps-item-title {
    color: var(--email-modal-text) !important;
    font-weight: 500;
  }

  .settings-email-change-modal-root .ant-steps-item-wait .ant-steps-item-title,
  .settings-email-change-modal-root .ant-steps-item-process + .ant-steps-item-wait .ant-steps-item-title {
    color: var(--email-modal-text-tertiary) !important;
  }

  .settings-email-change-modal-root .ant-steps-item-description {
    color: var(--email-modal-text-secondary) !important;
  }

  .settings-email-change-modal-root .ant-steps-item-icon {
    background: var(--email-modal-control-bg) !important;
    border-color: var(--email-modal-border-strong) !important;
  }

  .settings-email-change-modal-root .ant-steps-item-icon .ant-steps-icon {
    color: var(--email-modal-text-secondary) !important;
  }

  .settings-email-change-modal-root .ant-steps-item-process .ant-steps-item-icon {
    background: #1677ff !important;
    border-color: #1677ff !important;
  }

  .settings-email-change-modal-root .ant-steps-item-process .ant-steps-item-icon .ant-steps-icon {
    color: #ffffff !important;
  }

  .settings-email-change-modal-root .ant-steps-item-finish .ant-steps-item-icon {
    background: rgba(22, 119, 255, 0.1) !important;
    border-color: rgba(22, 119, 255, 0.34) !important;
  }

  .settings-email-change-modal-root .ant-steps-item-tail::after {
    background: var(--email-modal-border) !important;
  }

  .settings-email-change-modal-root .email-change-modal-alert.ant-alert {
    border-radius: 8px !important;
    color: var(--email-modal-text) !important;
  }

  .settings-email-change-modal-root .email-change-modal-alert.ant-alert-info {
    background: var(--email-modal-alert-bg) !important;
    border-color: var(--email-modal-alert-border) !important;
  }

  .settings-email-change-modal-root .email-change-modal-alert.ant-alert-warning {
    background: var(--email-modal-warning-bg) !important;
    border-color: var(--email-modal-warning-border) !important;
  }

  .settings-email-change-modal-root .email-change-modal-alert.ant-alert-success {
    background: var(--email-modal-success-bg) !important;
    border-color: var(--email-modal-success-border) !important;
  }

  .settings-email-change-modal-root .ant-alert-message {
    color: var(--email-modal-text) !important;
    font-weight: 500;
  }

  .settings-email-change-modal-root .ant-alert-description {
    color: var(--email-modal-text-secondary) !important;
  }

  .settings-email-change-modal-root .email-change-modal-form .ant-form-item-label > label {
    color: var(--email-modal-text-secondary) !important;
    font-weight: 500 !important;
  }

  .settings-email-change-modal-root .ant-input,
  .settings-email-change-modal-root .ant-input-affix-wrapper,
  .settings-email-change-modal-root .ant-input-textarea textarea {
    background: var(--email-modal-control-bg) !important;
    border-color: var(--email-modal-border-strong) !important;
    color: var(--email-modal-text) !important;
  }

  .settings-email-change-modal-root .ant-input:hover,
  .settings-email-change-modal-root .ant-input-affix-wrapper:hover,
  .settings-email-change-modal-root .ant-input-textarea textarea:hover {
    border-color: var(--email-modal-text-tertiary) !important;
  }

  .settings-email-change-modal-root .ant-input:focus,
  .settings-email-change-modal-root .ant-input-focused,
  .settings-email-change-modal-root .ant-input-affix-wrapper-focused,
  .settings-email-change-modal-root .ant-input-textarea textarea:focus {
    border-color: #1677ff !important;
    box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.16) !important;
  }

  .settings-email-change-modal-root .ant-input::placeholder,
  .settings-email-change-modal-root .ant-input-affix-wrapper input::placeholder,
  .settings-email-change-modal-root .ant-input-textarea textarea::placeholder {
    color: var(--email-modal-text-tertiary) !important;
  }

  .settings-email-change-modal-root .ant-input[disabled],
  .settings-email-change-modal-root .ant-input-disabled,
  .settings-email-change-modal-root .ant-input-affix-wrapper-disabled {
    background: var(--email-modal-control-disabled-bg) !important;
    border-color: var(--email-modal-border) !important;
    color: var(--email-modal-text-secondary) !important;
    opacity: 1 !important;
  }

  .settings-email-change-modal-root .ant-input-prefix,
  .settings-email-change-modal-root .ant-input-suffix {
    color: var(--email-modal-text-tertiary) !important;
  }

  .settings-email-change-modal-root .ant-form-item-explain-error {
    color: #ff4d4f !important;
  }

  .settings-email-change-modal-root .email-change-modal-help {
    color: var(--email-modal-text-secondary) !important;
    line-height: 1.55;
  }

  .settings-email-change-modal-root .email-change-modal-help-icon {
    color: var(--email-modal-text-tertiary) !important;
    margin-top: 4px;
  }

  .settings-email-change-modal-root .email-change-modal-help .ant-typography {
    color: var(--email-modal-text-secondary) !important;
  }

  .settings-email-change-modal-root .ant-modal-footer .ant-btn {
    border-radius: 8px !important;
    font-weight: 500 !important;
  }

  .settings-email-change-modal-root .ant-modal-footer .ant-btn-default {
    background: var(--email-modal-control-bg) !important;
    border-color: var(--email-modal-border-strong) !important;
    color: var(--email-modal-text) !important;
  }

  .settings-email-change-modal-root .ant-modal-footer .ant-btn-default:hover:not(:disabled) {
    border-color: var(--email-modal-text-tertiary) !important;
    color: var(--email-modal-text) !important;
  }

  .settings-email-change-modal-root .ant-modal-footer .ant-btn-primary {
    background: var(--email-modal-primary-bg) !important;
    border-color: var(--email-modal-primary-bg) !important;
    color: var(--email-modal-primary-text) !important;
  }

  .settings-email-change-modal-root .ant-modal-footer .ant-btn-primary:hover:not(:disabled) {
    background: var(--email-modal-primary-hover) !important;
    border-color: var(--email-modal-primary-hover) !important;
    color: var(--email-modal-primary-text) !important;
  }

  @media (max-width: 575px) {
    .settings-email-change-modal-root .ant-modal {
      max-width: calc(100vw - 24px);
    }

    .settings-email-change-modal-root .ant-modal-header,
    .settings-email-change-modal-root .ant-modal-body,
    .settings-email-change-modal-root .ant-modal-footer {
      padding-left: 18px !important;
      padding-right: 18px !important;
    }

    .settings-email-change-modal-root .ant-modal-footer {
      display: flex;
      flex-direction: column-reverse;
      gap: 8px;
    }

    .settings-email-change-modal-root .ant-modal-footer .ant-btn {
      width: 100%;
      margin-inline-start: 0 !important;
    }
  }
`;
