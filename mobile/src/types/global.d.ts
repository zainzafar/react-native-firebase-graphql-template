// Global type declarations to fix third-party library issues

// Fix JSX namespace issue in react-native-country-codes-picker
declare namespace JSX {
  interface Element extends React.ReactElement<unknown, string | React.JSXElementConstructor<unknown>> {}
  interface ElementClass extends React.Component<Record<string, unknown>> {}
  interface ElementAttributesProperty {
    props: {};
  }
  interface ElementChildrenAttribute {
    children: {};
  }
  interface IntrinsicAttributes extends React.Attributes {}
  interface IntrinsicClassAttributes<T> extends React.ClassAttributes<T> {}
  interface IntrinsicElements {
    [elemName: string]: Record<string, unknown>;
  }
}
