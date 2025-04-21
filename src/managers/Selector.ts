// Enhanced Selector.ts with proper coordinate transformations

import * as THREE from 'three';
import Camera from '../core/Camera';
import Renderer from '../core/Renderer';
import { Halfedge, Vertex, HalfedgeDS, Face } from 'three-mesh-halfedge';
import { MeshWrapper, SelectionMode } from './types';
import SceneGraph from './SceneGraph';
import UI from './UI';
import Transform from './Transform';
import { PickResult } from './types';
import Scene from '../core/Scene';

class Selector {
    private raycaster: THREE.Raycaster;
    private mouse: THREE.Vector2;
    private selectionMarker: THREE.Mesh | null = null;

    public isElementCurrentlySelected: boolean;
    public selectionMode: SelectionMode;
    public selectedElement: Vertex | Halfedge | Face | null;
    public currentMeshWrapper: MeshWrapper | null; // Current { object, heStruct, ... } from SceneGraph

    constructor() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectionMode = 'OBJECT';
        this.selectedElement = null;
        this.isElementCurrentlySelected = false;
    }

    /**
     * Selects an object and sets up the transform controls
     */
    public selectObject(object: THREE.Object3D): void {
        this.clearSelection();
        this.isElementCurrentlySelected = object !== null;
        this.currentMeshWrapper = SceneGraph.getObjectById(object.uuid) as MeshWrapper;
        
        if (!this.currentMeshWrapper) return;
        
        // Calculate the center point in world space
        const pivotPosition = this.calculateObjectCenter(this.currentMeshWrapper);

        // Make sure the object's matrices are up-to-date
        object.updateMatrixWorld(true);
        
        Transform.setupTransformControls("OBJECT", object, pivotPosition);
    }

    /**
     * Handles mouse click for selecting objects or elements
     */
    public handleMouseClick(event: MouseEvent): void {
        // Handle selection based on current mode
        if (this.selectionMode === 'OBJECT') {
            const result = this.getElementAtMousePosition(event, 'OBJECT');
            if (result && result.pickedObject) {
                this.selectObject(result.pickedObject);
            } else {
                this.clearSelection();
                Transform.detachControls();
            }
        } else {
            this.handleElementSelection(event);
        }
    }

    /**
     * Handles selection of vertices, edges, or faces
     */
    public handleElementSelection(event: MouseEvent): void {
        // Get element at mouse position based on current selection mode
        const pickResult = this.getElementAtMousePosition(event, this.selectionMode);
        
        if (!pickResult) {
            this.clearSelection();
            Transform.detachControls();
            return;
        }
        
        // Store the selected object and element
        this.currentMeshWrapper = SceneGraph.getObjectById(pickResult.pickedObject.uuid);
        this.selectedElement = pickResult.pickedElement;
        this.isElementCurrentlySelected = true;
        
        // Setup transform controls at the appropriate position
        if (pickResult.pivotPosition) {
            // Make sure the object's matrices are up to date
            pickResult.pickedObject.updateMatrixWorld(true);
            
            Transform.setupTransformControls(
                this.selectionMode, 
                pickResult.pickedObject, 
                pickResult.pivotPosition
            );
        }
    }

    /**
     * Gets the element at the current mouse position
     */
    public getElementAtMousePosition(event: MouseEvent, selectionMode: SelectionMode): PickResult | null {
        // Get normalized device coordinates
        const rect = Renderer.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Set up raycaster
        this.raycaster.setFromCamera(this.mouse, Camera.camera);

        // Get intersections with objects in the scene
        const intersects = this.raycaster.intersectObjects(
            SceneGraph.getUnpackedSceneGraphObjects(), true
        );

        // On hit nothing
        if (intersects.length === 0) return null;

        // Get the first intersection
        const intersect = intersects[0];
        const pickedObject = intersect.object;

        // Get the mesh wrapper from SceneGraph
        const meshWrapper = SceneGraph.getObjectById(pickedObject.uuid) as MeshWrapper;
        if (!meshWrapper) return null;

        let pickedElement: Vertex | Halfedge | Face | null = null;
        let pivotPosition: THREE.Vector3 | null = null;

        // Handle selection based on mode
        switch (selectionMode) {
            case 'OBJECT':
                pivotPosition = this.calculateObjectCenter(meshWrapper);
                break;

            case 'VERTEX':
                // Convert intersection point to local space for vertex comparison
                const localPoint = intersect.point.clone();
                pickedObject.worldToLocal(localPoint);
                
                pickedElement = this.getNearestVertex(localPoint, meshWrapper.heStruct.vertices);
                if (pickedElement) {
                    // Convert the vertex position back to world space for the transform controls
                    pivotPosition = pickedElement.position.clone();
                    pickedObject.localToWorld(pivotPosition);
                }
                break;

            case 'EDGE':
                // Convert intersection point to local space for edge comparison
                const localEdgePoint = intersect.point.clone();
                pickedObject.worldToLocal(localEdgePoint);
                
                pickedElement = this.getNearestEdge(localEdgePoint, meshWrapper.heStruct.halfedges);
                if (pickedElement) {
                    // Calculate edge midpoint in local space
                    const v1 = pickedElement.vertex.position;
                    const v2 = pickedElement.next.vertex.position;
                    pivotPosition = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
                    
                    // Convert to world space
                    pickedObject.localToWorld(pivotPosition);
                }
                break;

            case 'FACE':
                pickedElement = this.getIntersectedFace(intersect.faceIndex, meshWrapper.heStruct.faces);
                if (pickedElement) {
                    // Calculate face center in local space
                    pivotPosition = this.calculateFaceCenter(pickedElement);
                    
                    // Convert to world space
                    pickedObject.localToWorld(pivotPosition);
                }
                break;
        }

        return {
            pickedObject,
            pickedElement,
            pivotPosition
        };
    }

    /**
     * Calculates the center of an object in world space
     */
    private calculateObjectCenter(meshWrapper: MeshWrapper): THREE.Vector3 {
        const center = new THREE.Vector3();
        let count = 0;

        // Collect vertices in local space
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

    /**
     * Calculates the center of a face in local space
     */
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

    /**
     * Finds the nearest vertex to a point in local space
     */
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

    /**
     * Finds the nearest edge to a point in local space
     */
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

    /**
     * Calculates the distance from a point to a line segment
     */
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

    /**
     * Gets the face that corresponds to the intersected triangle
     */
    private getIntersectedFace(faceIndex: number, faces: Array<Face>): Face | null {
        if (!faces || faces.length === 0 || faceIndex === undefined) return null;

        // For simple quad (or triangulated quad) meshes, determine the face from the face index
        // This is a simplification and may need to be improved for complex meshes
        const faceId = Math.floor(faceIndex / 2); // assuming quads triangulated into 2 triangles
        
        if (faceId >= 0 && faceId < faces.length) {
            return faces[faceId];
        }
        
        return null;
    }

    /**
     * Clears the current selection
     */
    public clearSelection(): void {
        this.isElementCurrentlySelected = false;
        this.selectedElement = null;
        this.currentMeshWrapper = null;
        
        // Remove any visual selection markers
        if (this.selectionMarker) {
            Scene.scene.remove(this.selectionMarker);
            this.selectionMarker = null;
        }
    }
}

export default new Selector();