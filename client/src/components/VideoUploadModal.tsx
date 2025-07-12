import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Upload, X, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VideoUploadFormData {
  file: File | null;
  title: string;
  description: string;
  isFree: boolean;
  price: number;
}

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VideoUploadModal({ isOpen, onClose }: VideoUploadModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<VideoUploadFormData>({
    file: null,
    title: '',
    description: '',
    isFree: false, // Default to paid
    price: 0,
  });
  const [priceInput, setPriceInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

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
      isFree: false,
      price: 0,
    });
    setPriceInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file || !formData.title) {
      toast({
        title: "Missing Information",
        description: "Please select a video file and enter a title",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // TODO: Replace with actual Supabase upload logic
      // TODO: Upload video file to Supabase Storage
      // TODO: Save video metadata (title, description, price) to Supabase database
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

      // Show success toast
      toast({
        title: "Video Uploaded Successfully!",
        description: "Your video is being processed and will be available shortly.",
      });

      // Close modal and reset form
      resetForm();
      onClose();

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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