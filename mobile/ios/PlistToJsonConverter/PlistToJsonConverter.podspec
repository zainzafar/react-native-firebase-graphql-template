require 'json'

package = JSON.parse(File.read(File.join(__dir__, '../../package.json')))

Pod::Spec.new do |s|
  s.name         = "PlistToJsonConverter"
  s.version      = package['version']
  s.summary      = "Convert plist files to JSON"
  s.description  = "A native module to convert plist files to JSON format"
  s.license      = "MIT"
  s.platform     = :ios, "13.4"
  s.source_files = "*.{h,m}"
  s.requires_arc = true

  s.dependency "React-Core"
end
