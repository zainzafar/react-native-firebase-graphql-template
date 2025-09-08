// Global type declarations to fix third-party library issues

// Fix JSX namespace issue in react-native-country-codes-picker
declare namespace JSX {
  interface Element extends React.ReactElement<any, any> {}
  interface ElementClass extends React.Component<any> {}
  interface ElementAttributesProperty {
    props: {};
  }
  interface ElementChildrenAttribute {
    children: {};
  }
  interface IntrinsicAttributes extends React.Attributes {}
  interface IntrinsicClassAttributes<T> extends React.ClassAttributes<T> {}
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
