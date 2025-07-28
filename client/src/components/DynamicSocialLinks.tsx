import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, ExternalLink } from 'lucide-react';
import { 
  SiX, 
  SiInstagram, 
  SiYoutube, 
  SiTiktok, 
  SiLinkedin, 
  SiFacebook,
  SiTwitch,
  SiDiscord,
  SiGithub
} from 'react-icons/si';
import { Globe } from 'lucide-react';

interface SocialLink {
  id: string;
  url: string;
  platform?: string;
}

interface DynamicSocialLinksProps {
  value: SocialLink[];
  onChange: (links: SocialLink[]) => void;
}

// Platform detection based on URL
const detectPlatform = (url: string): { platform: string; icon: React.ComponentType<any>; color: string } => {
  const cleanUrl = url.toLowerCase();
  
  if (cleanUrl.includes('twitter.com') || cleanUrl.includes('x.com')) {
    return { platform: 'Twitter/X', icon: SiX, color: 'text-blue-500' };
  }
  if (cleanUrl.includes('instagram.com')) {
    return { platform: 'Instagram', icon: SiInstagram, color: 'text-pink-500' };
  }
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    return { platform: 'YouTube', icon: SiYoutube, color: 'text-red-500' };
  }
  if (cleanUrl.includes('tiktok.com')) {
    return { platform: 'TikTok', icon: SiTiktok, color: 'text-black dark:text-white' };
  }
  if (cleanUrl.includes('linkedin.com')) {
    return { platform: 'LinkedIn', icon: SiLinkedin, color: 'text-blue-600' };
  }
  if (cleanUrl.includes('facebook.com')) {
    return { platform: 'Facebook', icon: SiFacebook, color: 'text-blue-600' };
  }
  if (cleanUrl.includes('twitch.tv')) {
    return { platform: 'Twitch', icon: SiTwitch, color: 'text-purple-500' };
  }
  if (cleanUrl.includes('discord.gg') || cleanUrl.includes('discord.com')) {
    return { platform: 'Discord', icon: SiDiscord, color: 'text-indigo-500' };
  }
  if (cleanUrl.includes('github.com')) {
    return { platform: 'GitHub', icon: SiGithub, color: 'text-gray-800 dark:text-gray-200' };
  }
  
  return { platform: 'Website', icon: Globe, color: 'text-gray-600' };
};

// Validate URL format
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
};

export function DynamicSocialLinks({ value, onChange }: DynamicSocialLinksProps) {
  const [links, setLinks] = useState<SocialLink[]>(
    value.length > 0 ? value : [{ id: '1', url: '' }]
  );

  const updateLinks = (newLinks: SocialLink[]) => {
    setLinks(newLinks);
    // Only pass non-empty, valid URLs to parent
    const validLinks = newLinks.filter(link => link.url.trim() && isValidUrl(link.url.trim()));
    onChange(validLinks);
  };

  const addLink = () => {
    const newLink: SocialLink = {
      id: Date.now().toString(),
      url: ''
    };
    updateLinks([...links, newLink]);
  };

  const removeLink = (id: string) => {
    if (links.length > 1) {
      updateLinks(links.filter(link => link.id !== id));
    }
  };

  const updateLink = (id: string, url: string) => {
    updateLinks(links.map(link => 
      link.id === id ? { ...link, url } : link
    ));
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Social Links & Website</Label>
      <p className="text-sm text-muted-foreground">
        Add your social media profiles and website. Platform icons will appear automatically based on the URL.
      </p>
      
      <div className="space-y-3">
        {links.map((link, index) => {
          const platformInfo = link.url ? detectPlatform(link.url) : null;
          const IconComponent = platformInfo?.icon;
          const isValid = !link.url || isValidUrl(link.url);
          
          return (
            <div key={link.id} className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <Input
                  placeholder="https://twitter.com/username or https://yourwebsite.com"
                  value={link.url}
                  onChange={(e) => updateLink(link.id, e.target.value)}
                  className={`pr-10 ${!isValid ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                
                {/* Platform Icon */}
                {IconComponent && isValid && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <IconComponent className={`w-4 h-4 ${platformInfo.color}`} />
                    {link.url && (
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                )}
              </div>
              
              {/* Platform Label */}
              {platformInfo && isValid && (
                <div className="min-w-0 flex-shrink-0">
                  <span className="text-sm text-muted-foreground">
                    {platformInfo.platform}
                  </span>
                </div>
              )}
              
              {/* Remove Button */}
              {links.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLink(link.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Add More Button */}
      {links.length < 10 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLink}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Link
        </Button>
      )}
      
      {!isValidUrl(links[links.length - 1]?.url || '') && links[links.length - 1]?.url && (
        <p className="text-sm text-red-500">
          Please enter a valid URL (including https://)
        </p>
      )}
    </div>
  );
}