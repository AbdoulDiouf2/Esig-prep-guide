declare module '@vercel/analytics/react' {
  import { FC } from 'react';
  
  interface AnalyticsEvent {
    type: string;
    payload: Record<string, unknown>;
  }
  
  interface AnalyticsProps {
    mode?: 'production' | 'development';
    debug?: boolean;
    beforeSend?: (event: AnalyticsEvent) => AnalyticsEvent | null;
  }

  export const Analytics: FC<AnalyticsProps>;
  
  export function track(eventName: string, data?: Record<string, unknown>): void;
  export function pageview(data?: Record<string, unknown>): void;
  export function setUser(userId: string, traits?: Record<string, unknown>): void;
  export function resetUser(): void;
  export function setConsent(consent: boolean): void;
}
