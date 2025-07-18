import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Upload, X, CheckCircle, FileVideo, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface VideoUploadFormData {
  file: File | null;
  title: string;
  description: string;
  tags: string;
  isFree: boolean;
  price: number;
}

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VideoUploadModal({ isOpen, onClose }: VideoUploadModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<VideoUploadFormData>({
    file: null,
    title: '',
    description: '',
    tags: '',
    isFree: false, // Default to paid
    price: 0,
  });
  const [priceInput, setPriceInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, title: e.target.value }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, description: e.target.value }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, tags: e.target.value }));
  };

  const handleFreeToggle = (checked: boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      isFree: checked, 
      price: checked ? 0 : parseFloat(priceInput) || 0 
    }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (numericValue.length === 0) {
      setPriceInput('');
      setFormData(prev => ({ ...prev, price: 0 }));
      return;
    }

    // Format as currency: add decimal point after 2 digits from right
    let formattedValue = numericValue;
    if (numericValue.length === 1) {
      formattedValue = `0.0${numericValue}`;
    } else if (numericValue.length === 2) {
      formattedValue = `0.${numericValue}`;
    } else {
      const dollars = numericValue.slice(0, -2);
      const cents = numericValue.slice(-2);
      formattedValue = `${dollars}.${cents}`;
    }

    setPriceInput(formattedValue);
    setFormData(prev => ({ ...prev, price: parseFloat(formattedValue) || 0 }));
  };

  const resetForm = () => {
    setFormData({
      file: null,
      title: '',
      description: '',
      tags: '',
      isFree: false,
      price: 0,
    });
    setPriceInput('');
    setUploadProgress(0);
    setValidationErrors([]);
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!formData.file) {
      errors.push('Please select a video file');
    } else {
      // Check file type
      const allowedTypes = ['video/mp4', 'video/mov', 'video/webm', 'video/quicktime'];
      if (!allowedTypes.includes(formData.file.type)) {
        errors.push('Please select a valid video file (.mp4, .mov, or .webm)');
      }
      
      // Check file size (500MB limit)
      const maxSize = 500 * 1024 * 1024; // 500MB in bytes
      if (formData.file.size > maxSize) {
        errors.push('Video file must be smaller than 500MB');
      }
    }
    
    if (!formData.title.trim()) {
      errors.push('Please enter a title');
    }
    
    if (!formData.isFree && formData.price <= 0) {
      errors.push('Please set a valid price or mark as free');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upload videos",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      console.log('Starting video upload process...');
      console.log('File details:', {
        name: formData.file!.name,
        size: formData.file!.size,
        type: formData.file!.type
      });

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedTitle = formData.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const fileExtension = formData.file!.name.split('.').pop();
      const fileName = `${timestamp}_${sanitizedTitle}.${fileExtension}`;
      
      // Try simplified path first to test if folder structure is the issue
      const filePath = `${user.id}/${fileName}`;

      console.log('Upload path:', filePath);
      console.log('Starting Supabase storage upload...');

      // Skip bucket test and go straight to upload
      console.log('Attempting direct upload with timeout...');
      
      // Test Supabase client connection first
      console.log('Testing Supabase connection...');
      try {
        const { data: session } = await supabase.auth.getSession();
        console.log('Auth session:', session ? 'Valid' : 'Invalid');
        
        // Test basic storage access
        console.log('Testing storage client...');
        const storage = supabase.storage;
        console.log('Storage client exists:', !!storage);
        
        // Try to get bucket info without listing (which was hanging)
        console.log('Testing bucket access...');
        const { data: bucketData, error: bucketError } = await Promise.race([
          supabase.storage.from('videos').list('', { limit: 1 }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Bucket test timeout')), 5000))
        ]);
        
        console.log('Bucket test result:', { bucketData, bucketError });
      } catch (connectionError) {
        console.error('Connection test failed:', connectionError);
      }
      
      // Now try the actual upload with aggressive timeout
      console.log('Starting video file upload...');
      
      try {
        const uploadResult = await Promise.race([
          supabase.storage
            .from('videos')
            .upload(filePath, formData.file!, {
              cacheControl: '3600',
              upsert: false,
            }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
          )
        ]);
        
        console.log('Upload completed:', uploadResult);
        const { data: uploadData, error: uploadError } = uploadResult as any;

        console.log('Supabase upload response:', { uploadData, uploadError });

        if (uploadError) {
          console.error('Upload error details:', {
            message: uploadError.message,
            statusCode: uploadError.statusCode,
            error: uploadError.error,
            details: uploadError
          });
          
          // Provide more specific error messages
          if (uploadError.message.includes('new row violates row-level security')) {
            throw new Error('Permission denied: Please check your Supabase storage policies');
          } else if (uploadError.message.includes('bucket')) {
            throw new Error('Storage bucket not found: Please create the "videos" bucket in Supabase');
          } else {
            throw new Error(`Upload failed: ${uploadError.message}`);
          }
        }

        console.log('File uploaded successfully to Supabase storage');
        setUploadProgress(50);

        // Get public URL for the uploaded video
        console.log('Getting public URL for uploaded file...');
        const { data: publicUrlData } = supabase.storage
          .from('videos')
          .getPublicUrl(filePath);

        const videoUrl = publicUrlData.publicUrl;
        console.log('Public URL generated:', videoUrl);
      
      } catch (uploadError: any) {
        console.error('Upload process failed:', uploadError);
        throw uploadError;
      }

      // Parse tags from comma-separated string
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Save video metadata to database
      const videoData = {
        creator_id: user.id,
        title: formData.title,
        description: formData.description || null,
        price: formData.isFree ? 0 : Math.round(formData.price * 100), // Convert to cents
        is_free: formData.isFree,
        tags: tagsArray,
        video_url: videoUrl,
        file_size: formData.file!.size,
      };

      console.log('Sending video metadata to API:', videoData);
      const response = await apiRequest('POST', '/api/videos', videoData);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.message || 'Failed to save video metadata');
      }

      console.log('Video metadata saved successfully!');

      setUploadProgress(100);

      // Show success toast
      toast({
        title: "Video Uploaded Successfully!",
        description: "Your video is now available in your dashboard.",
      });

      // Invalidate videos query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['videos'] });

      // Close modal and reset form
      resetForm();
      onClose();

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "There was an error uploading your video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Upload New Video
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" />
                <div className="text-sm text-red-700 dark:text-red-300">
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
              <div className="flex items-center space-x-3">
                <FileVideo className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Uploading video...
                  </p>
                  <Progress value={uploadProgress} className="mt-2" />
                </div>
              </div>
            </div>
          )}
          {/* Video Title */}
          <div className="space-y-2">
            <Label htmlFor="video-title" className="text-gray-900 dark:text-white">
              Video Title
            </Label>
            <Input
              id="video-title"
              type="text"
              placeholder="Enter video title..."
              value={formData.title}
              onChange={handleTitleChange}
              disabled={isUploading}
              className="w-full"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="video-description" className="text-gray-900 dark:text-white">
              Description
            </Label>
            <Textarea
              id="video-description"
              placeholder="Tell viewers about your video..."
              value={formData.description}
              onChange={handleDescriptionChange}
              disabled={isUploading}
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="video-tags" className="text-gray-900 dark:text-white">
              Tags
            </Label>
            <Input
              id="video-tags"
              type="text"
              placeholder="e.g., tutorial, tech, creativity"
              value={formData.tags}
              onChange={handleTagsChange}
              disabled={isUploading}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Separate tags with commas to help viewers find your content
            </p>
          </div>

          {/* Pricing Section */}
          <div className="space-y-4">
            <Label className="text-gray-900 dark:text-white text-base font-medium">
              Pricing
            </Label>
            
            {/* Price Input (shown by default) */}
            {!formData.isFree && (
              <div className="space-y-2">
                <Label htmlFor="video-price" className="text-gray-900 dark:text-white">
                  Price
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    $
                  </span>
                  <Input
                    id="video-price"
                    type="text"
                    placeholder="0.00"
                    value={priceInput}
                    onChange={handlePriceChange}
                    disabled={isUploading}
                    className="pl-8"
                  />
                </div>
              </div>
            )}

            {/* Free Toggle */}
            <div className="flex items-center space-x-3">
              <Switch
                id="free-toggle"
                checked={formData.isFree}
                onCheckedChange={handleFreeToggle}
                disabled={isUploading}
              />
              <Label htmlFor="free-toggle" className="text-gray-900 dark:text-white">
                Make this video free
              </Label>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="video-file" className="text-gray-900 dark:text-white">
              Video File
            </Label>
            <Input
              id="video-file"
              type="file"
              accept="video/mp4,video/mov,video/avi,video/webm,video/quicktime"
              onChange={handleFileChange}
              disabled={isUploading}
              className="cursor-pointer"
            />
            {formData.file && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Selected: {formData.file.name} ({Math.round(formData.file.size / 1024 / 1024)}MB)
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isUploading}
              className="text-gray-700 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading || !formData.file || !formData.title}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isUploading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Uploading...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>Upload Video</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}