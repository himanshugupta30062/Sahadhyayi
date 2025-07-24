import { useEffect, useState } from 'react';
import SEO from '@/components/SEO';

interface LicenseItem {
  name: string;
  version: string;
  license: string;
}

const OpenSourceLicenses = () => {
  const [licenses, setLicenses] = useState<LicenseItem[]>([]);

  useEffect(() => {
    fetch('/licenses.json')
      .then(res => res.json())
      .then(setLicenses)
      .catch(() => setLicenses([]));
  }, []);

  return (
    <>
      <SEO title="Open Source Licenses - Sahadhyayi" description="Attribution for third-party packages used by Sahadhyayi." />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">Open Source Licenses</h1>
            <p className="text-gray-700 mb-6">This application uses the following open-source packages:</p>
            <ul className="space-y-2">
              {licenses.map(({ name, version, license }) => (
                <li key={name} className="text-gray-800">
                  <strong>{name}</strong> (v{version}) &ndash; {license}
                  {(license?.includes('MIT') || license?.includes('Apache')) && (
                    <>
                      {' '}–{' '}
                      <a
                        href={`https://unpkg.com/${name}@${version}/LICENSE`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        View License
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default OpenSourceLicenses;
