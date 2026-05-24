import { useState } from 'react';
import { Folder, File, FileCode, Plus, FolderPlus, Trash2, ChevronRight, ChevronDown, Monitor, Edit2 } from 'lucide-react';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  parentId: string | null;
}

interface FileExplorerProps {
  files: FileNode[];
  setFiles: (files: FileNode[] | ((prev: FileNode[]) => FileNode[])) => void;
  activeFileId: string;
  setActiveFileId: (id: string) => void;
  className?: string;
}

export default function FileExplorer({ files, setFiles, activeFileId, setActiveFileId, className }: FileExplorerProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']));
  const [creatingFileIn, setCreatingFileIn] = useState<string | null>(null);
  const [creatingFolderIn, setCreatingFolderIn] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleRenameSubmit = (id: string) => {
    const trimmed = renameValue.trim();
    if (trimmed) {
      const fileToRename = files.find(f => f.id === id);
      if (fileToRename && fileToRename.name !== trimmed) {
        const isDuplicate = files.some(f => f.parentId === fileToRename.parentId && f.name === trimmed && f.id !== id);
        if (isDuplicate) {
          alert('A file or folder with this name already exists.');
          return;
        }
        setFiles((prev: any) => prev.map((f: FileNode) => f.id === id ? { ...f, name: trimmed } : f));
      }
    }
    setRenamingId(null);
  };

  const toggleFolder = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getIcon = (name: string, isOpen: boolean = false) => {
    if (name.endsWith('.html')) return <FileCode size={14} color="#e34c26" />;
    if (name.endsWith('.css')) return <FileCode size={14} color="#264de4" />;
    if (name.endsWith('.js')) return <FileCode size={14} color="#f0db4f" />;
    return <File size={14} color="#9ca3af" />;
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this?')) {
      setFiles(prev => {
        // Simple recursive delete
        const toDelete = new Set([id]);
        let changed = true;
        while (changed) {
          changed = false;
          prev.forEach(f => {
            if (f.parentId && toDelete.has(f.parentId) && !toDelete.has(f.id)) {
              toDelete.add(f.id);
              changed = true;
            }
          });
        }
        return prev.filter(f => !toDelete.has(f.id));
      });
      if (activeFileId === id) setActiveFileId('index.html');
    }
  };

  const handleCreate = (type: 'file' | 'folder', parentId: string | null) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setCreatingFileIn(null);
      setCreatingFolderIn(null);
      return;
    }
    
    const isDuplicate = files.some(f => f.parentId === parentId && f.name === trimmed);
    if (isDuplicate) {
      alert('A file or folder with this name already exists.');
      return;
    }
    
    const newId = Date.now().toString();
    const newFile: FileNode = {
      id: newId,
      name: trimmed,
      type,
      parentId,
      content: type === 'file' ? '' : undefined,
    };
    setFiles(prev => [...prev, newFile]);
    if (type === 'file') setActiveFileId(newId);
    if (parentId) {
      setExpanded(prev => {
        const next = new Set(prev);
        next.add(parentId);
        return next;
      });
    }
    setCreatingFileIn(null);
    setCreatingFolderIn(null);
    setNewName('');
  };

  const renderTree = (parentId: string | null = null, depth: number = 0) => {
    const children = files.filter(f => f.parentId === parentId).sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
    });

    return (
      <div style={{ paddingLeft: depth === 0 ? 0 : 12 }}>
        {children.map(node => (
          <div key={node.id}>
            <div
              className={`tree-item ${activeFileId === node.id ? 'active' : ''}`}
              onClick={() => node.type === 'folder' ? toggleFolder(node.id) : setActiveFileId(node.id)}
            >
              <div className="tree-item-left">
                {node.type === 'folder' && (
                  <span className="chevron">
                    {expanded.has(node.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                )}
                {node.type === 'folder' ? (
                  <Folder size={14} color={expanded.has(node.id) ? "#dcb67a" : "#9ca3af"} style={{ marginRight: 6 }} />
                ) : (
                  <span style={{ marginRight: 6 }}>{getIcon(node.name)}</span>
                )}
                {renamingId === node.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRenameSubmit(node.id)}
                    onBlur={() => handleRenameSubmit(node.id)}
                    onClick={e => e.stopPropagation()}
                    style={{ background: '#3c3c3c', border: '1px solid #007acc', color: '#fff', fontSize: '13px', outline: 'none', width: '100px', marginLeft: 4 }}
                  />
                ) : (
                  <span className="tree-item-name">{node.name}</span>
                )}
              </div>
              <div className="tree-item-actions">
                {node.type === 'folder' && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); setCreatingFileIn(node.id); setExpanded(prev => new Set(prev).add(node.id)); }}><Plus size={12} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setCreatingFolderIn(node.id); setExpanded(prev => new Set(prev).add(node.id)); }}><FolderPlus size={12} /></button>
                  </>
                )}
                <>
                  <button onClick={(e) => { e.stopPropagation(); setRenamingId(node.id); setRenameValue(node.name); }} title="Rename"><Edit2 size={12} /></button>
                  <button onClick={(e) => handleDelete(e, node.id)} className="delete-btn" title="Delete"><Trash2 size={12} /></button>
                </>
              </div>
            </div>

            {/* Render creation inputs inside folder */}
            {expanded.has(node.id) && (
              <>
                {creatingFileIn === node.id && (
                  <div className="tree-create-input" style={{ paddingLeft: (depth + 1) * 12 + 20 }}>
                    <input autoFocus placeholder="File name..." value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate('file', node.id)} onBlur={() => handleCreate('file', node.id)} />
                  </div>
                )}
                {creatingFolderIn === node.id && (
                  <div className="tree-create-input" style={{ paddingLeft: (depth + 1) * 12 + 20 }}>
                    <input autoFocus placeholder="Folder name..." value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate('folder', node.id)} onBlur={() => handleCreate('folder', node.id)} />
                  </div>
                )}
                {renderTree(node.id, depth + 1)}
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`file-explorer ${className || ''}`}>
      <div className="fe-header">
        <div className="fe-brand">
          <Monitor size={14} color="#863bff" />
          <span>Web Compiler</span>
        </div>
        <div className="fe-actions">
          <button onClick={() => setCreatingFileIn('root')} title="New File"><Plus size={14} /></button>
          <button onClick={() => setCreatingFolderIn('root')} title="New Folder"><FolderPlus size={14} /></button>
        </div>
      </div>
      
      <div className="fe-body">
        {creatingFileIn === 'root' && (
          <div className="tree-create-input">
            <input autoFocus placeholder="File name..." value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate('file', null)} onBlur={() => handleCreate('file', null)} />
          </div>
        )}
        {creatingFolderIn === 'root' && (
          <div className="tree-create-input">
            <input autoFocus placeholder="Folder name..." value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate('folder', null)} onBlur={() => handleCreate('folder', null)} />
          </div>
        )}
        {renderTree(null, 0)}
      </div>
    </div>
  );
}
