// Mock browser environment for Three.js
global.document = global.document || {
  createElement: () => ({
    style: {},
    getBoundingClientRect: () => ({ top: 0, left: 0, width: 800, height: 600 })
  }),
  body: {
    appendChild: () => { }
  }
};

global.window = global.window || {
  innerWidth: 800,
  innerHeight: 600,
  addEventListener: () => { },
  removeEventListener: () => { },
  dispatchEvent: () => { },
  requestAnimationFrame: callback => setTimeout(callback, 0)
};

// Mock WebGL context
global.WebGLRenderingContext = jest.fn();

// Mock required for Three.js
global.HTMLCanvasElement.prototype.getContext = () => {
  return {
    createProgram: jest.fn(),
    createShader: jest.fn(),
    shaderSource: jest.fn(),
    compileShader: jest.fn(),
    getShaderParameter: jest.fn(() => true),
    getShaderInfoLog: jest.fn(),
    attachShader: jest.fn(),
    linkProgram: jest.fn(),
    getProgramParameter: jest.fn(() => true),
    getProgramInfoLog: jest.fn(),
    deleteProgram: jest.fn(),
    deleteShader: jest.fn(),
    viewport: jest.fn(),
    clearColor: jest.fn()
  };
};

// Avoid requestAnimationFrame errors
global.requestAnimationFrame = callback => setTimeout(callback, 0);