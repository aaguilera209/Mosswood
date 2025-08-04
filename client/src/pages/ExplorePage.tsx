import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Play, Search, Star, Users, Filter, Grid, List } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useQuery } from '@tanstack/react-query';



export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch real creators from the database
  const { data: creators, isLoading, error } = useQuery({
    queryKey: ['/api/creators'],
  });

  const categories = ['all', 'Art & Design', 'Photography', 'Music', 'Business', 'Cooking', 'Technology'];
  const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'newest', label: 'Newest' },
    { value: 'videos', label: 'Most Videos' }
  ];

  const filteredCreators = Array.isArray(creators) ? creators.filter((creator: any) => {
    const matchesSearch = creator.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creator.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creator.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creator.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || creator.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a: any, b: any) => {
    switch (sortBy) {
      case 'rating':
        return (b.rating || 4.5) - (a.rating || 4.5);
      case 'videos':
        return (b.video_count || 0) - (a.video_count || 0);
      case 'newest':
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      default:
        return (b.follower_count || 0) - (a.follower_count || 0);
    }
  }) : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Explore Creators</h1>
          <p className="text-muted-foreground text-lg">
            Discover independent creators and their amazing content
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search creators..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
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
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {filteredCreators.length} creators found
          </div>
        </div>

        {/* Creators Grid/List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted rounded-t-lg" />
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-3 bg-muted rounded mb-4 w-3/4" />
                  <div className="h-10 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCreators.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            : "space-y-6"
          }>
            {filteredCreators.map((creator: any) => (
              <Card key={creator.id} className={`group hover:shadow-lg transition-shadow ${
                viewMode === 'list' ? 'flex flex-row overflow-hidden' : ''
              }`}>
                <div className={`bg-muted relative overflow-hidden ${
                  viewMode === 'list' 
                    ? 'w-48 h-32 flex-shrink-0' 
                    : 'aspect-video rounded-t-lg'
                }`}>
                  {creator.avatar_url && (
                    <img 
                      src={creator.avatar_url} 
                      alt={creator.display_name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 text-white">
                    <div className="flex items-center space-x-1 mb-1">
                      <h3 className={`font-semibold ${viewMode === 'list' ? 'text-sm' : 'text-lg'}`}>
                        {creator.display_name || creator.username}
                      </h3>
                      {creator.is_verified && (
                        <Badge variant="verified" className="text-xs">
                          <Star className="w-2 h-2 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-black/50 text-white text-xs">
                      <Play className="w-2 h-2 mr-1" />
                      {creator.video_count || 0}
                    </Badge>
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-primary text-primary-foreground text-xs">
                      {creator.category || 'Creator'}
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="p-6 flex-1">
                  <p className={`text-muted-foreground mb-4 ${
                    viewMode === 'list' ? 'text-sm line-clamp-2' : ''
                  }`}>
                    {creator.bio || 'Creative professional sharing amazing content'}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      {creator.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{creator.rating}</span>
                        </div>
                      )}
                      {creator.follower_count && (
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{creator.follower_count.toLocaleString()}</span>
                        </div>
                      )}
                      {!creator.rating && !creator.follower_count && (
                        <span className="text-muted-foreground">New creator</span>
                      )}
                    </div>
                    <span className="font-semibold">{creator.price_range || 'Various prices'}</span>
                  </div>
                  
                  <Link href={`/creator/${creator.username}`}>
                    <Button className="w-full group-hover:bg-primary/90">
                      Visit Storefront
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">No creators found</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Try adjusting your search criteria or browse different categories.
            </p>
            <Button onClick={() => {setSearchTerm(''); setSelectedCategory('all');}}>
              Clear Filters
            </Button>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}