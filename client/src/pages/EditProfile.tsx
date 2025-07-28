import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArrowLeft, Upload, User, Globe, Mail, MapPin, Clock, Link, Camera } from 'lucide-react';
import { DynamicSocialLinks } from '@/components/DynamicSocialLinks';
import { Link as RouterLink, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface SocialLink {
  id: string;
  url: string;
  platform?: string;
}

interface ProfileFormData {
  display_name: string;
  tagline: string;
  bio: string;
  location: string;
  timezone: string;
  website: string;
  contact_email: string;
  social_links: SocialLink[];
  avatar_url?: string;
}

// Common timezone options
const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
];

export default function EditProfile() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<ProfileFormData>({
    display_name: '',
    tagline: '',
    bio: '',
    location: '',
    timezone: '',
    website: '',
    contact_email: '',
    social_links: [],
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Fetch current profile data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/profile', user?.email],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/profile/${encodeURIComponent(user?.email || '')}`);
      const result = await response.json();
      return result;
    },
    enabled: !!user?.email,
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const profileId = profileData?.profile?.id || profile?.id;
      
      if (!profileId) {
        throw new Error('Profile ID not found');
      }
      
      const response = await apiRequest('PUT', `/api/profile/${profileId}`, data);
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated", 
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      // Force refresh the page to update AuthContext
      window.location.href = '/dashboard';
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Avatar upload mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64 = reader.result as string;
            const base64Data = base64.split(',')[1];
            
            const profileId = profileData?.profile?.id || profile?.id;
            if (!profileId) {
              throw new Error('Profile ID not found');
            }
            
            const response = await apiRequest('POST', '/api/upload-avatar', {
              fileName: `avatar_${Date.now()}.${file.type.split('/')[1]}`,
              fileData: base64Data,
              contentType: file.type,
              userId: profileId,
            });
            
            const result = await response.json();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },
  });

  // Load profile data into form
  useEffect(() => {
    if (profileData?.profile) {
      const prof = (profileData as any).profile;
      setFormData({
        display_name: prof.display_name || '',
        tagline: prof.tagline || '',
        bio: prof.bio || '',
        location: prof.location || '',
        timezone: prof.timezone || '',
        website: prof.website || '',
        contact_email: prof.contact_email || prof.email || '',
        social_links: Array.isArray(prof.social_links) ? prof.social_links : 
          Object.entries(prof.social_links || {}).map(([platform, url], index) => ({
            id: `${platform}_${index}`,
            url: url as string,
            platform
          })).filter(link => link.url),
        avatar_url: prof.avatar_url,
      });
      setAvatarPreview(prof.avatar_url || '');
    }
  }, [profileData]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialLinksChange = (links: SocialLink[]) => {
    setFormData(prev => ({
      ...prev,
      social_links: links,
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        toast({
          title: "Invalid File Type",
          description: "Please select a JPEG or PNG image.",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get profile ID from API data or auth context
    const profileId = profileData?.profile?.id || profileData?.id || profile?.id;
    
    if (!profileId) {
      toast({
        title: "Error",
        description: "User profile not found. Please try logging in again.",
        variant: "destructive",
      });
      return;
    }

    let updatedFormData = { ...formData };

    // Upload avatar if a new one was selected
    if (avatarFile) {
      try {
        const uploadResult = await uploadAvatarMutation.mutateAsync(avatarFile);
        updatedFormData.avatar_url = (uploadResult as any).publicUrl;
      } catch (error) {
        toast({
          title: "Avatar Upload Failed",
          description: "Failed to upload avatar. Profile will be saved without avatar update.",
          variant: "destructive",
        });
      }
    }

    // Clean up social links (remove empty values)
    const cleanedSocialLinks = updatedFormData.social_links.filter(link => 
      link.url && link.url.trim()
    );
    updatedFormData.social_links = cleanedSocialLinks;

    updateProfileMutation.mutate(updatedFormData);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="max-w-2xl mx-auto px-6 py-12">
          <Card>
            <CardContent className="p-6 text-center">
              <p>Please sign in to edit your profile.</p>
              <RouterLink href="/login">
                <Button className="mt-4">Sign In</Button>
              </RouterLink>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <RouterLink href="/dashboard">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </RouterLink>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Edit Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Avatar preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                    <Camera className="w-4 h-4" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Click the camera icon to upload a new avatar<br />
                  JPEG or PNG, max 5MB
                </p>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="display_name">Display Name *</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => handleInputChange('display_name', e.target.value)}
                    placeholder="Your name or stage name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="contact@example.com"
                  />
                </div>
              </div>

              {/* Tagline */}
              <div>
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={formData.tagline}
                  onChange={(e) => handleInputChange('tagline', e.target.value)}
                  placeholder="A short hook that describes what you do"
                  maxLength={100}
                  style={{
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    MozUserSelect: 'text',
                    msUserSelect: 'text'
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.tagline.length}/100 characters
                </p>
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell people about yourself, your work, and what they can expect from your content..."
                  rows={4}
                  maxLength={500}
                  style={{
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    MozUserSelect: 'text',
                    msUserSelect: 'text'
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              {/* Location and Timezone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location" className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>Location</span>
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="City, State / Country"
                  />
                </div>
                
                <div>
                  <Label htmlFor="timezone" className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>Timezone</span>
                  </Label>
                  <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Website */}
              <div>
                <Label htmlFor="website" className="flex items-center space-x-1">
                  <Globe className="w-4 h-4" />
                  <span>Website</span>
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              {/* Dynamic Social Links */}
              <DynamicSocialLinks
                value={formData.social_links}
                onChange={handleSocialLinksChange}
              />

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6">
                <RouterLink href="/dashboard">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </RouterLink>
                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending || uploadAvatarMutation.isPending}
                  className="min-w-[120px]"
                >
                  {(updateProfileMutation.isPending || uploadAvatarMutation.isPending) ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    'Save Profile'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}