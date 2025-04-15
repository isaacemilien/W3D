import * as THREE from 'three';
import { HalfedgeDS, Face, Vertex } from 'three-mesh-halfedge';

class Queries {
    /**
     * Collects the ordered vertices around a face by traversing its half-edges.
     */
    getFaceVertices(face: Face): Vertex[] {
        const vertices: Vertex[] = [];
        let start = face.halfedge;
        let edge = start;

        do {
            vertices.push(edge.vertex);
            edge = edge.next;
        } while (edge !== start);

        return vertices;
    }

    /**
     * Converts a HalfedgeDS structure into a THREE.BufferGeometry.
     */
    halfedgeToGeometry(struct: HalfedgeDS): THREE.BufferGeometry {
        const positions: number[] = [];
        const indices: number[] = [];

        // Map vertices to indices and collect positions
        const vertexMap = new Map<Vertex, number>();
        let index = 0;

        for (const vertex of struct.vertices) {
            vertexMap.set(vertex, index++);
            const v = vertex.position;
            positions.push(v.x, v.y, v.z);
        }

        // Triangulate each face using fan triangulation
        for (const face of struct.faces) {
            const verts = this.getFaceVertices(face);
            if (verts.length < 3) continue;

            const a = vertexMap.get(verts[0]);
            for (let i = 1; i < verts.length - 1; i++) {
                const b = vertexMap.get(verts[i]);
                const c = vertexMap.get(verts[i + 1]);

                if (a !== undefined && b !== undefined && c !== undefined) {
                    indices.push(a, b, c);
                }
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        return geometry;
    }

}

export default new Queries();