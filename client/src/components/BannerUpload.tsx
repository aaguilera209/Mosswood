import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
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
      
      // Clear state
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
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  return (
    <div className="inline-block">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {!selectedFile ? (
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="sm"
          className="bg-background/90 hover:bg-background text-foreground border-border"
          disabled={uploadMutation.isPending}
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploadMutation.isPending ? 'Uploading...' : 'Choose Image'}
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
            className="bg-background/90 hover:bg-background text-foreground border-border"
            disabled={uploadMutation.isPending}
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose Different
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={uploadMutation.isPending}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      )}
    </div>
  );
}