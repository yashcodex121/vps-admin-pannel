'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import {
  FolderOpen,
  Folder,
  FileCode,
  FileText,
  Save,
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import { IFileEntry } from '@nexus/types';

export default function FileManagerPage() {
  const [currentPath, setCurrentPath] = useState('/home/deploy');
  const [entries, setEntries] = useState<IFileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const fetchDirectory = async (targetPath: string) => {
    setLoading(true);
    const res = await api.get<{ currentPath: string; entries: IFileEntry[] }>(`/files/list?path=${encodeURIComponent(targetPath)}`);
    if (res.success && res.data) {
      setCurrentPath(res.data.currentPath);
      setEntries(res.data.entries);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDirectory(currentPath);
  }, []);

  const handleOpenEntry = async (entry: IFileEntry) => {
    if (entry.isDirectory) {
      fetchDirectory(entry.path);
    } else {
      setSelectedFile(entry.path);
      const res = await api.get<{ content: string }>(`/files/read?path=${encodeURIComponent(entry.path)}`);
      if (res.success && res.data) {
        setFileContent(res.data.content);
      }
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;
    setSaving(true);
    const res = await api.post('/files/write', {
      path: selectedFile,
      content: fileContent,
    });
    if (res.success) {
      alert('File saved successfully.');
      setSelectedFile(null);
    }
    setSaving(false);
  };

  const handleNavigateUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    if (parts.length > 1) {
      parts.pop();
      fetchDirectory('/' + parts.join('/'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FolderOpen className="w-6 h-6 text-cyan-400" />
            Authorized File Manager
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Scoped access to authorized project roots with path traversal prevention
          </p>
        </div>
      </div>

      {/* Breadcrumb Path Bar */}
      <div className="flex items-center gap-2 bg-[#111827] px-4 py-2.5 rounded-xl border border-white/[0.08] text-xs font-mono">
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={handleNavigateUp} disabled={currentPath === '/home'}>
          Back
        </Button>
        <span className="text-gray-400">Path:</span>
        <span className="text-cyan-400 font-semibold">{currentPath}</span>
      </div>

      {/* File Entries Table */}
      <GlassCard className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.08] text-gray-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="pb-3">Name</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Permissions</th>
                <th className="pb-3">Size</th>
                <th className="pb-3 text-right">Modified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-gray-200">
              {entries.map((entry) => (
                <tr
                  key={entry.path}
                  onClick={() => handleOpenEntry(entry)}
                  className="hover:bg-white/[0.04] cursor-pointer transition-colors"
                >
                  <td className="py-3 font-medium flex items-center gap-2.5">
                    {entry.isDirectory ? (
                      <Folder className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <FileCode className="w-4 h-4 text-purple-400" />
                    )}
                    <span className="text-gray-100 font-semibold">{entry.name}</span>
                  </td>
                  <td className="py-3 text-gray-400">
                    {entry.isDirectory ? 'Directory' : entry.extension ? `${entry.extension.toUpperCase()} File` : 'File'}
                  </td>
                  <td className="py-3 font-mono text-gray-500">{entry.permissions || '-rw-r--r--'}</td>
                  <td className="py-3 font-mono text-gray-400">
                    {entry.isDirectory ? '--' : `${(entry.sizeBytes / 1024).toFixed(1)} KB`}
                  </td>
                  <td className="py-3 text-right text-gray-400">
                    {new Date(entry.modifiedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Text File Editor Modal */}
      <Modal
        isOpen={!!selectedFile}
        onClose={() => setSelectedFile(null)}
        title={`File Editor: ${selectedFile?.split('/').pop()}`}
        description={selectedFile || ''}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <textarea
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            rows={14}
            className="w-full bg-black/90 font-mono text-xs text-gray-200 p-4 rounded-xl border border-white/10 focus:outline-none focus:border-cyan-500/50 custom-scrollbar"
          />

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
              Cancel
            </Button>
            <Button variant="gradient" size="sm" icon={Save} loading={saving} onClick={handleSaveFile}>
              Save File
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
