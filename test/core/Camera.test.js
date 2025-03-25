// src/__tests__/core/Camera.test.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Camera from '../../src/core/Camera';

jest.mock('three', () => {
    return {
        PerspectiveCamera: jest.fn().mockImplementation(() => ({
            position: { set: jest.fn() },
            updateProjectionMatrix: jest.fn()
        })),
        Vector3: jest.requireActual('three').Vector3
    };
});

jest.mock('three/examples/jsm/controls/OrbitControls.js', () => {
    return {
        OrbitControls: jest.fn().mockImplementation(() => ({
            update: jest.fn(),
            enableDamping: false
        }))
    };
});

describe('Camera', () => {
    test('initialises with correct parameters', () => {
        const camera = new Camera.constructor();

        // Check if PerspectiveCamera was created with correct parameters
        expect(THREE.PerspectiveCamera).toHaveBeenCalledWith(
            75, // FOV
            expect.any(Number), // aspect ratio
            0.1, // near plane
            1000 // far plane
        );

        // Check if camera position is set
        expect(camera.camera.position.set).toHaveBeenCalledWith(0, 5, 10);
    });

    test('update method calls controls update', () => {
        Camera.update();
        expect(Camera.controls.update).toHaveBeenCalled();
    });
});