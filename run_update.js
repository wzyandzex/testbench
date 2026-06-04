
const fs = require('fs');
const path = 'src/assets/styles/global.css';
let content = fs.readFileSync(path, 'utf8');
const scrollbarCss = \
/* ========== 滚动条与暗黑模式修复 ========== */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(144, 147, 153, 0.3);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(144, 147, 153, 0.5);
}

html[data-theme='dark'] .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}
html[data-theme='dark'] .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

html[data-theme='dark'] .ant-card-head,
html[data-theme='dark'] .ant-table-thead > tr > th,
html[data-theme='dark'] .ant-modal-header,
html[data-theme='dark'] .ant-modal-footer,
html[data-theme='dark'] .ant-drawer-header {
  background: transparent !important;
  border-color: #303030 !important;
  color: #e0e0e0 !important;
}
html[data-theme='dark'] .ant-table-tbody > tr > td {
  border-color: #303030 !important;
}
html[data-theme='dark'] .ant-table-tbody > tr:hover > td {
  background: #262626 !important;
}
html[data-theme='dark'] .ant-card-head-title,
html[data-theme='dark'] .ant-modal-title,
html[data-theme='dark'] .ant-drawer-title,
html[data-theme='dark'] .ant-descriptions-item-content {
  color: #e0e0e0 !important;
}
html[data-theme='dark'] .ant-descriptions-item-label {
  color: #a0a0a0 !important;
}

html[data-theme='dark'] .ant-btn-default:hover,
html[data-theme='dark'] .ant-btn-text:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
  border-color: transparent !important;
}

html[data-theme='dark'] .ant-input:hover,
html[data-theme='dark'] .ant-input-password:hover,
html[data-theme='dark'] .ant-input-textarea textarea:hover,
html[data-theme='dark'] .ant-select:hover .ant-select-selector {
  border-color: #666 !important;
}

html[data-theme='dark'] .ant-input:focus,
html[data-theme='dark'] .ant-input-password:focus,
html[data-theme='dark'] .ant-input-textarea textarea:focus,
html[data-theme='dark'] .ant-select-focused .ant-select-selector {
  border-color: #888 !important;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.08) !important;
}
\;

if (!content.includes('.custom-scrollbar')) {
  fs.writeFileSync(path, content + '\n' + scrollbarCss);
  console.log('Appended dark mode fixes to global.css');
} else {
  console.log('Already exists');
}
\

