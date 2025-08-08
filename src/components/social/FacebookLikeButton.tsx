import React, { useEffect, useState } from 'react';

interface FacebookLikeButtonProps {
  width?: number;
  height?: number;
}

export const FacebookLikeButton: React.FC<FacebookLikeButtonProps> = ({ width, height }) => {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [sdkFailed, setSdkFailed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!document.getElementById('fb-root')) {
      const fbRoot = document.createElement('div');
      fbRoot.id = 'fb-root';
      document.body.appendChild(fbRoot);
    }

    if ((window as any).FB) {
      setSdkLoaded(true);
      return;
    }

    (window as any).fbAsyncInit = function () {
      (window as any).FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID',
        xfbml: true,
        version: 'v17.0',
      });
      setSdkLoaded(true);
    };

    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.onerror = () => setSdkFailed(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (sdkLoaded && (window as any).FB) {
      (window as any).FB.XFBML.parse();
    }
  }, [sdkLoaded]);

  if (sdkFailed) {
    return (
      <a
        href="https://www.facebook.com/profile.php?id=61578920175928"
        target="_blank"
        rel="noopener noreferrer"
      >
        Visit us on Facebook
      </a>
    );
  }

  return (
    <div
      className="fb-page"
      data-href="https://www.facebook.com/profile.php?id=61578920175928"
      data-width={width}
      data-height={height}
      data-tabs=""
      data-small-header="false"
      data-adapt-container-width="true"
      data-hide-cover="false"
      data-show-facepile="true"
    >
      <blockquote
        cite="https://www.facebook.com/profile.php?id=61578920175928"
        className="fb-xfbml-parse-ignore"
      >
        <a href="https://www.facebook.com/profile.php?id=61578920175928">Sahadhyayi</a>
      </blockquote>
    </div>
  );
};

