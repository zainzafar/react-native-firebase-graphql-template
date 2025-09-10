import { NativeModules } from 'react-native';

interface PlistToJsonConverterInterface {
  convertPlistToJson(filePath: string): Promise<any>;
}

const { PlistToJsonConverter } = NativeModules;

export default PlistToJsonConverter as PlistToJsonConverterInterface;
