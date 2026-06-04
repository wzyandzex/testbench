import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@/assets/styles/global.css';
import '@/assets/styles/themes/light.css';
import '@/assets/styles/themes/dark.css';

// 初始化 dayjs 语言
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
dayjs.locale('zh-cn');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
