declare module './layouts/Layout' {
  const Component: any;
  export default Component;
}
declare module './router/AppRoutes' {
  const Component: any;
  export default Component;
}
declare module './layouts/Blank' {
  export const Blank: any;
}
declare module '../atoms/Buttons' {
  const Component: any;
  export default Component;
}
declare module './Buttons' {
  const Component: any;
  export default Component;
}

declare module '*.jsx' {
  import React from 'react';
  const Component: React.ComponentType<any>;
  export default Component;
}

declare module '*.js' {
  const content: any;
  export default content;
}

declare global {
  interface Window {
    matchMedia: (query: string) => MediaQueryList;
  }
}

export {};
