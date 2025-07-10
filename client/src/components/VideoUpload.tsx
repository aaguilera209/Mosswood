import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Upload, CheckCircle } from 'lucide-react';

interface VideoUploadFormData {
  file: File | null;
  title: string;
  description: string;
  isFree: boolean;
  price: number;
}

export function VideoUpload() {
  const [formData, setFormData] = useState<VideoUploadFormData>({
    file: null,
    title: '',
    description: '',
    isFree: true,
    price: 0,
  });
  const [priceInput, setPriceInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

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

  const handleFreeToggle = (checked: boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      isFree: checked, 
      price: checked ? 0 : parseFloat(priceInput) || 0 
    }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits and decimal point
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
      isFree: true,
      price: 0,
    });
    setPriceInput('');
    setUploadSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file || !formData.title) {
      alert('Please select a video file and enter a title');
      return;
    }

    setIsUploading(true);
    
    try {
      // TODO: Replace with actual Supabase upload logic
      console.log('Video Upload Form Data:', {
        fileName: formData.file.name,
        fileSize: formData.file.size,
        fileType: formData.file.type,
        title: formData.title,
        description: formData.description,
        isFree: formData.isFree,
        price: formData.price,
      });

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      setUploadSuccess(true);
      setTimeout(() => {
        resetForm();
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (uploadSuccess) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl text-gray-900 dark:text-white mb-2">
            Video Uploaded Successfully!
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Your video is being processed and will be available shortly.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-gray-900 dark:text-white">
          Upload New Video
        </CardTitle>
        <CardDescription className="text-gray-500 dark:text-gray-400">
          Share your content with your audience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="video-file" className="text-gray-900 dark:text-white">
              Video File
            </Label>
            <div className="relative">
              <Input
                id="video-file"
                type="file"
                accept="video/mp4,video/mov,video/avi,video/webm"
                onChange={handleFileChange}
                className="cursor-pointer"
                disabled={isUploading}
              />
              {formData.file && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Selected: {formData.file.name} ({Math.round(formData.file.size / 1024 / 1024)}MB)
                </p>
              )}
            </div>
          </div>

          {/* Title */}
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

          {/* Pricing */}
          <div className="space-y-4">
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
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Set a price for your premium content
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isUploading || !formData.file || !formData.title}
            className="w-full bg-amber-700 hover:bg-amber-800 dark:bg-amber-300 dark:hover:bg-amber-400 text-white dark:text-gray-900"
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
        </form>
      </CardContent>
    </Card>
  );
}