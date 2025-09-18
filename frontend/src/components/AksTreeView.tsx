import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  ChevronRightIcon, 
  ChevronDownIcon,
  FolderIcon,
  FolderOpenIcon,
  CubeIcon,
  WrenchScrewdriverIcon,
  Cog6ToothIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon
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
  onEditNode?: (node: TreeNode) => void;
  onDeleteNode?: (node: TreeNode) => void;
  onAddChild?: (parentNode: TreeNode) => void;
  selectedNodeId?: string;
}

const AksTreeView: React.FC<AksTreeViewProps> = ({ 
  onSelectNode, 
  onEditNode,
  onDeleteNode,
  onAddChild,
  selectedNodeId 
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  // Fetch root level nodes (AKS.XX codes)
  const { data: rootNodes, isLoading, error } = useQuery(
    ['aks-tree-root'],
    () => aksService.getAksTree(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      select: (data) => {
        return data.map(node => ({
          ...node,
          hasChildren: true,
          level: (node.code.match(/\./g) || []).length
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

  const getNodeIcon = (node: TreeNode) => {
    const dotCount = (node.code.match(/\./g) || []).length;
    
    // Determine if this is an Anlage (equipment) - typically at level 4 (AKS.XX.XXX.XX.XX)
    const isAnlage = dotCount >= 4 || (node.name && node.name.toLowerCase().includes('anlage'));
    
    if (isAnlage) {
      // This is an Anlage (equipment/asset)
      return <Cog6ToothIcon className="h-4 w-4 text-green-600" />;
    } else if (dotCount === 1) {
      // Top level (AKS.XX) - main categories
      return <FolderIcon className="h-4 w-4 text-blue-600" />;
    } else if (dotCount === 2) {
      // Second level (AKS.XX.XXX) - subcategories
      return <CubeIcon className="h-4 w-4 text-purple-600" />;
    } else {
      // Third level and deeper - equipment groups
      return <WrenchScrewdriverIcon className="h-4 w-4 text-orange-600" />;
    }
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.code);
    const isSelected = selectedNodeId === node.id;
    const dotCount = (node.code.match(/\./g) || []).length;
    const isAnlage = dotCount >= 4 || (node.name && node.name.toLowerCase().includes('anlage'));

    return (
      <li key={node.id} role="treeitem" aria-expanded={isExpanded}>
        <div className={`
          hs-accordion ${isExpanded ? 'active' : ''} 
          ${isSelected ? 'bg-blue-50 border-blue-200' : ''}
        `}>
          {/* Node Row */}
          <div className={`
            hs-accordion-toggle 
            py-2 px-2.5 
            inline-flex items-center 
            gap-x-2 
            w-full 
            text-sm 
            text-gray-800 
            rounded-lg 
            hover:bg-gray-100 
            focus:outline-none focus:bg-gray-100 
            dark:text-neutral-200 
            dark:hover:bg-neutral-700 
            dark:focus:bg-neutral-700
            ${isSelected ? 'bg-blue-50' : ''}
            group
          `}
            style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
          >
            {/* Expand/Collapse Button - only show if not an Anlage */}
            {!isAnlage && node.hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.code);
                }}
                className="flex-shrink-0 p-0.5 hover:bg-gray-200 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-5 h-5 flex-shrink-0" />
            )}

            {/* Node Icon */}
            <div className="flex-shrink-0">
              {getNodeIcon(node)}
            </div>

            {/* Node Content */}
            <div 
              className="flex-grow flex items-center justify-between cursor-pointer"
              onClick={() => onSelectNode?.(node)}
            >
              <div className="flex-grow">
                <span className={`
                  ${isAnlage ? 'font-semibold text-green-700' : 'font-medium'}
                  ${isSelected ? 'text-blue-700' : ''}
                `}>
                  {node.name}
                </span>
                <span className="ml-2 text-xs text-gray-500 font-mono">
                  {node.code}
                </span>
                {node.maintenanceIntervalMonths && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    Wartung: {node.maintenanceIntervalMonths}M
                  </span>
                )}
                {isAnlage && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Anlage
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!isAnlage && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddChild?.(node);
                    }}
                    className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                    title="Unterelement hinzufügen"
                  >
                    <PlusIcon className="h-3.5 w-3.5 text-gray-600" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditNode?.(node);
                  }}
                  className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                  title="Bearbeiten"
                >
                  <PencilIcon className="h-3.5 w-3.5 text-gray-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNode?.(node);
                  }}
                  className="p-1.5 hover:bg-red-100 rounded transition-colors"
                  title="Löschen"
                >
                  <TrashIcon className="h-3.5 w-3.5 text-red-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Children Container */}
          {isExpanded && !isAnlage && node.hasChildren && (
            <div className="hs-accordion-content w-full overflow-hidden transition-[height] duration-300">
              <ul className="ps-2" role="group">
                <NodeChildren 
                  nodeCode={node.code} 
                  depth={depth + 1}
                  onSelectNode={onSelectNode}
                  onEditNode={onEditNode}
                  onDeleteNode={onDeleteNode}
                  onAddChild={onAddChild}
                  selectedNodeId={selectedNodeId}
                  expandedNodes={expandedNodes}
                  setExpandedNodes={setExpandedNodes}
                />
              </ul>
            </div>
          )}
        </div>
      </li>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
    <div className="w-full">
      {/* Tree View Container */}
      <div className="border border-gray-200 rounded-lg bg-white">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-900">
            AKS-Hierarchie
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Klicken Sie auf die Pfeile um die Struktur zu erweitern
          </p>
        </div>

        {/* Tree Content */}
        <div className="p-4 max-h-[600px] overflow-y-auto">
          <ul className="space-y-0.5" role="tree">
            {rootNodes.map(node => renderNode(node as TreeNode))}
          </ul>
        </div>

        {/* Footer with Legend */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-x-6 text-xs text-gray-600">
            <div className="flex items-center gap-x-2">
              <FolderIcon className="h-3.5 w-3.5 text-blue-600" />
              <span>Hauptkategorie</span>
            </div>
            <div className="flex items-center gap-x-2">
              <CubeIcon className="h-3.5 w-3.5 text-purple-600" />
              <span>Unterkategorie</span>
            </div>
            <div className="flex items-center gap-x-2">
              <WrenchScrewdriverIcon className="h-3.5 w-3.5 text-orange-600" />
              <span>Anlagengruppe</span>
            </div>
            <div className="flex items-center gap-x-2">
              <Cog6ToothIcon className="h-3.5 w-3.5 text-green-600" />
              <span>Anlage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component to load and render children of a node
const NodeChildren: React.FC<{ 
  nodeCode: string; 
  depth: number; 
  onSelectNode?: (node: TreeNode) => void;
  onEditNode?: (node: TreeNode) => void;
  onDeleteNode?: (node: TreeNode) => void;
  onAddChild?: (parentNode: TreeNode) => void;
  selectedNodeId?: string;
  expandedNodes: Set<string>;
  setExpandedNodes: React.Dispatch<React.SetStateAction<Set<string>>>;
}> = ({ 
  nodeCode, 
  depth, 
  onSelectNode, 
  onEditNode,
  onDeleteNode,
  onAddChild,
  selectedNodeId, 
  expandedNodes, 
  setExpandedNodes 
}) => {
  const { data: children, isLoading } = useQuery(
    ['aks-tree-children', nodeCode],
    () => aksService.getAksTree(nodeCode),
    {
      staleTime: 5 * 60 * 1000,
      select: (data) => {
        return data.map(node => ({
          ...node,
          hasChildren: true,
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

  const getNodeIcon = (node: TreeNode) => {
    const dotCount = (node.code.match(/\./g) || []).length;
    
    // Determine if this is an Anlage (equipment) - typically at level 4 (AKS.XX.XXX.XX.XX)
    const isAnlage = dotCount >= 4 || (node.name && node.name.toLowerCase().includes('anlage'));
    
    if (isAnlage) {
      // This is an Anlage (equipment/asset)
      return <Cog6ToothIcon className="h-4 w-4 text-green-600" />;
    } else if (dotCount === 1) {
      // Top level (AKS.XX) - main categories
      return <FolderIcon className="h-4 w-4 text-blue-600" />;
    } else if (dotCount === 2) {
      // Second level (AKS.XX.XXX) - subcategories
      return <CubeIcon className="h-4 w-4 text-purple-600" />;
    } else {
      // Third level and deeper - equipment groups
      return <WrenchScrewdriverIcon className="h-4 w-4 text-orange-600" />;
    }
  };

  const renderChildNode = (node: TreeNode) => {
    const isExpanded = expandedNodes.has(node.code);
    const isSelected = selectedNodeId === node.id;
    const dotCount = (node.code.match(/\./g) || []).length;
    const isAnlage = dotCount >= 4 || (node.name && node.name.toLowerCase().includes('anlage'));

    return (
      <li key={node.id} role="treeitem" aria-expanded={isExpanded}>
        <div className={`
          hs-accordion ${isExpanded ? 'active' : ''} 
          ${isSelected ? 'bg-blue-50 border-blue-200' : ''}
        `}>
          {/* Node Row */}
          <div className={`
            hs-accordion-toggle 
            py-2 px-2.5 
            inline-flex items-center 
            gap-x-2 
            w-full 
            text-sm 
            text-gray-800 
            rounded-lg 
            hover:bg-gray-100 
            focus:outline-none focus:bg-gray-100 
            dark:text-neutral-200 
            dark:hover:bg-neutral-700 
            dark:focus:bg-neutral-700
            ${isSelected ? 'bg-blue-50' : ''}
            group
          `}
            style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
          >
            {/* Expand/Collapse Button - only show if not an Anlage */}
            {!isAnlage && node.hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.code);
                }}
                className="flex-shrink-0 p-0.5 hover:bg-gray-200 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-5 h-5 flex-shrink-0" />
            )}

            {/* Node Icon */}
            <div className="flex-shrink-0">
              {getNodeIcon(node)}
            </div>

            {/* Node Content */}
            <div 
              className="flex-grow flex items-center justify-between cursor-pointer"
              onClick={() => onSelectNode?.(node)}
            >
              <div className="flex-grow">
                <span className={`
                  ${isAnlage ? 'font-semibold text-green-700' : 'font-medium'}
                  ${isSelected ? 'text-blue-700' : ''}
                `}>
                  {node.name}
                </span>
                <span className="ml-2 text-xs text-gray-500 font-mono">
                  {node.code}
                </span>
                {node.maintenanceIntervalMonths && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    Wartung: {node.maintenanceIntervalMonths}M
                  </span>
                )}
                {isAnlage && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Anlage
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!isAnlage && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddChild?.(node);
                    }}
                    className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                    title="Unterelement hinzufügen"
                  >
                    <PlusIcon className="h-3.5 w-3.5 text-gray-600" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditNode?.(node);
                  }}
                  className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                  title="Bearbeiten"
                >
                  <PencilIcon className="h-3.5 w-3.5 text-gray-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNode?.(node);
                  }}
                  className="p-1.5 hover:bg-red-100 rounded transition-colors"
                  title="Löschen"
                >
                  <TrashIcon className="h-3.5 w-3.5 text-red-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Grandchildren Container */}
          {isExpanded && !isAnlage && node.hasChildren && (
            <div className="hs-accordion-content w-full overflow-hidden transition-[height] duration-300">
              <ul className="ps-2" role="group">
                <NodeChildren 
                  nodeCode={node.code} 
                  depth={depth + 1}
                  onSelectNode={onSelectNode}
                  onEditNode={onEditNode}
                  onDeleteNode={onDeleteNode}
                  onAddChild={onAddChild}
                  selectedNodeId={selectedNodeId}
                  expandedNodes={expandedNodes}
                  setExpandedNodes={setExpandedNodes}
                />
              </ul>
            </div>
          )}
        </div>
      </li>
    );
  };

  if (isLoading) {
    return (
      <li className="py-2" style={{ paddingLeft: `${depth * 1.5 + 1}rem` }}>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <div className="animate-spin h-3 w-3 border border-gray-300 border-t-gray-600 rounded-full"></div>
          <span>Lade Unterelemente...</span>
        </div>
      </li>
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