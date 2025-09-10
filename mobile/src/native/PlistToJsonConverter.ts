import { NativeModules } from 'react-native';

interface PlistToJsonConverterInterface {
  convertPlistToJson(filePath: string): Promise<Record<string, unknown>>;
}

const { PlistToJsonConverter } = NativeModules;

export default PlistToJsonConverter as PlistToJsonConverterInterface;
