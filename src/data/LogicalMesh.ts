import * as THREE from 'three';
import { HalfedgeDS, Face, Vertex, Halfedge } from 'three-mesh-halfedge';

export class LogicalMesh {
    public struct: HalfedgeDS;
    constructor(struct: HalfedgeDS) { this.struct = struct; }

    /**
     * Creates a cube logical mesh with the specified size
     * 
     * @param size The size of the cube (default: 1.0)
     * @returns A new LogicalMesh representing a cube
     */
    static createCube(size: number = 1.0): LogicalMesh {
        const struct = new HalfedgeDS();
        const halfSize = size / 2;

        // Create the 8 vertices of the cube
        const v000 = struct.addVertex(new THREE.Vector3(-halfSize, -halfSize, -halfSize));
        const v100 = struct.addVertex(new THREE.Vector3(halfSize, -halfSize, -halfSize));
        const v110 = struct.addVertex(new THREE.Vector3(halfSize, halfSize, -halfSize));
        const v010 = struct.addVertex(new THREE.Vector3(-halfSize, halfSize, -halfSize));
        const v001 = struct.addVertex(new THREE.Vector3(-halfSize, -halfSize, halfSize));
        const v101 = struct.addVertex(new THREE.Vector3(halfSize, -halfSize, halfSize));
        const v111 = struct.addVertex(new THREE.Vector3(halfSize, halfSize, halfSize));
        const v011 = struct.addVertex(new THREE.Vector3(-halfSize, halfSize, halfSize));

        // Create edges for each face, we'll handle them one face at a time

        // Bottom face (y = -halfSize)
        const bottomHE1 = struct.addEdge(v000, v100);
        const bottomHE2 = struct.addEdge(v100, v101);
        const bottomHE3 = struct.addEdge(v101, v001);
        const bottomHE4 = struct.addEdge(v001, v000);
        struct.addFace([bottomHE1, bottomHE2, bottomHE3, bottomHE4]);

        // Front face (z = halfSize)
        const frontHE1 = struct.addEdge(v001, v101);
        const frontHE2 = struct.addEdge(v101, v111);
        const frontHE3 = struct.addEdge(v111, v011);
        const frontHE4 = struct.addEdge(v011, v001);
        struct.addFace([frontHE1, frontHE2, frontHE3, frontHE4]);

        // Right face (x = halfSize)
        const rightHE1 = struct.addEdge(v100, v110);
        const rightHE2 = struct.addEdge(v110, v111);
        const rightHE3 = struct.addEdge(v111, v101);
        const rightHE4 = struct.addEdge(v101, v100);
        struct.addFace([rightHE1, rightHE2, rightHE3, rightHE4]);

        // Back face (z = -halfSize)
        const backHE1 = struct.addEdge(v000, v010);
        const backHE2 = struct.addEdge(v010, v110);
        const backHE3 = struct.addEdge(v110, v100);
        const backHE4 = struct.addEdge(v100, v000);
        struct.addFace([backHE1, backHE2, backHE3, backHE4]);

        // Left face (x = -halfSize)
        const leftHE1 = struct.addEdge(v000, v001);
        const leftHE2 = struct.addEdge(v001, v011);
        const leftHE3 = struct.addEdge(v011, v010);
        const leftHE4 = struct.addEdge(v010, v000);
        struct.addFace([leftHE1, leftHE2, leftHE3, leftHE4]);

        // Top face (y = halfSize)
        const topHE1 = struct.addEdge(v010, v011);
        const topHE2 = struct.addEdge(v011, v111);
        const topHE3 = struct.addEdge(v111, v110);
        const topHE4 = struct.addEdge(v110, v010);
        struct.addFace([topHE1, topHE2, topHE3, topHE4]);

        return new LogicalMesh(struct);
    }

    /**
     * Creates a simple sphere logical mesh with the specified radius
     *
     * @param radius The radius of the sphere (default: 1.0)
     * @returns A new LogicalMesh representing a simple sphere
     */
    static createSphere(radius: number = 1.0): LogicalMesh {
        const struct = new HalfedgeDS();

        const t = (1.0 + Math.sqrt(5.0)) / 2.0;

        // Normalised vertices for an icosahedron
        const vertices: Vertex[] = [
            struct.addVertex(new THREE.Vector3(-1, t, 0).normalize().multiplyScalar(radius)),
            struct.addVertex(new THREE.Vector3(1, t, 0).normalize().multiplyScalar(radius)),
            struct.addVertex(new THREE.Vector3(-1, -t, 0).normalize().multiplyScalar(radius)),
            struct.addVertex(new THREE.Vector3(1, -t, 0).normalize().multiplyScalar(radius)),

            struct.addVertex(new THREE.Vector3(0, -1, t).normalize().multiplyScalar(radius)),
            struct.addVertex(new THREE.Vector3(0, 1, t).normalize().multiplyScalar(radius)),
            struct.addVertex(new THREE.Vector3(0, -1, -t).normalize().multiplyScalar(radius)),
            struct.addVertex(new THREE.Vector3(0, 1, -t).normalize().multiplyScalar(radius)),

            struct.addVertex(new THREE.Vector3(t, 0, -1).normalize().multiplyScalar(radius)),
            struct.addVertex(new THREE.Vector3(t, 0, 1).normalize().multiplyScalar(radius)),
            struct.addVertex(new THREE.Vector3(-t, 0, -1).normalize().multiplyScalar(radius)),
            struct.addVertex(new THREE.Vector3(-t, 0, 1).normalize().multiplyScalar(radius))
        ];

        // Define the faces of the icosahedron (20 triangular faces)
        const faces = [
            [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
            [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
            [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
            [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
        ];

        // Create faces by connecting vertices
        for (const face of faces) {
            const v1 = vertices[face[0]];
            const v2 = vertices[face[1]];
            const v3 = vertices[face[2]];

            const he1 = struct.addEdge(v1, v2);
            const he2 = struct.addEdge(v2, v3);
            const he3 = struct.addEdge(v3, v1);

            struct.addFace([he1, he2, he3]);
        }

        return new LogicalMesh(struct);
    }
}