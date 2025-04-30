import { apiEndpoint } from '@/config/routes';
import api from './axiosInstance';
import { getAccessToken } from '@/libs/tokenHelper';
import * as FileSystem from 'expo-file-system';
import { AxiosError } from 'axios';

// Define image types and resource types as constants
export const IMAGE_TYPES = {
  DESTINATION: "1",
  TOUR: "2",
  REVIEW: "0"
};

export const RESOURCE_TYPES = {
  IMAGE: "0",
  VIDEO: "1"
};

export interface ImageInfo {
  uri: string;
  name?: string;
  type?: string;
}

interface UploadResponse {
  urls: string[];
}

const uploadApiRequest = {
  /**
   * Upload multiple files with a single API call
   * @param images Array of image objects to upload
   * @param imageTypes Array of image types corresponding to each file (or single type for all)
   * @param resourceType Resource type for all files
   * @returns Promise with upload response containing all URLs in a single array
   */
  uploadMultipleFiles: async (
    images: ImageInfo[],
    imageTypes: string | string[],
    resourceType: string = RESOURCE_TYPES.IMAGE
  ): Promise<UploadResponse> => {
    console.log('[DEBUG] uploadMultipleFiles - Starting upload of', images.length, 'files');
    console.log('[DEBUG] uploadMultipleFiles - imageTypes:', imageTypes);
    console.log('[DEBUG] uploadMultipleFiles - resourceType:', resourceType);
    
    const formData = new FormData();
    
    // Add each file individually
    images.forEach((image, index) => {
      // Make sure we have a file name and mime type
      const fileName = image.name || `image_${index}.jpg`;
      const fileType = image.type || 'image/jpeg';
      
      console.log(`[DEBUG] Preparing file ${index}:`, {
        uri: image.uri,
        name: fileName,
        type: fileType
      });
      
      // Create a file object for FormData
      const file = {
        uri: image.uri,
        name: fileName,
        type: fileType
      };
      
      // @ts-ignore - React Native FormData works differently than web FormData
      formData.append("files", file);
    });
    
    // Handle image types - can be a single type for all files or array of types
    if (Array.isArray(imageTypes)) {
      // If array has single item, use it for all files
      if (imageTypes.length === 1) {
        console.log('[DEBUG] Using single imageType for all files:', imageTypes[0]);
        images.forEach(() => {
          formData.append("types", imageTypes[0]);
        });
      } else {
        // Must match files array length
        if (imageTypes.length !== images.length) {
          console.error('[DEBUG] Error: imageTypes array length does not match files array length');
          throw new Error("imageTypes array must match files array length");
        }
        
        // Add each type
        console.log('[DEBUG] Using multiple imageTypes:', imageTypes);
        imageTypes.forEach(type => {
          formData.append("types", type);
        });
      }
    } else {
      // Single type for all files
      console.log('[DEBUG] Using single imageType for all files:', imageTypes);
      images.forEach(() => {
        formData.append("types", imageTypes);
      });
    }
    
    // Add resource type for each file
    images.forEach(() => {
      formData.append("resourceType", resourceType);
    });

    // Debug log for FormData
    console.log('[DEBUG] FormData structure created');
    
    return uploadApiRequest.uploadWithFormData(formData);
  },

  /**
   * Upload multiple images of the same type
   * @param images Array of image objects to upload
   * @param imageType Single image type for all files
   * @param resourceType Resource type
   * @returns Promise with upload response containing URLs
   */
  uploadImages: async (
    images: ImageInfo[], 
    imageType: string = IMAGE_TYPES.REVIEW,
    resourceType: string = RESOURCE_TYPES.IMAGE
  ): Promise<UploadResponse> => {
    console.log('[DEBUG] uploadImages called with:', { 
      imageCount: images.length, 
      imageType, 
      resourceType 
    });
    return uploadApiRequest.uploadMultipleFiles(images, imageType, resourceType);
  },

  /**
   * Upload multiple tour images
   * @param images Array of image objects to upload
   * @returns Promise with upload response containing URLs
   */
  uploadTourImages: async (images: ImageInfo[]): Promise<UploadResponse> => {
    console.log('uploadTourImages called with:', {
      numberOfFiles: images.length,
      files: images.map(img => ({
        uri: img.uri,
        name: img.name || 'unknown',
        type: img.type || 'image/jpeg'
      }))
    });

    // Create an array of tour image types matching the number of files
    const imageTypes = Array(images.length).fill(IMAGE_TYPES.TOUR);
    
    return uploadApiRequest.uploadMultipleFiles(images, imageTypes, RESOURCE_TYPES.IMAGE);
  },

  /**
   * Upload multiple destination images
   * @param images Array of image objects to upload
   * @returns Promise with upload response containing URLs
   */
  uploadDestinationImages: async (images: ImageInfo[]): Promise<UploadResponse> => {
    return uploadApiRequest.uploadImages(images, IMAGE_TYPES.DESTINATION, RESOURCE_TYPES.IMAGE);
  },

  /**
   * Upload multiple review images
   * @param images Array of image objects to upload
   * @returns Promise with upload response containing URLs
   */
  uploadReviewImages: async (images: ImageInfo[]): Promise<UploadResponse> => {
    console.log('[DEBUG] uploadReviewImages called with:', {
      numberOfFiles: images.length,
      files: images.map(img => ({
        uri: img.uri,
        name: img.name || 'unknown',
        type: img.type || 'image/jpeg'
      }))
    });

    // Create an array of review image types matching the number of files
    const imageTypes = Array(images.length).fill(IMAGE_TYPES.REVIEW);
    console.log('[DEBUG] Using image types:', imageTypes);
    
    return uploadApiRequest.uploadMultipleFiles(images, imageTypes, RESOURCE_TYPES.IMAGE);
  },

  /**
   * Upload mixed types of images in a single request
   * @param images Array of image objects to upload
   * @param typeMapping Object mapping file indexes to image types
   * @returns Promise with upload response containing URLs
   */
  uploadMixedImages: async (
    images: ImageInfo[],
    typeMapping: Record<number, string>
  ): Promise<UploadResponse> => {
    const types = images.map((_, index) => 
      typeMapping[index] || IMAGE_TYPES.REVIEW // Default to REVIEW if not specified
    );
    
    return uploadApiRequest.uploadMultipleFiles(images, types);
  },

  /**
   * For backward compatibility - Upload a single image
   * @param image Image object to upload
   * @param imageType Image type
   * @returns Promise with upload response containing URLs
   */
  uploadSingleImage: async (
    image: ImageInfo,
    imageType: string
  ): Promise<UploadResponse> => {
    return uploadApiRequest.uploadImages([image], imageType);
  },

  /**
   * Generic upload function that handles FormData (used internally)
   * @param formData FormData object containing files and parameters
   * @returns Promise with upload response
   */
  uploadWithFormData: async (formData: FormData): Promise<UploadResponse> => {
    try {
      const token = await getAccessToken();
      
      // Log request details
      console.log('[DEBUG] Upload request URL:', `${apiEndpoint.upload}`);
      console.log('[DEBUG] Using authorization token:', token ? 'Token present' : 'No token');
      
      // Use axios instance for the upload
      console.log('[DEBUG] Starting API upload request...');
      const response = await api.post(apiEndpoint.upload, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[DEBUG] Upload API response status:', response.status);
      console.log('[DEBUG] Upload API response data:', JSON.stringify(response.data));
      return response.data;
    } catch (error: unknown) {
      console.error('[DEBUG] Upload error:', error);
      if (error instanceof Error) {
        console.error('[DEBUG] Error message:', error.message);
        console.error('[DEBUG] Error stack:', error.stack);
      }
      if (error instanceof AxiosError && error.response) {
        console.error('[DEBUG] Error response status:', error.response.status);
        console.error('[DEBUG] Error response data:', JSON.stringify(error.response.data));
        console.error('[DEBUG] Error response headers:', JSON.stringify(error.response.headers));
      }
      throw error;
    }
  },

  /**
   * Helper method to get file info from an image uri
   * @param uri The image URI
   * @returns Promise with ImageInfo object
   */
  getImageInfoFromUri: async (uri: string): Promise<ImageInfo> => {
    console.log('[DEBUG] getImageInfoFromUri - Processing URI:', uri);
    
    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('[DEBUG] File info:', fileInfo);
      
      if (!fileInfo.exists) {
        console.error('[DEBUG] File does not exist at URI:', uri);
        throw new Error(`File does not exist at ${uri}`);
      }
      
      // Try to determine the file extension and mime type
      const uriParts = uri.split('.');
      const fileExtension = uriParts[uriParts.length - 1].toLowerCase();
      console.log('[DEBUG] Detected file extension:', fileExtension);
      
      let mimeType = 'image/jpeg'; // Default
      if (fileExtension === 'png') {
        mimeType = 'image/png';
      } else if (fileExtension === 'gif') {
        mimeType = 'image/gif';
      } else if (fileExtension === 'heic') {
        mimeType = 'image/heic';
      }
      
      // Create a fileName from the uri
      const uriComponents = uri.split('/');
      const fileName = uriComponents[uriComponents.length - 1];
      
      const result = {
        uri,
        name: fileName,
        type: mimeType
      };
      
      console.log('[DEBUG] Image info result:', result);
      return result;
    } catch (error) {
      console.error('[DEBUG] Error in getImageInfoFromUri:', error);
      throw error;
    }
  }
};

export default uploadApiRequest;
