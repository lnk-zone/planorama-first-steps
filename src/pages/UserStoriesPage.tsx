
import { useParams, Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, FileText } from 'lucide-react';

const UserStoriesPage = () => {
  const { id: projectId, featureId } = useParams();

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to={`/projects/${projectId}/features`} className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Features
            </Link>
          </div>
          
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">User Stories</h1>
              <p className="text-gray-600">Manage user stories for this feature</p>
            </div>
            <Button disabled>
              <Plus className="h-4 w-4 mr-2" />
              Add User Story
            </Button>
          </div>
        </div>

        {/* Coming Soon */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              User Stories Management
            </CardTitle>
            <CardDescription>
              Detailed user story management coming soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">User Stories Coming Soon</h3>
              <p className="text-gray-600 mb-4">
                Create and manage user stories, acceptance criteria, and story points for your features.
              </p>
              <Button disabled>
                Create User Story
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default UserStoriesPage;
