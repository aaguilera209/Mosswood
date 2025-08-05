import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface BannerUploadProps {
  currentBannerUrl?: string | null;
  onUploadSuccess?: (bannerUrl: string) => void;
}

export function BannerUpload({ currentBannerUrl, onUploadSuccess }: BannerUploadProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!profile?.id) {
        throw new Error('User not authenticated');
      }

      // Convert file to base64
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Data = reader.result as string;
            const base64String = base64Data.split(',')[1]; // Remove data URL prefix

            const response = await apiRequest('POST', '/api/upload-banner', {
              fileName: `banner-${Date.now()}.${file.name.split('.').pop()}`,
              fileData: base64String,
              contentType: file.type,
              userId: profile.id,
            });

            const result = await response.json();
            if (result.success) {
              resolve(result.publicUrl);
            } else {
              reject(new Error(result.error || 'Upload failed'));
            }
          } catch (error: any) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    },
    onSuccess: (bannerUrl) => {
      toast({
        title: "Success!",
        description: "Your banner has been uploaded successfully.",
      });
      
      // Clear preview state
      setPreviewUrl(null);
      setSelectedFile(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      
      // Call callback if provided
      onUploadSuccess?.(bannerUrl);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload banner. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const clearPreview = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ImageIcon className="w-5 h-5" />
          <span>Storefront Banner</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Banner Display */}
        {currentBannerUrl && !previewUrl && (
          <div className="relative">
            <p className="text-sm text-muted-foreground mb-2">Current Banner:</p>
            <div className="aspect-[3/1] bg-muted rounded-lg overflow-hidden">
              <img 
                src={currentBannerUrl} 
                alt="Current banner"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Preview Display */}
        {previewUrl && (
          <div className="relative">
            <p className="text-sm text-muted-foreground mb-2">Preview:</p>
            <div className="aspect-[3/1] bg-muted rounded-lg overflow-hidden relative">
              <img 
                src={previewUrl} 
                alt="Banner preview"
                className="w-full h-full object-cover"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={clearPreview}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Upload Controls */}
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {!selectedFile && (
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Banner Image
            </Button>
          )}

          {selectedFile && (
            <div className="flex space-x-2">
              <Button
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className="flex-1"
              >
                {uploadMutation.isPending ? (
                  <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {uploadMutation.isPending ? 'Uploading...' : 'Upload Banner'}
              </Button>
              <Button
                onClick={clearPreview}
                variant="outline"
                disabled={uploadMutation.isPending}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Upload a banner image for your storefront (recommended: 1200x400px, max 5MB)
        </p>
      </CardContent>
    </Card>
  );
}