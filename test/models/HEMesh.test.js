// src/__tests__/models/HEMesh.test.js
import * as THREE from 'three';
import HEMesh from '../../src/models/HEMesh';

jest.mock('three', () => {
    const originalModule = jest.requireActual('three');
    return {
        ...originalModule,
        BufferGeometry: jest.fn().mockImplementation(() => ({
            setAttribute: jest.fn(),
            computeVertexNormals: jest.fn()
        })),
        Float32BufferAttribute: jest.fn().mockImplementation(() => ({})),
        LineBasicMaterial: jest.fn().mockImplementation(() => ({})),
        LineSegments: jest.fn().mockImplementation(() => ({
            raycast: jest.fn()
        }))
    };
});

describe('HEMesh', () => {
    let mesh;

    beforeEach(() => {
        mesh = new HEMesh();
    });

    test('initialises with empty arrays', () => {
        expect(mesh.vertices).toEqual([]);
        expect(mesh.edges).toEqual([]);
        expect(mesh.faces).toEqual([]);
    });

    test('createBox creates correct number of vertices, edges, and faces', () => {
        mesh.createBox();

        // A cube has 8 vertices
        expect(mesh.vertices.length).toBe(8);

        // A cube has 24 half-edges (12 edges, each with 2 half-edges)
        expect(mesh.edges.length).toBe(24);

        // A cube has 6 faces
        expect(mesh.faces.length).toBe(6);
    });

    test('createVertex adds a new vertex with correct position', () => {
        const x = 1, y = 2, z = 3;
        const vertex = mesh.createVertex(x, y, z);

        expect(mesh.vertices).toContain(vertex);
        expect(vertex.position.x).toBe(x);
        expect(vertex.position.y).toBe(y);
        expect(vertex.position.z).toBe(z);
    });

    test('toBufferGeometry returns THREE.BufferGeometry', () => {
        mesh.createBox(); // Create some geometry first
        const geom = mesh.toBufferGeometry();

        expect(THREE.BufferGeometry).toHaveBeenCalled();
        expect(THREE.Float32BufferAttribute).toHaveBeenCalledTimes(2); // For positions and normals
    });
});
