/// <reference types="vite/client" />
import { VNode } from 'vue';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elem: string]: any;
    }
    // Optionally, you can add Element, ElementClass, etc. if needed
  }
}