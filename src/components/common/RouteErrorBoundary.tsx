import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';

export function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [key, setKey] = useState(location.key);

  useEffect(() => {
    setKey(location.key);
  }, [location.key]);

  return <ErrorBoundary key={key}>{children}</ErrorBoundary>;
}
