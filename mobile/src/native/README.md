# PlistToJsonConverter Native Module

A React Native native module that converts plist files to JSON format.

## Usage

```typescript
import { PlistToJsonConverter } from '../native';

// Convert a plist file to JSON
try {
  const jsonData = await PlistToJsonConverter.convertPlistToJson('Info.plist');
  console.log('Converted plist data:', jsonData);
} catch (error) {
  console.error('Error converting plist:', error);
}
```

## File Path Support

The module supports both absolute and relative paths:

- **Absolute paths**: Use the full path starting with `/`
- **Relative paths**: Files are looked up in the main bundle

## Error Handling

The module can throw the following errors:
- `file_not_found`: When the plist file cannot be found
- `read_error`: When there's an error reading the file
- `parse_error`: When there's an error parsing the plist data

## Installation

The module is automatically included in the iOS build through CocoaPods. After adding the files, run:

```bash
cd ios && pod install
```
