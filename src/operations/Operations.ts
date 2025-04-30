import * as THREE from 'three';
import { HalfedgeDS, Face, Vertex, Halfedge } from 'three-mesh-halfedge';

/**
 * Extrudes a face and returns a new HalfedgeDS mesh (immutable).
 * @param originalMesh The original mesh.
 * @param face The face to extrude.
 * @param distance Distance along face normal.
 */
export function extrudeFace(originalMesh: HalfedgeDS, face: Face, distance: number): HalfedgeDS {
    const newMesh = new HalfedgeDS();

    // Step 1: Copy all original vertices
    const vertexMap = new Map<Vertex, Vertex>();
    for (const v of originalMesh.vertices) {
        const vNew = newMesh.addVertex(v.position.clone());
        vertexMap.set(v, vNew);
    }

    // Step 2: Copy all faces except the one being extruded
    for (const f of originalMesh.faces) {
        if (f === face) continue;
        const verts: Vertex[] = [];
        let e = f.halfedge;
        do {
            verts.push(vertexMap.get(e.vertex)!);
            e = e.next;
        } while (e !== f.halfedge);
        const edges = createFaceEdgesImmutable(newMesh, verts);
        newMesh.addFace(edges);
    }

    // Step 3: Extrude selected face — create completely new vertices for the base as well
    const originalBaseVerts: Vertex[] = [];
    let edge = face.halfedge;
    do {
        originalBaseVerts.push(edge.vertex); // original face vertices
        edge = edge.next;
    } while (edge !== face.halfedge);

    const baseVerts: Vertex[] = originalBaseVerts.map(v =>
        newMesh.addVertex(v.position.clone()) // ✅ Create new vertices even for base
    );

    const normal = new THREE.Vector3();
    face.getNormal(normal);

    const extrudedVerts: Vertex[] = baseVerts.map(v =>
        newMesh.addVertex(v.position.clone().addScaledVector(normal, distance)) // ✅ fresh extruded vertices
    );

    // Top face
    const topEdges = createFaceEdgesImmutable(newMesh, extrudedVerts);
    newMesh.addFace(topEdges);

    // Side faces
    const len = baseVerts.length;
    for (let i = 0; i < len; i++) {
        const v0 = baseVerts[i];
        const v1 = baseVerts[(i + 1) % len];
        const v2 = extrudedVerts[(i + 1) % len];
        const v3 = extrudedVerts[i];

        const side = [v0, v1, v2, v3];
        const edges = createFaceEdgesImmutable(newMesh, side);
        newMesh.addFace(edges);
    }

    // Bottom face (opposite orientation)
    const reversed = [...baseVerts].reverse();
    const bottomEdges = createFaceEdgesImmutable(newMesh, reversed);
    newMesh.addFace(bottomEdges);

    return newMesh;
}

function createFaceEdgesImmutable(mesh: HalfedgeDS, vertices: Vertex[]): Halfedge[] {
    const halfedges: Halfedge[] = [];

    for (let i = 0; i < vertices.length; i++) {
        const v1 = vertices[i];
        const v2 = vertices[(i + 1) % vertices.length];

        const edge = mesh.addEdge(v1, v2);
        if (!edge) {
            throw new Error(`Cannot create edge from vertex ${i} to ${i + 1} – not free`);
        }

        halfedges.push(edge);
    }

    for (let i = 0; i < halfedges.length; i++) {
        const current = halfedges[i];
        const next = halfedges[(i + 1) % halfedges.length];
        if (current.twin.vertex !== next.vertex) {
            throw new Error('Invalid edge chain: twin.vertex mismatch');
        }
    }

    return halfedges;
}
