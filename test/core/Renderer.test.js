// tests/core/Renderer.test.js
import * as THREE from 'three';

// Mock the THREE.WebGLRenderer and document.body.appendChild before importing Renderer
const mockWebGLRenderer = {
    setSize: jest.fn(),
    render: jest.fn(),
    domElement: document.createElement('canvas')
};

jest.mock('three', () => ({
    WebGLRenderer: jest.fn(() => mockWebGLRenderer)
}));

// Mock the document.body.appendChild method
document.body.appendChild = jest.fn();

describe('Renderer', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    test('should initialise with default properties', () => {
        // Import Renderer after mocks are set up
        const Renderer = require('../../src/core/Renderer').default;

        // Verify WebGLRenderer was created with antialiasing enabled
        expect(THREE.WebGLRenderer).toHaveBeenCalledWith({ antialias: true });

        // Verify setSize was called with window dimensions
        expect(mockWebGLRenderer.setSize).toHaveBeenCalledWith(window.innerWidth, window.innerHeight);

        // Verify renderer was added to the document body
        expect(document.body.appendChild).toHaveBeenCalledWith(mockWebGLRenderer.domElement);

        // Verify render method works
        const mockScene = {};
        const mockCamera = {};
        Renderer.render(mockScene, mockCamera);
        expect(mockWebGLRenderer.render).toHaveBeenCalledWith(mockScene, mockCamera);
    });
});