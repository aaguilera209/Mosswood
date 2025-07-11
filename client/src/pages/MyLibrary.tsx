import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Play, Search, Calendar, Clock, Filter } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

// Mock purchased videos data - in real app, this would come from API
const mockPurchasedVideos = [
  {
    id: 1,
    title: "Advanced Digital Painting Techniques",
    creator: "Maya Chen",
    creatorUsername: "maya",
    duration: "45:32",
    purchaseDate: "2024-07-10",
    thumbnail: "/api/placeholder/300/200",
    price: 29.99,
    category: "Art & Design"
  },
  {
    id: 2,
    title: "Professional Photography Lighting Setup",
    creator: "Alex Rivera",
    creatorUsername: "alex", 
    duration: "32:18",
    purchaseDate: "2024-07-08",
    thumbnail: "/api/placeholder/300/200",
    price: 24.99,
    category: "Photography"
  },
  {
    id: 3,
    title: "Music Production Fundamentals",
    creator: "Sarah Thompson",
    creatorUsername: "sarah",
    duration: "58:45",
    purchaseDate: "2024-07-05",
    thumbnail: "/api/placeholder/300/200",
    price: 39.99,
    category: "Music"
  }
];

function MyLibraryContent() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', 'Art & Design', 'Photography', 'Music', 'Business'];
  
  const filteredVideos = mockPurchasedVideos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.creator.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalValue = mockPurchasedVideos.reduce((sum, video) => sum + video.price, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">My Library</h1>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="text-muted-foreground">
              {mockPurchasedVideos.length} videos purchased • ${totalValue.toFixed(2)} total value
            </p>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search your library..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Videos Grid */}
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVideos.map((video) => (
              <Card key={video.id} className="group hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted rounded-t-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <Badge variant="secondary" className="bg-green-600 text-white mb-2">
                      <Play className="w-3 h-3 mr-1" />
                      Owned
                    </Badge>
                    <h3 className="font-semibold text-lg mb-1">{video.title}</h3>
                    <p className="text-sm text-gray-200">by {video.creator}</p>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-black/50 text-white">
                      <Clock className="w-3 h-3 mr-1" />
                      {video.duration}
                    </Badge>
                  </div>
                  <div className="absolute top-4 left-4">
                    <Badge variant="secondary" className="bg-primary text-primary-foreground">
                      {video.category}
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Purchased {new Date(video.purchaseDate).toLocaleDateString()}</span>
                    </div>
                    <span className="font-semibold">${video.price}</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link href={`/video/${video.id}`} className="flex-1">
                      <Button className="w-full group-hover:bg-primary/90">
                        <Play className="w-4 h-4 mr-2" />
                        Watch Now
                      </Button>
                    </Link>
                    <Link href={`/creator/${video.creatorUsername}`}>
                      <Button variant="outline" size="icon">
                        <span className="text-xs">👤</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Play className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {searchTerm || selectedCategory !== 'all' ? 'No videos found' : 'Your library is empty'}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Start building your video collection by exploring creators and purchasing videos you love.'
              }
            </p>
            {(!searchTerm && selectedCategory === 'all') && (
              <Link href="/explore">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Explore Creators
                </Button>
              </Link>
            )}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}

export default function MyLibrary() {
  return <MyLibraryContent />;
}