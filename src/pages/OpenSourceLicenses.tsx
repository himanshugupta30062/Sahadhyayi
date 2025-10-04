import { useEffect, useState } from 'react';
import { ExternalLink, Package, Heart, Code, Shield, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SEO from '@/components/SEO';

interface LicenseItem {
  name: string;
  version: string;
  license: string;
  url?: string;
  description?: string;
}

const OpenSourceLicenses = () => {
  const [licenses, setLicenses] = useState<LicenseItem[]>([]);
  const [filteredLicenses, setFilteredLicenses] = useState<LicenseItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLicense, setSelectedLicense] = useState<string>('all');

  useEffect(() => {
    fetch('/licenses.json')
      .then(res => res.json())
      .then(data => {
        setLicenses(data);
        setFilteredLicenses(data);
      })
      .catch(() => setLicenses([]));
  }, []);

  useEffect(() => {
    let filtered = licenses;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(license =>
        (license.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by license type
    if (selectedLicense !== 'all') {
      filtered = filtered.filter(license => license.license === selectedLicense);
    }

    setFilteredLicenses(filtered);
  }, [searchTerm, selectedLicense, licenses]);

  const getLicenseColor = (license: string) => {
    switch (license) {
      case 'MIT':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Apache-2.0':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'BSD-2-Clause':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ISC':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case '(MPL-2.0 OR Apache-2.0)':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const uniqueLicenses = [...new Set(licenses.map(l => l.license))];
  const licenseStats = uniqueLicenses.map(license => ({
    license,
    count: licenses.filter(l => l.license === license).length
  }));

  return (
    <>
      <SEO 
        title="Open Source Licenses - Digital Library" 
        description="Attribution and licenses for third-party packages used in our digital library platform." 
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Code className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Open Source Licenses</h1>
            </div>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We believe in the power of open source. This page acknowledges the incredible work of 
              developers who make their code freely available. Our platform is built on top of these 
              amazing contributions.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6 text-center">
                <Package className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-800">{licenses.length}</div>
                <div className="text-green-600">Total Packages</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6 text-center">
                <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-800">{uniqueLicenses.length}</div>
                <div className="text-blue-600">License Types</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6 text-center">
                <Heart className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-800">100%</div>
                <div className="text-purple-600">Open Source</div>
              </CardContent>
            </Card>
          </div>

          {/* License Type Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                License Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {licenseStats.map(({ license, count }) => (
                  <Badge 
                    key={license} 
                    variant="outline" 
                    className={`${getLicenseColor(license)} cursor-pointer hover:opacity-80 transition-opacity`}
                    onClick={() => setSelectedLicense(selectedLicense === license ? 'all' : license)}
                  >
                    {license} ({count})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Search and Filter */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search packages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant={selectedLicense === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedLicense('all')}
                >
                  All Licenses
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Package List */}
          <div className="space-y-4">
            {filteredLicenses.map((pkg) => (
              <Card key={pkg.name} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          v{pkg.version}
                        </Badge>
                        <Badge className={getLicenseColor(pkg.license)}>
                          {pkg.license}
                        </Badge>
                      </div>
                      {pkg.description && (
                        <p className="text-gray-600 text-sm mb-2">{pkg.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {pkg.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(pkg.url, '_blank')}
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Package
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredLicenses.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No packages found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="mt-12 text-center">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-8">
                <Heart className="w-8 h-8 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Thank You, Open Source Community!</h3>
                <p className="text-gray-600">
                  None of this would be possible without the dedication and generosity of open source developers. 
                  We're grateful to be part of this amazing ecosystem.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default OpenSourceLicenses;
