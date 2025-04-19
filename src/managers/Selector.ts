import * as THREE from 'three';
import Camera from '../core/Camera';
import Renderer from '../core/Renderer';
import SceneGraphManager from './SceneGraphManager';

import { Halfedge, Vertex, HalfedgeDS, Face } from 'three-mesh-halfedge';

import { MeshWrapper } from './types';
import SceneGraph from './SceneGraph';

interface PickResult {
    pickedObject: THREE.Object3D;
    pickedElement: Vertex | Halfedge | Face | null;
    pivotPosition: THREE.Vector3 | null;
}

type SelectionMode = 'OBJECT' | 'VERTEX' | 'EDGE' | 'FACE';

class Selector {
    private selectionManager: any;
    private raycaster: THREE.Raycaster;
    private mouse: THREE.Vector2;
    
    constructor(selectionManager: any) {
        this.selectionManager = selectionManager;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }
    
    public pickElement(event: MouseEvent, selectionMode: SelectionMode): PickResult | null {
        // Get normalized device coordinates
        const rect = Renderer.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Set up raycaster
        this.raycaster.setFromCamera(this.mouse, Camera.camera);
        
        // Get intersections with objects in the scene
        const intersects = this.raycaster.intersectObjects(
            SceneGraph.getUnpackedSceneGraphObjects()
        );
        
        if (intersects.length === 0) {
            return null;
        }
        
        // Get the first intersection
        const intersect = intersects[0];
        const pickedObject = intersect.object;

        // Get the mesh wrapper from SceneGraphManager
        const meshWrapper = SceneGraph.getObjectById(pickedObject.uuid) as MeshWrapper;
        if (!meshWrapper) return null;
        
        let pickedElement: Vertex | Halfedge | Face | null = null;
        let pivotPosition: THREE.Vector3 | null = null;
        
        // Handle selection based on mode
        switch (selectionMode) {
            case 'OBJECT':
                // For object selection, return the object center as pivot
                pivotPosition = this.calculateObjectCenter(meshWrapper);
                break;
                
            case 'VERTEX':
                pickedElement = this.getNearestVertex(intersect.point, meshWrapper.heStruct.vertices);
                if (pickedElement) {
                    pivotPosition = pickedElement.position.clone();
                }
                break;
                
            case 'EDGE':
                pickedElement = this.getNearestEdge(intersect.point, meshWrapper.heStruct.halfedges);
                if (pickedElement) {
                    // Calculate edge midpoint
                    const v1 = pickedElement.vertex.position;
                    const v2 = pickedElement.next.vertex.position;
                    pivotPosition = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
                }
                break;
                
            case 'FACE':
                pickedElement = this.getIntersectedFace(intersect.faceIndex, meshWrapper.heStruct.faces);
                if (pickedElement) {
                    pivotPosition = this.calculateFaceCenter(pickedElement);
                }
                break;
        }
        
        return {
            pickedObject,
            pickedElement,
            pivotPosition
        };
    }
    
    private calculateObjectCenter(meshWrapper: MeshWrapper): THREE.Vector3 {
        const center = new THREE.Vector3();
        let count = 0;
        
        meshWrapper.heStruct.vertices.forEach(vertex => {
            center.add(vertex.position);
            count++;
        });
        
        if (count > 0) {
            center.divideScalar(count);
        }
        
        // Convert center to world space
        meshWrapper.object.localToWorld(center);
        
        return center;
    }
    
    private calculateFaceCenter(face: Face): THREE.Vector3 {
        const center = new THREE.Vector3();
        let count = 0;
        
        // Traverse the face's edges to collect vertices
        let startEdge = face.halfedge;
        let currentEdge = startEdge;
        
        do {
            center.add(currentEdge.vertex.position);
            count++;
            currentEdge = currentEdge.next;
        } while (currentEdge !== startEdge);
        
        if (count > 0) {
            center.divideScalar(count);
        }
        
        return center;
    }
    
    private getNearestVertex(point: THREE.Vector3, vertices: Array<Vertex>): Vertex | null {
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
    
    private getNearestEdge(point: THREE.Vector3, halfedges: Array<Halfedge>): Halfedge | null {
        if (!halfedges || halfedges.length === 0) return null;
        
        let minDist = Infinity;
        let closest: Halfedge | null = null;
        
        for (const halfedge of halfedges) {
            const v1 = halfedge.vertex.position;
            const v2 = halfedge.next.vertex.position;
            const dist = this.pointToSegmentDistance(point, v1, v2);
            
            if (dist < minDist) {
                minDist = dist;
                closest = halfedge;
            }
        }
        
        return closest;
    }
    
    private pointToSegmentDistance(point: THREE.Vector3, v1: THREE.Vector3, v2: THREE.Vector3): number {
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
    
    private getIntersectedFace(faceIndex: number, faces: Array<Face>): Face | null {
        if (!faces || faces.length === 0) return null;
        
        // For simple quad (or triangulated quad) meshes, determine the face from the face index in the intersection
        const triIndex = faceIndex;
        
        // Check if faceIndex exists (it should, but TypeScript needs this check)
        if (triIndex === undefined) return null;
        
        const faceId = Math.floor(triIndex / 2); // quads triangulated into 2 triangles
        
        return faces[faceId] || null;
    }
}

export default Selector;