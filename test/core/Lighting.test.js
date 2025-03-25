// tests/core/Lighting.test.js
import * as THREE from 'three';
import Scene from '../../src/core/Scene';

// We need to mock THREE and Scene before importing Lighting
// since it's a singleton that initializes on import
jest.mock('three', () => {
    const mockAmbientLight = { type: 'AmbientLight' };
    const mockDirectionalLight = {
        type: 'DirectionalLight',
        position: { set: jest.fn() }
    };

    return {
        AmbientLight: jest.fn(() => mockAmbientLight),
        DirectionalLight: jest.fn(() => mockDirectionalLight),
        mockAmbientLight,
        mockDirectionalLight
    };
});

jest.mock('../../src/core/Scene', () => ({
    addObject: jest.fn(),
}));

describe('Lighting', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    test('should initialise ambient and directional lights', () => {
        // Import Lighting after mocks are set up
        const Lighting = require('../../src/core/Lighting').default;

        // Since Lighting is a singleton, we don't need to create a new instance
        // Just verify the constructor effects have taken place

        // Verify AmbientLight was created with correct parameters
        expect(THREE.AmbientLight).toHaveBeenCalledWith(0xffffff, 0.5);

        // Verify DirectionalLight was created with correct parameters
        expect(THREE.DirectionalLight).toHaveBeenCalledWith(0xffffff, 1);

        // Verify the directional light position was set correctly
        expect(THREE.mockDirectionalLight.position.set).toHaveBeenCalledWith(10, 10, 10);

        // Verify both lights were added to the scene
        expect(Scene.addObject).toHaveBeenCalledTimes(2);
        expect(Scene.addObject).toHaveBeenCalledWith(THREE.mockAmbientLight);
        expect(Scene.addObject).toHaveBeenCalledWith(THREE.mockDirectionalLight);
    });
});
