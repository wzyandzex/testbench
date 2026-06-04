import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ThemeProvider, I18nProvider } from './providers';
import { App as AntdApp } from 'antd';
import { ErrorBoundary } from './components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary fallbackLevel="app">
      <AntdApp>
        <I18nProvider>
          <ThemeProvider>
            <RouterProvider router={router} />
          </ThemeProvider>
        </I18nProvider>
      </AntdApp>
    </ErrorBoundary>
  );
}

export default App;
