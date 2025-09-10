#import "PlistToJsonConverter.h"

@implementation PlistToJsonConverter

// This is required for the module to be available in JavaScript
RCT_EXPORT_MODULE(PlistToJsonConverter)

// Export the method that will be callable from JavaScript
RCT_REMAP_METHOD(convertPlistToJson,
                 convertPlistToJsonWithPath:(NSString *)filePath
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
{
  // Ensure we're on the main thread
  dispatch_async(dispatch_get_main_queue(), ^{
    NSString *path;
    
    if ([filePath hasPrefix:@"/"]) {
      // If it's an absolute path, use it directly
      path = filePath;
    } else {
      // If it's a relative path, look in the main bundle
      path = [[NSBundle mainBundle] pathForResource:[filePath stringByDeletingPathExtension] 
                                           ofType:[filePath pathExtension]];
    }
    
    if (!path) {
      reject(@"file_not_found", @"Plist file not found", nil);
      return;
    }
    
    NSError *error;
    NSData *data = [NSData dataWithContentsOfFile:path options:0 error:&error];
    if (error) {
      reject(@"read_error", @"Failed to read plist file", error);
      return;
    }
    
    NSPropertyListFormat format;
    NSDictionary *plist = [NSPropertyListSerialization propertyListWithData:data
                                                                  options:NSPropertyListImmutable
                                                                   format:&format
                                                                    error:&error];
    if (error) {
      reject(@"parse_error", @"Failed to parse plist file", error);
      return;
    }
    
    resolve(plist);
  });
}

// Required for the module to be loaded on the main thread
+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end
