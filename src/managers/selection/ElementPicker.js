// src/managers/selection/ElementPicker.js
import * as THREE from 'three';
import Camera from '../../core/Camera';
import Renderer from '../../core/Renderer';
import SceneGraphManager from '../SceneGraphManager';

class ElementPicker {
    constructor(selectionManager) {
        this.selectionManager = selectionManager;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }
    
    pickElement(event, selectionMode) {
        // Get normalized device coordinates
        const rect = Renderer.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Set up raycaster
        this.raycaster.setFromCamera(this.mouse, Camera.camera);
        
        // Get intersections with objects in the scene
        const intersects = this.raycaster.intersectObjects(
            SceneGraphManager.getUnpackedSceneGraphObjects()
        );
        
        if (intersects.length === 0) {
            return null;
        }
        
        // Get the first intersection
        const intersect = intersects[0];
        const pickedObject = intersect.object;
        
        // Get the mesh wrapper from SceneGraphManager
        const meshWrapper = SceneGraphManager.objects.get(pickedObject.uuid);
        if (!meshWrapper) return null;
        
        let pickedElement = null;
        let pivotPosition = null;
        
        // Handle selection based on mode
        switch (selectionMode) {
            case 'OBJECT':
                // For object selection, return the object center as pivot
                pivotPosition = this.calculateObjectCenter(meshWrapper);
                break;
                
            case 'VERTEX':
                pickedElement = this.getNearestVertex(intersect.point, meshWrapper.heMesh.vertices);
                if (pickedElement) {
                    pivotPosition = pickedElement.position.clone();
                }
                break;
                
            case 'EDGE':
                pickedElement = this.getNearestEdge(intersect.point, meshWrapper.heMesh.edges);
                if (pickedElement) {
                    // Calculate edge midpoint
                    const v1 = pickedElement.vertex.position;
                    const v2 = pickedElement.next.vertex.position;
                    pivotPosition = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
                }
                break;
                
            case 'FACE':
                pickedElement = this.getIntersectedFace(intersect, meshWrapper.heMesh.faces);
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
    
    calculateObjectCenter(meshWrapper) {
        const center = new THREE.Vector3();
        let count = 0;
        
        meshWrapper.heMesh.vertices.forEach(vertex => {
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
    
    calculateFaceCenter(face) {
        const center = new THREE.Vector3();
        let count = 0;
        
        // Traverse the face's edges to collect vertices
        let startEdge = face.edge;
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
    
    getNearestVertex(point, vertices) {
        if (!vertices || vertices.length === 0) return null;
        
        let minDist = Infinity;
        let closest = null;
        
        for (const vertex of vertices) {
            const dist = vertex.position.distanceTo(point);
            if (dist < minDist) {
                minDist = dist;
                closest = vertex;
            }
        }
        
        return closest;
    }
    
    getNearestEdge(point, edges) {
        if (!edges || edges.length === 0) return null;
        
        let minDist = Infinity;
        let closest = null;
        
        for (const edge of edges) {
            const v1 = edge.vertex.position;
            const v2 = edge.next.vertex.position;
            const dist = this.pointToSegmentDistance(point, v1, v2);
            
            if (dist < minDist) {
                minDist = dist;
                closest = edge;
            }
        }
        
        return closest;
    }
    
    pointToSegmentDistance(point, v1, v2) {
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
    
    getIntersectedFace(intersect, faces) {
        if (!faces || faces.length === 0) return null;
        
        // For simple quad (or triangulated quad) meshes, determine the face from the face index in the intersection
        const triIndex = intersect.faceIndex;
        const faceId = Math.floor(triIndex / 2); // quads triangulated into 2 triangles
        
        return faces[faceId] || null;
    }
}

export default ElementPicker;