import * as THREE from 'three';
import SceneGraph from './SceneGraph';
import { Halfedge, Vertex, Face } from 'three-mesh-halfedge';
import { PickResult, SelectionMode } from './types';
import { Wrapper } from './types';

export class Resolver {
    /**
     * Get target element based on raycaster hit and selection mode
     */
    public getTarget(hit: THREE.Intersection, mode: SelectionMode): PickResult | null {
        const pickedObject = hit.object;
        const wrapper = SceneGraph.getObjectById(pickedObject.uuid);
        if (!wrapper) return null;

        // Convert intersect.point to local space
        const localPoint = pickedObject.worldToLocal(hit.point.clone());
        let pickedElement: Vertex | Halfedge | Face | null = null;
        let pivotPosition: THREE.Vector3 | null = null;

        switch (mode) {
            case 'OBJECT':
                // For object selection, use the object's center as pivot
                pivotPosition = calculateObjectCenter(wrapper);
                break;
                
            case 'VERTEX':
                // Find the nearest vertex to the hit point
                pickedElement = getNearestVertex(localPoint, wrapper.logical.struct.vertices);
                if (pickedElement) {
                    // Convert the vertex position to world space for the transform controls
                    pivotPosition = pickedObject.localToWorld(
                        (pickedElement as Vertex).position.clone()
                    );
                }
                break;
                
            case 'EDGE':
                // Find the nearest edge to the hit point
                pickedElement = getNearestEdge(localPoint, wrapper.logical.struct.halfedges);
                if (pickedElement) {
                    // Calculate edge midpoint in local space
                    const halfedge = pickedElement as Halfedge;
                    const v1 = halfedge.vertex.position;
                    const v2 = halfedge.twin.vertex.position;
                    
                    pivotPosition = pickedObject.localToWorld(
                        new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5)
                    );
                }
                break;
                
            case 'FACE':
                // Find the face that contains the hit point
                pickedElement = getFaceFromHit(hit, wrapper);
                if (pickedElement) {
                    // Calculate face center in local space
                    pivotPosition = calculateFaceCenter(pickedElement as Face);
                    // Convert to world space
                    pickedObject.localToWorld(pivotPosition);
                }
                break;
        }

        return {
            pickedObject,
            pickedElement,
            pivotPosition,
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

    // Only return the vertex if it's within a reasonable distance threshold
    const threshold = 0.2; // Adjust as needed
    return minDist < threshold ? closest : null;
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
        if (halfedge.twin && halfedge.vertex.id > halfedge.twin.vertex.id) continue;

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
 * Find face from hit information
 */
function getFaceFromHit(hit: THREE.Intersection, wrapper: Wrapper): Face | null {
    // If we have a face index from the raycaster hit
    if (hit.faceIndex !== undefined) {
        const faceIndex = hit.faceIndex;
        const localPoint = hit.point.clone();
        hit.object.worldToLocal(localPoint);
        
        // Try to find the face by testing which face contains the hit point
        for (const face of wrapper.logical.struct.faces) {
            // This is a simple proximity check
            // For more accurate results, implement a point-in-face test
            const center = calculateFaceCenter(face);
            if (center.distanceTo(localPoint) < 0.5) {
                return face;
            }
        }
    }
    
    return null;
}

/**
 * Calculate center of a face
 */
function calculateFaceCenter(face: Face): THREE.Vector3 {
    const center = new THREE.Vector3();
    let count = 0;

    // Start from the face's halfedge
    let currentHalfedge = face.halfedge;
    const startHalfedge = currentHalfedge;
    
    do {
        center.add(currentHalfedge.vertex.position);
        count++;
        currentHalfedge = currentHalfedge.next;
    } while (currentHalfedge !== startHalfedge);

    if (count > 0) {
        center.divideScalar(count);
    }

    return center;
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
    const segmentLengthSq = segmentVector.lengthSq();
    
    // Handle degenerate case
    if (segmentLengthSq === 0) return pointVector.length();
    
    const projCoeff = Math.max(0, Math.min(1,
        pointVector.dot(segmentVector) / segmentLengthSq
    ));

    // Calculate closest point on the segment
    const closestPoint = new THREE.Vector3().copy(v1)
        .addScaledVector(segmentVector, projCoeff);

    // Return distance to the closest point
    return closestPoint.distanceTo(point);
}