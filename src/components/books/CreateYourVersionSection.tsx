
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, PenTool, LogIn, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserContentEditor from '@/components/content/UserContentEditor';

interface CreateYourVersionSectionProps {
  bookId: string;
  bookTitle: string;
}

const CreateYourVersionSection = ({ bookId, bookTitle }: CreateYourVersionSectionProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showContentEditor, setShowContentEditor] = useState(false);

  const handleSignInPrompt = () => {
    navigate('/signin');
  };

  const handleStartWriting = () => {
    if (!user) {
      handleSignInPrompt();
      return;
    }
    setShowContentEditor(true);
  };

  return (
    <div className="w-full">
      <CardHeader className="pb-4 px-0">
        <CardTitle className="flex items-center gap-3 text-purple-900">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
            <Edit className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Create Your Own Version</h3>
            <p className="text-sm text-purple-700 font-normal mt-1">
              Reimagine chapters, create alternative endings, or continue the story
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-0">
        <div className="space-y-6">
          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-purple-200 text-center">
              <BookOpen className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-semibold text-purple-900 mb-1">Alternative Chapters</h4>
              <p className="text-sm text-gray-600">Rewrite existing chapters with your own twist</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-purple-200 text-center">
              <PenTool className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-semibold text-purple-900 mb-1">New Endings</h4>
              <p className="text-sm text-gray-600">Create your own unique ending to the story</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-purple-200 text-center">
              <Edit className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-semibold text-purple-900 mb-1">Story Continuation</h4>
              <p className="text-sm text-gray-600">Continue where the original story left off</p>
            </div>
          </div>

          {/* Main action area */}
          <div className="bg-white p-6 rounded-lg border border-purple-200">
            {!user ? (
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Ready to unleash your creativity?
                </h4>
                <p className="text-gray-600 mb-6">
                  Sign in to start writing your own version of "{bookTitle}" and share it with the community.
                </p>
                <Button 
                  onClick={handleSignInPrompt}
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In to Get Started
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {!showContentEditor ? (
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      What's your take on "{bookTitle}"?
                    </h4>
                    <p className="text-gray-600 mb-6">
                      Share your creative interpretation and let other readers discover your unique perspective.
                    </p>
                    <Button 
                      onClick={handleStartWriting}
                      size="lg"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
                    >
                      <PenTool className="w-5 h-5 mr-2" />
                      Start Writing Your Version
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Writing Your Version
                      </h4>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setShowContentEditor(false)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </Button>
                    </div>
                    <UserContentEditor 
                      bookId={bookId}
                      onSuccess={() => setShowContentEditor(false)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sample community content */}
          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              Community Creations
            </h4>
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded border">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">CreativeReader23</span>
                  </div>
                  <span className="text-xs text-gray-500">2 days ago</span>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  "My alternative ending explores what would have happened if the protagonist had made different choices in the final chapter..."
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>❤️ 15 likes</span>
                  <span>💬 3 comments</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  );
};

export default CreateYourVersionSection;
