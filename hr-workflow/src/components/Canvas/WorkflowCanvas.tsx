import React, { useRef, useCallback, useEffect } from 'react';
import { ReactFlow, Background, Controls, MiniMap, ReactFlowProvider, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { StartNode, TaskNode, ApprovalNode, AutomatedNode, EndNode } from './CustomNodes';

const nodeTypes = {
    startNode: StartNode,
    taskNode: TaskNode,
    approvalNode: ApprovalNode,
    automatedNode: AutomatedNode,
    endNode: EndNode,
};

// We extract the actual canvas logic into a child component so it can use the useReactFlow hook
const FlowRenderer = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition } = useReactFlow();
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, setSelectedNodeId, selectedNodeId, saveHistory, undo, redo } = useWorkflowStore();

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Check for Cmd (Mac) or Ctrl (Windows/Linux)
            if (event.metaKey || event.ctrlKey) {
                if (event.key === 'z') {
                    if (event.shiftKey) {
                        event.preventDefault();
                        redo();
                    } else {
                        event.preventDefault();
                        undo();
                    }
                } else if (event.key === 'y') {
                    event.preventDefault();
                    redo();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            const type = event.dataTransfer.getData('application/reactflow');
            if (!type) return;

            // Calculate the exact drop position accounting for zoom and pan
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            addNode(type, position);
        },
        [screenToFlowPosition, addNode]
    );

    return (
        <div className="h-full w-full bg-slate-50" ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                onPaneClick={() => setSelectedNodeId(null)}
                onNodeDragStart={() => saveHistory()}
                deleteKeyCode={['Backspace', 'Delete']}
                onNodesDelete={(deletedNodes) => {
                    saveHistory();
                    if (deletedNodes.some(n => n.id === selectedNodeId)) {
                        setSelectedNodeId(null);
                    }
                }}
                onEdgesDelete={() => saveHistory()}
                fitView
            >

                <Background color="#cbd5e1" gap={20} />
                <Controls />
                <MiniMap />
            </ReactFlow>
        </div>
    );
};

// Wrap it in the provider
export const WorkflowCanvas = () => (
    <ReactFlowProvider>
        <FlowRenderer />
    </ReactFlowProvider>
);