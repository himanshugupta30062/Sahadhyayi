import React, { useState } from 'react';
import { useAuth } from '@/contexts/authHelpers';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { MessageCircle, MapPin, UsersIcon, Users, Sparkles, BookOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SignInLink from '@/components/SignInLink';
import SEO from '@/components/SEO';
import { EnhancedSocialFeed } from '@/components/social/EnhancedSocialFeed';
import { EnhancedReadingMap } from '@/components/social/EnhancedReadingMap';
import { FriendsLocationMap } from '@/components/social/FriendsLocationMap';
import { ReadingGroups } from '@/components/social/ReadingGroups';
import { EnhancedFriendsManager } from '@/components/social/EnhancedFriendsManager';

const SocialMedia = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('feed');

  if (!user) {
    return (
      <>
        <SEO
          title="Social Reading Community | Sahadhyayi"
          description="Join Sahadhyayi's social reading community. Connect with fellow readers and share your reading journey."
          canonical="https://sahadhyayi.com/social"
          url="https://sahadhyayi.com/social"
        />
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="text-center max-w-lg">
            <div className="w-20 h-20 rounded-2xl bg-brand-primary/10 flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-brand-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3">Social Reading Community</h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Connect with fellow readers, share what you're reading, join reading groups, and discover friends who love the same books.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <SignInLink>
                <Button className="w-full sm:w-auto bg-gradient-button text-white shadow-[var(--shadow-button)] hover:shadow-[var(--shadow-elevated)] transition-all px-8">
                  Sign In
                </Button>
              </SignInLink>
              <Link to="/signup">
                <Button variant="outline" className="w-full sm:w-auto border-brand-primary text-brand-primary hover:bg-brand-primary/5 px-8">
                  Create Account
                </Button>
              </Link>
            </div>
            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4 mt-12">
              {[
                { icon: MessageCircle, label: 'Social Feed', desc: 'Share book updates' },
                { icon: Users, label: 'Find Friends', desc: 'Connect with readers' },
                { icon: MapPin, label: 'Reader Map', desc: 'Find nearby readers' },
                { icon: BookOpen, label: 'Reading Groups', desc: 'Join book clubs' },
              ].map((f, i) => (
                <div key={i} className="p-4 rounded-xl bg-card border border-border text-left">
                  <f.icon className="w-5 h-5 text-brand-primary mb-2" />
                  <p className="text-sm font-semibold text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  const tabs = [
    { value: 'feed', label: 'Feed', icon: MessageCircle },
    { value: 'friends', label: 'Friends', icon: Users },
    { value: 'map', label: 'Map', icon: MapPin },
    { value: 'groups', label: 'Groups', icon: UsersIcon },
  ];

  return (
    <>
      <SEO
        title="Social Reading Community | Sahadhyayi"
        description="Connect with fellow readers, share your reading journey, and discover new books."
        canonical="https://sahadhyayi.com/social"
        url="https://sahadhyayi.com/social"
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-br from-brand-primary/5 via-background to-brand-secondary/5 border-b border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Community</h1>
                <p className="text-sm text-muted-foreground">Connect, share, and discover with fellow readers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full max-w-lg bg-muted/50 rounded-xl p-1 mb-6">
              {tabs.map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 rounded-lg gap-1.5 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-brand-primary transition-all"
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="feed" className="mt-0">
              <div className="max-w-2xl mx-auto">
                <EnhancedSocialFeed />
              </div>
            </TabsContent>

            <TabsContent value="friends" className="mt-0">
              <EnhancedFriendsManager />
            </TabsContent>

            <TabsContent value="map" className="mt-0">
              <div className="space-y-6">
                <Card className="border-border overflow-hidden">
                  <EnhancedReadingMap />
                </Card>
                <Card className="border-border overflow-hidden">
                  <FriendsLocationMap />
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="groups" className="mt-0">
              <ReadingGroups />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

// Need Card import for map tab
import { Card } from '@/components/ui/card';

export default SocialMedia;
