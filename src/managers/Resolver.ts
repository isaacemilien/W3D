import * as THREE from 'three';
import SceneGraph from './SceneGraph';
import { Halfedge, Vertex, HalfedgeDS, Face } from 'three-mesh-halfedge';
import { PickResult, SelectionMode } from './types';
import { Wrapper } from './types';

export class Resolver {
    public getTarget(hit: THREE.Intersection, mode: SelectionMode): PickResult | null {
        const pickedObject = hit.object;
        const wrapper = SceneGraph.getObjectById(pickedObject.uuid);
        if (!wrapper) return null;

        // Convert intersect.point → local space
        const localPoint = pickedObject.worldToLocal(hit.point.clone());

        switch (mode) {
            case 'VERTEX':
                const v = getNearestVertex(localPoint, wrapper.logical.struct.vertices);
                return v ? {
                    pickedObject,
                    pickedElement: v,
                    pivotPosition: pickedObject.localToWorld(v.position.clone()),
                    wrapper
                } : null;

            // need edge, vertex later
        }

        return {
            pickedObject,
            pickedElement: null,
            pivotPosition: calculateObjectCenter(wrapper),
            wrapper
        };
    }
}


/**
 * Finds the nearest vertex to a point in local space
 */
function getNearestVertex(point: THREE.Vector3, vertices: Array<Vertex>): Vertex | null {
    if (!vertices || vertices.length === 0) return null;

    let minDist = Infinity;
    let closest: Vertex | null = null;

    for (const vertex of vertices) {
        const dist = vertex.position.distanceTo(point);
        if (dist < minDist) {
            minDist = dist;
            closest = vertex;
        }
    }

    return closest;
}


/**
 * Finds the nearest edge to a point in local space
 */
function getNearestEdge(point: THREE.Vector3, halfedges: Array<Halfedge>): Halfedge | null {
    if (!halfedges || halfedges.length === 0) return null;

    let minDist = Infinity;
    let closest: Halfedge | null = null;

    for (const halfedge of halfedges) {
        // Only process each edge once (skip duplicate twin edges)
        if (halfedge.twin && halfedge.twin.vertex.id < halfedge.vertex.id) continue;

        // Get the vertices that define this edge
        const v1 = halfedge.vertex.position;
        const v2 = halfedge.twin.vertex.position;

        // Calculate distance from point to this edge
        const dist = pointToSegmentDistance(point, v1, v2);

        if (dist < minDist) {
            minDist = dist;
            closest = halfedge;
        }
    }

    // Apply a reasonable threshold
    const threshold = 0.1;
    return minDist < threshold ? closest : null;
}

/**
 * Calculates the center of an object in world space
 */
function calculateObjectCenter(wrapper: Wrapper): THREE.Vector3 {
    const center = new THREE.Vector3();
    let count = 0;

    // Collect vertices in local space
    wrapper.logical.struct.vertices.forEach(vertex => {
        center.add(vertex.position);
        count++;
    });

    if (count > 0) {
        center.divideScalar(count);
    }

    // Convert center to world space
    wrapper.render.mesh.localToWorld(center);

    return center;
}

/**
 * Calculates the distance from a point to a line segment
 */
function pointToSegmentDistance(point: THREE.Vector3, v1: THREE.Vector3, v2: THREE.Vector3): number {
    const segmentVector = new THREE.Vector3().subVectors(v2, v1);
    const pointVector = new THREE.Vector3().subVectors(point, v1);

    // Calculate projection coefficient
    const projCoeff = Math.max(0, Math.min(1,
        pointVector.dot(segmentVector) / segmentVector.lengthSq()
    ));

    // Calculate closest point on the segment
    const closestPoint = new THREE.Vector3().copy(v1)
        .addScaledVector(segmentVector, projCoeff);

    // Return distance to the closest point
    return closestPoint.distanceTo(point);
}