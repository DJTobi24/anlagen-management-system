import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  ChevronRightIcon, 
  ChevronDownIcon,
  FolderIcon,
  FolderOpenIcon,
  WrenchScrewdriverIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { aksService } from '../services/aksService';
import { AksCode } from '../types/aks';

interface TreeNode extends AksCode {
  hasChildren?: boolean;
  children?: TreeNode[];
  isExpanded?: boolean;
}

interface AksTreeViewProps {
  onSelectNode?: (node: TreeNode) => void;
  selectedNodeId?: string;
}

const AksTreeView: React.FC<AksTreeViewProps> = ({ onSelectNode, selectedNodeId }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  // Fetch root level nodes (AKS.XX codes)
  const { data: rootNodes, isLoading, error } = useQuery(
    ['aks-tree-root'],
    () => aksService.getAksTree(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      select: (data) => {
        // All nodes can potentially have children based on code structure
        return data.map(node => ({
          ...node,
          hasChildren: true, // Assume all codes can have children
          level: (node.code.match(/\./g) || []).length // Determine level by counting dots
        }));
      }
    }
  );

  const toggleNode = (nodeCode: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeCode)) {
      newExpanded.delete(nodeCode);
    } else {
      newExpanded.add(nodeCode);
    }
    setExpandedNodes(newExpanded);
  };

  const getNodeIcon = (node: TreeNode, isExpanded: boolean) => {
    // Determine icon based on code level
    const dotCount = (node.code.match(/\./g) || []).length;
    
    if (dotCount === 1) {
      // Top level (AKS.XX) - main categories
      return isExpanded ? 
        <FolderOpenIcon className="h-5 w-5 text-blue-500" /> :
        <FolderIcon className="h-5 w-5 text-blue-600" />;
    } else if (dotCount === 2) {
      // Second level (AKS.XX.XXX) - subcategories
      return isExpanded ? 
        <FolderOpenIcon className="h-5 w-5 text-amber-500" /> :
        <FolderIcon className="h-5 w-5 text-amber-600" />;
    } else {
      // Third level and deeper - equipment/items
      return <WrenchScrewdriverIcon className="h-4 w-4 text-indigo-600" />;
    }
  };

  const getNodeStyles = (node: TreeNode, depth: number, isSelected: boolean, isExpanded: boolean) => {
    const baseClasses = "group flex items-center py-2.5 px-3 cursor-pointer transition-all duration-150 ease-in-out rounded-lg mx-1 my-0.5";
    const paddingLeft = depth * 24 + 8;
    
    let bgClasses = "";
    let borderClasses = "";
    
    if (isSelected) {
      bgClasses = "bg-gradient-to-r from-indigo-100 to-indigo-50 border-l-4 border-indigo-500";
    } else {
      bgClasses = "hover:bg-gray-50 hover:shadow-sm";
    }

    // Different styling based on level
    if (node.level === 1) {
      borderClasses = "border-l-2 border-transparent hover:border-blue-300";
    }

    return {
      className: `${baseClasses} ${bgClasses} ${borderClasses}`,
      style: { paddingLeft: `${paddingLeft}px` }
    };
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.code);
    const isSelected = selectedNodeId === node.id;
    const nodeStyles = getNodeStyles(node, depth, isSelected, isExpanded);

    return (
      <div key={node.id} className="select-none">
        {/* Connection lines for hierarchy */}
        {depth > 0 && (
          <div className="relative">
            <div 
              className="absolute border-l border-gray-200" 
              style={{
                left: `${depth * 24 - 8}px`,
                top: '0px',
                height: '100%',
                width: '1px'
              }}
            />
            <div 
              className="absolute border-t border-gray-200" 
              style={{
                left: `${depth * 24 - 8}px`,
                top: '20px',
                width: '16px',
                height: '1px'
              }}
            />
          </div>
        )}

        <div
          className={nodeStyles.className}
          style={nodeStyles.style}
          onClick={() => onSelectNode?.(node)}
        >
          {/* Expand/Collapse Icon */}
          <div className="w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
            {node.hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.code);
                }}
                className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-colors duration-150"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-4 h-4" />
            )}
          </div>

          {/* Node Icon */}
          <div className="mr-3 flex-shrink-0">
            {getNodeIcon(node, isExpanded)}
          </div>

          {/* Node Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                {/* Node Name */}
                <div className={`font-medium truncate ${
                  node.level === 1 ? 'text-base text-gray-900' :
                  node.level === 2 ? 'text-sm text-gray-800' :
                  'text-sm text-gray-700'
                }`}>
                  {node.name}
                </div>
                
                {/* Node Code and Level Badge */}
                <div className="flex items-center mt-1 space-x-2">
                  <span className="text-xs font-mono text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded">
                    {node.code}
                  </span>
                  
                  {node.level && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                      Ebene {node.level}
                    </span>
                  )}
                  
                </div>
              </div>
              
              {/* Status Indicators */}
              <div className="flex items-center space-x-2 ml-4">
                {/* Maintenance Indicator */}
                {node.maintenanceIntervalMonths && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <span className="text-xs text-gray-600 font-medium">
                      {node.maintenanceIntervalMonths}M
                    </span>
                  </div>
                )}
                
                {/* Children indicator - show only for folders */}
                {node.hasChildren && node.level && node.level < 4 && (
                  <span className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded-full font-medium">
                    {isExpanded ? '−' : '+'}
                  </span>
                )}

                {/* Actions Menu */}
                <button 
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-100 rounded-md transition-all duration-150"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Show context menu
                  }}
                >
                  <EllipsisHorizontalIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Children */}
        {isExpanded && node.hasChildren && (
          <div className="relative">
            <NodeChildren 
              nodeCode={node.code} 
              depth={depth + 1}
              onSelectNode={onSelectNode}
              selectedNodeId={selectedNodeId}
              expandedNodes={expandedNodes}
              setExpandedNodes={setExpandedNodes}
            />
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Lade AKS-Hierarchie...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-600 font-medium mb-2">Fehler beim Laden</div>
          <p className="text-sm text-red-700">
            Die AKS-Struktur konnte nicht geladen werden. Bitte versuchen Sie es erneut.
          </p>
        </div>
      </div>
    );
  }

  if (!rootNodes || rootNodes.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
          <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-600 font-medium mb-2">Keine AKS-Codes gefunden</div>
          <p className="text-sm text-gray-500">
            Es sind noch keine AKS-Codes in der Hierarchie vorhanden.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      <div className="p-4 space-y-1">
        {rootNodes.map(node => renderNode(node as TreeNode))}
      </div>
    </div>
  );
};

// Component to load and render children of a node
const NodeChildren: React.FC<{ 
  nodeCode: string; 
  depth: number; 
  onSelectNode?: (node: TreeNode) => void;
  selectedNodeId?: string;
  expandedNodes: Set<string>;
  setExpandedNodes: React.Dispatch<React.SetStateAction<Set<string>>>;
}> = ({ nodeCode, depth, onSelectNode, selectedNodeId, expandedNodes, setExpandedNodes }) => {
  const { data: children, isLoading } = useQuery(
    ['aks-tree-children', nodeCode],
    () => aksService.getAksTree(nodeCode),
    {
      staleTime: 5 * 60 * 1000,
      select: (data) => {
        // Determine if nodes can have children based on code structure
        return data.map(node => ({
          ...node,
          hasChildren: true, // Most codes can have children except the deepest level
          level: (node.code.match(/\./g) || []).length
        }));
      }
    }
  );

  const toggleNode = (childNodeCode: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(childNodeCode)) {
      newExpanded.delete(childNodeCode);
    } else {
      newExpanded.add(childNodeCode);
    }
    setExpandedNodes(newExpanded);
  };

  const getNodeIcon = (node: TreeNode, isExpanded: boolean) => {
    // Determine icon based on code level
    const dotCount = (node.code.match(/\./g) || []).length;
    
    if (dotCount === 1) {
      // Top level (AKS.XX) - main categories
      return isExpanded ? 
        <FolderOpenIcon className="h-5 w-5 text-blue-500" /> :
        <FolderIcon className="h-5 w-5 text-blue-600" />;
    } else if (dotCount === 2) {
      // Second level (AKS.XX.XXX) - subcategories
      return isExpanded ? 
        <FolderOpenIcon className="h-5 w-5 text-amber-500" /> :
        <FolderIcon className="h-5 w-5 text-amber-600" />;
    } else {
      // Third level and deeper - equipment/items
      return <WrenchScrewdriverIcon className="h-4 w-4 text-indigo-600" />;
    }
  };

  const getNodeStyles = (node: TreeNode, depth: number, isSelected: boolean, isExpanded: boolean) => {
    const baseClasses = "group flex items-center py-2.5 px-3 cursor-pointer transition-all duration-150 ease-in-out rounded-lg mx-1 my-0.5";
    const paddingLeft = depth * 24 + 8;
    
    let bgClasses = "";
    let borderClasses = "";
    
    if (isSelected) {
      bgClasses = "bg-gradient-to-r from-indigo-100 to-indigo-50 border-l-4 border-indigo-500";
    } else {
      bgClasses = "hover:bg-gray-50 hover:shadow-sm";
    }

    if (node.level === 1) {
      borderClasses = "border-l-2 border-transparent hover:border-blue-300";
    }

    return {
      className: `${baseClasses} ${bgClasses} ${borderClasses}`,
      style: { paddingLeft: `${paddingLeft}px` }
    };
  };

  const renderChildNode = (node: TreeNode) => {
    const isExpanded = expandedNodes.has(node.code);
    const isSelected = selectedNodeId === node.id;
    const nodeStyles = getNodeStyles(node, depth, isSelected, isExpanded);

    return (
      <div key={node.id} className="select-none">
        {/* Connection lines for hierarchy */}
        {depth > 0 && (
          <div className="relative">
            <div 
              className="absolute border-l border-gray-200" 
              style={{
                left: `${depth * 24 - 8}px`,
                top: '0px',
                height: '100%',
                width: '1px'
              }}
            />
            <div 
              className="absolute border-t border-gray-200" 
              style={{
                left: `${depth * 24 - 8}px`,
                top: '20px',
                width: '16px',
                height: '1px'
              }}
            />
          </div>
        )}

        <div
          className={nodeStyles.className}
          style={nodeStyles.style}
          onClick={() => onSelectNode?.(node)}
        >
          {/* Expand/Collapse Icon */}
          <div className="w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
            {node.hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.code);
                }}
                className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-colors duration-150"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-4 h-4" />
            )}
          </div>

          {/* Node Icon */}
          <div className="mr-3 flex-shrink-0">
            {getNodeIcon(node, isExpanded)}
          </div>

          {/* Node Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                {/* Node Name */}
                <div className={`font-medium truncate ${
                  node.level === 1 ? 'text-base text-gray-900' :
                  node.level === 2 ? 'text-sm text-gray-800' :
                  'text-sm text-gray-700'
                }`}>
                  {node.name}
                </div>
                
                {/* Node Code and Level Badge */}
                <div className="flex items-center mt-1 space-x-2">
                  <span className="text-xs font-mono text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded">
                    {node.code}
                  </span>
                  
                  {node.level && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                      Ebene {node.level}
                    </span>
                  )}
                  
                </div>
              </div>
              
              {/* Status Indicators */}
              <div className="flex items-center space-x-2 ml-4">
                {/* Maintenance Indicator */}
                {node.maintenanceIntervalMonths && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <span className="text-xs text-gray-600 font-medium">
                      {node.maintenanceIntervalMonths}M
                    </span>
                  </div>
                )}
                
                {/* Children indicator - show only for folders */}
                {node.hasChildren && node.level && node.level < 4 && (
                  <span className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded-full font-medium">
                    {isExpanded ? '−' : '+'}
                  </span>
                )}

                {/* Actions Menu */}
                <button 
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-100 rounded-md transition-all duration-150"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Show context menu
                  }}
                >
                  <EllipsisHorizontalIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Grandchildren */}
        {isExpanded && node.hasChildren && (
          <div className="relative">
            <NodeChildren 
              nodeCode={node.code} 
              depth={depth + 1}
              onSelectNode={onSelectNode}
              selectedNodeId={selectedNodeId}
              expandedNodes={expandedNodes}
              setExpandedNodes={setExpandedNodes}
            />
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="py-3" style={{ paddingLeft: `${depth * 24 + 32}px` }}>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <div className="animate-spin h-3 w-3 border border-gray-300 border-t-gray-600 rounded-full"></div>
          <span>Lade Unterelemente...</span>
        </div>
      </div>
    );
  }

  if (!children || children.length === 0) {
    return null;
  }

  return (
    <>
      {children.map(child => renderChildNode(child as TreeNode))}
    </>
  );
};

export default AksTreeView;