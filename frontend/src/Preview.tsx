import { useEffect, useState } from 'react';
import type { FileNode } from './components/FileExplorer';

export default function Preview() {
  const [htmlContent, setHtmlContent] = useState('');

  const generatePreview = () => {
    try {
      const saved = localStorage.getItem('compilar_web_files_v3');
      if (saved) {
        const webFiles: FileNode[] = JSON.parse(saved);
        let htmlFileNode = webFiles.find(f => f.id === localStorage.getItem('compilar_active_web_file_v3') && f.name.endsWith('.html'));
        if (!htmlFileNode) htmlFileNode = webFiles.find(f => f.name.endsWith('.html'));
        
        let htmlFile = htmlFileNode?.content || '<h1>No HTML file found!</h1>';
        const parentFolderId = htmlFileNode?.parentId || null;

        const cssFiles = webFiles.filter(f => f.name.endsWith('.css') && f.parentId === parentFolderId);
        const jsFiles = webFiles.filter(f => f.name.endsWith('.js') && f.parentId === parentFolderId);
        
        for (const css of cssFiles) {
          const linkTagRegex = new RegExp(`<link[^>]*href=["']${css.name}["'][^>]*>`, 'gi');
          if (htmlFile.match(linkTagRegex)) {
            htmlFile = htmlFile.replace(linkTagRegex, `<style>\n${css.content}\n</style>`);
          }
        }
        for (const js of jsFiles) {
          const scriptTagRegex = new RegExp(`<script[^>]*src=["']${js.name}["'][^>]*><\\/script>`, 'gi');
          if (htmlFile.match(scriptTagRegex)) {
            htmlFile = htmlFile.replace(scriptTagRegex, `<script>\n${js.content}\n</script>`);
          }
        }
        
        setHtmlContent(htmlFile);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    generatePreview();
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'compilar_web_files_v3' || e.key === 'compilar_active_web_file_v3') {
        generatePreview();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <iframe 
      srcDoc={htmlContent} 
      style={{ width: '100vw', height: '100vh', border: 'none', margin: 0, padding: 0, display: 'block', background: '#fff' }} 
      title="Preview" 
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups" 
    />
  );
}
