import React, { useState, useRef } from "react";
import { Upload, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface LogoUploadProps {
  currentLogoUrl?: string | null;
  onUploadSuccess?: () => void;
  userId?: string;
}

export default function LogoUpload({ currentLogoUrl, onUploadSuccess, userId }: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [logoUrl, setLogoUrl] = useState(currentLogoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Update local state when prop changes
  React.useEffect(() => {
    setLogoUrl(currentLogoUrl);
  }, [currentLogoUrl]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG, PNG, GIF, or WebP image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (500KB limit)
    if (file.size > 500 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 500KB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/logo-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();

      toast({
        title: "Logo uploaded successfully",
        description: "Your company logo has been updated.",
      });

      // Invalidate business profile cache to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/business/profile'] });
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveLogo = async () => {
    try {
      setIsUploading(true);
      
      await apiRequest("DELETE", "/api/logo-upload");
      
      // Clear the current logo URL and invalidate cache
      setLogoUrl(null);
      queryClient.invalidateQueries({ queryKey: ["/api/business/profile"] });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: [`/api/logo/${userId}`] });
      }
      
      toast({
        title: "Success",
        description: "Logo removed successfully",
      });
      
      onUploadSuccess?.();
    } catch (error: any) {
      console.error("Error removing logo:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove logo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Company Logo</h3>
        {currentLogoUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveLogo}
            disabled={isUploading}
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      {/* Current logo display */}
      {currentLogoUrl && (
        <Card className="w-32 h-32 mx-auto">
          <CardContent className="p-2 h-full">
            <img
              src={currentLogoUrl}
              alt="Company logo"
              className="w-full h-full object-contain rounded"
            />
          </CardContent>
        </Card>
      )}

      {/* Upload area */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          dragActive 
            ? "border-primary bg-primary/5" 
            : "border-gray-300 hover:border-primary"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              {isUploading ? (
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              ) : (
                <Upload className="h-6 w-6 text-primary" />
              )}
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isUploading ? "Uploading..." : "Upload Company Logo"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Drag and drop your logo here, or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Supports JPEG, PNG, GIF, WebP (max 500KB)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
}