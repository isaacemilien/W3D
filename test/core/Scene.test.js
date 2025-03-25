// src/__tests__/core/Scene.test.js
import * as THREE from 'three';
import Scene from '../../src/core/Scene';

jest.mock('three', () => {
    const originalModule = jest.requireActual('three');
    return {
        ...originalModule,
        Scene: jest.fn().mockImplementation(() => ({
            add: jest.fn(),
            remove: jest.fn(),
            background: null
        }))
    };
});

describe('Scene', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    test('initialises with correct background colour', () => {
        // Re-create Scene to trigger constructor again
        const testScene = new Scene.constructor();
        expect(testScene.scene.background).toBeDefined();
        // Check if the background is set (colour value might vary)
        expect(testScene.scene.background).not.toBeNull();
    });

    test('addObject adds an object to the scene', () => {
        const mockObject = new THREE.Object3D();
        Scene.addObject(mockObject);
        expect(Scene.scene.add).toHaveBeenCalledWith(mockObject);
    });

    test('removeObject removes an object from the scene', () => {
        const mockObject = new THREE.Object3D();
        Scene.removeObject(mockObject);
        expect(Scene.scene.remove).toHaveBeenCalledWith(mockObject);
    });
});