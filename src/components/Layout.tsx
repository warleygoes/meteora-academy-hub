import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';

export const Layout: React.FC = () => {
  useEffect(() => {
    const BASE_URL = "https://chat.ispautomatico.com";
    const script = document.createElement("script");
    script.src = BASE_URL + "/packs/js/sdk.js";
    script.async = true;
    script.onload = () => {
      (window as any).chatwootSDK?.run({
        websiteToken: 'ryJexkNshj44z34LfYWx8BeJ',
        baseUrl: BASE_URL,
      });
    };
    document.body.appendChild(script);

    return () => {
      script.remove();
      // Remove chatwoot widget on unmount
      const widget = document.querySelector('.woot-widget-holder');
      widget?.remove();
      const bubble = document.querySelector('.woot--bubble-holder');
      bubble?.remove();
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};
