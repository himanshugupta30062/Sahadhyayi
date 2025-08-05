// Secure logging utility for production environments

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  category?: string;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

class SecureLogger {
  private logLevel: LogLevel;
  private maxLogEntries: number;
  private logBuffer: LogEntry[];
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.logLevel = this.isProduction ? LogLevel.WARN : LogLevel.DEBUG;
    this.maxLogEntries = 100;
    this.logBuffer = [];
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    category?: string,
    metadata?: Record<string, any>
  ): LogEntry {
    return {
      level,
      message: this.sanitizeMessage(message),
      timestamp: Date.now(),
      category,
      metadata: this.sanitizeMetadata(metadata),
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId()
    };
  }

  private sanitizeMessage(message: string): string {
    if (typeof message !== 'string') {
      message = String(message);
    }
    
    // Remove potentially sensitive information
    return message
      .replace(/password[=:]\s*[^\s&]*/gi, 'password=***')
      .replace(/token[=:]\s*[^\s&]*/gi, 'token=***')
      .replace(/api[_-]?key[=:]\s*[^\s&]*/gi, 'apiKey=***')
      .replace(/secret[=:]\s*[^\s&]*/gi, 'secret=***')
      .substring(0, 500); // Limit message length
  }

  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata) return undefined;

    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      // Skip sensitive keys
      if (this.isSensitiveKey(key)) {
        sanitized[key] = '***';
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeMetadata(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'auth', 'credential',
      'ssn', 'email', 'phone', 'address', 'api_key', 'apiKey'
    ];
    
    return sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive)
    );
  }

  private getCurrentUserId(): string | undefined {
    try {
      // Safely get user ID from auth context or storage
      if (typeof window !== 'undefined') {
        const authData = sessionStorage.getItem('supabase.auth.token');
        if (authData) {
          const parsed = JSON.parse(authData);
          return parsed.user?.id;
        }
      }
    } catch {
      // Ignore errors
    }
    return undefined;
  }

  private getSessionId(): string | undefined {
    try {
      if (typeof window !== 'undefined') {
        return sessionStorage.getItem('sahadhyayi_session_id') || undefined;
      }
    } catch {
      // Ignore errors
    }
    return undefined;
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    
    // Keep buffer size limited
    if (this.logBuffer.length > this.maxLogEntries) {
      this.logBuffer = this.logBuffer.slice(-this.maxLogEntries);
    }
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const prefix = `[${new Date(entry.timestamp).toISOString()}]`;
    const category = entry.category ? `[${entry.category}]` : '';
    const logMessage = `${prefix}${category} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(logMessage, entry.metadata);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, entry.metadata);
        break;
      case LogLevel.INFO:
        console.info(logMessage, entry.metadata);
        break;
      case LogLevel.DEBUG:
        console.debug(logMessage, entry.metadata);
        break;
    }
  }

  // Public logging methods
  error(message: string, category?: string, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, category, metadata);
    this.addToBuffer(entry);
    this.logToConsole(entry);
    
    // In production, could send errors to monitoring service
    if (this.isProduction) {
      this.sendToMonitoringService(entry);
    }
  }

  warn(message: string, category?: string, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, category, metadata);
    this.addToBuffer(entry);
    this.logToConsole(entry);
  }

  info(message: string, category?: string, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, category, metadata);
    this.addToBuffer(entry);
    this.logToConsole(entry);
  }

  debug(message: string, category?: string, metadata?: Record<string, any>): void {
    if (!this.isProduction) {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, category, metadata);
      this.addToBuffer(entry);
      this.logToConsole(entry);
    }
  }

  // Security-specific logging
  security(message: string, metadata?: Record<string, any>): void {
    this.error(message, 'SECURITY', metadata);
  }

  // Get recent logs (for debugging)
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  // Clear log buffer
  clearLogs(): void {
    this.logBuffer = [];
  }

  // Send to monitoring service (placeholder)
  private sendToMonitoringService(entry: LogEntry): void {
    // In a real application, this would send logs to a service like:
    // - Sentry
    // - LogRocket
    // - DataDog
    // - Custom logging endpoint
    
    // Example:
    // fetch('/api/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(entry)
    // }).catch(() => {
    //   // Silently fail - don't break app if logging fails
    // });
  }
}

// Export singleton instance
export const logger = new SecureLogger();

// Convenience exports
export const logError = logger.error.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logDebug = logger.debug.bind(logger);
export const logSecurity = logger.security.bind(logger);
