import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  description?: string;
  showRetry?: boolean;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  showRetry = true,
}) => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {showRetry && resetError && (
          <Button onClick={resetError} className="w-full" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
        
        {import.meta.env.DEV && error && (
          <details className="mt-4">
            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
              Error Details (Development Only)
            </summary>
            <div className="mt-2 p-3 bg-muted rounded-md text-xs font-mono">
              <div className="font-semibold text-destructive mb-2">
                {error.message}
              </div>
              {error.stack && (
                <pre className="whitespace-pre-wrap text-muted-foreground max-h-32 overflow-auto">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
};