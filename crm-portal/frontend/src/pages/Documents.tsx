import React, { useState, useRef } from 'react';
import {
  FileText, Upload, Download, Trash2, Pen, CheckCircle, Clock,
  File, FileCheck, AlertTriangle, X, ChevronDown, Search,
} from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { useAuthStore } from '@/stores/auth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
  SIGNED: { label: 'Assinado', color: 'bg-green-100 text-green-700' },
  ARCHIVED: { label: 'Arquivado', color: 'bg-gray-100 text-gray-600' },
};

const typeLabels: Record<string, string> = {
  DECLARACAO: 'Declaracao',
  CONTRATO: 'Contrato',
  NDA: 'NDA',
  CERTIDAO: 'Certidao',
  OUTRO: 'Outro',
};

export const Documents: React.FC = () => {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showSign, setShowSign] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [uploadForm, setUploadForm] = useState({ title: '', type: 'DECLARACAO', file: null as File | null });
  const [signatureSvg, setSignatureSvg] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const { documentsService } = await import('@/services/documents');
      const res = await documentsService.getAll({ status: filterStatus || undefined });
      setDocuments(res.documents || []);
    } catch {
      toast.error('Erro ao carregar documentos');
    }
    setLoading(false);
  };

  React.useEffect(() => { loadDocuments(); }, [filterStatus]);

  const handleUpload = async () => {
    if (!uploadForm.title || !uploadForm.file) {
      toast.error('Preencha o titulo e selecione um arquivo');
      return;
    }
    try {
      const { documentsService } = await import('@/services/documents');
      await documentsService.upload({
        title: uploadForm.title,
        type: uploadForm.type,
        file: uploadForm.file,
      });
      toast.success('Documento enviado com sucesso');
      setShowUpload(false);
      setUploadForm({ title: '', type: 'DECLARACAO', file: null });
      loadDocuments();
    } catch {
      toast.error('Erro ao enviar documento');
    }
  };

  const handleDownload = async (id: string, fileName: string) => {
    try {
      const { documentsService } = await import('@/services/documents');
      const blob = await documentsService.download(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Download iniciado');
    } catch {
      toast.error('Erro ao baixar documento');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remover este documento?')) return;
    try {
      const { documentsService } = await import('@/services/documents');
      await documentsService.delete(id);
      toast.success('Documento removido');
      loadDocuments();
    } catch {
      toast.error('Erro ao remover documento');
    }
  };

  // Canvas signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = '#1a365d';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureSvg(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureSvg('');
  };

  const handleSign = async () => {
    if (!signatureSvg || !showSign) return;
    try {
      const { documentsService } = await import('@/services/documents');
      await documentsService.sign(showSign, signatureSvg);
      toast.success('Documento assinado com sucesso');
      setShowSign(null);
      setSignatureSvg('');
      loadDocuments();
    } catch {
      toast.error('Erro ao assinar documento');
    }
  };

  const filtered = documents.filter((d) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return d.title?.toLowerCase().includes(term) || d.fileName?.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie declaracoes, contratos e outros documentos</p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Enviar Documento
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todos os status</option>
          <option value="PENDING">Pendentes</option>
          <option value="SIGNED">Assinados</option>
          <option value="ARCHIVED">Arquivados</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Documento</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Tipo</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Oportunidade</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Enviado por</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Data</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Nenhum documento encontrado</p>
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => {
                  const status = statusLabels[doc.status] || statusLabels.PENDING;
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                            <p className="text-xs text-gray-500">{doc.fileName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{typeLabels[doc.type] || doc.type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {doc.status === 'SIGNED' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{doc.opportunity?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{doc.uploadedBy?.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {doc.createdAt ? format(new Date(doc.createdAt), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {doc.status === 'PENDING' && (
                            <button
                              onClick={() => { setShowSign(doc.id); setTimeout(clearSignature, 100); }}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Assinar"
                            >
                              <Pen className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDownload(doc.id, doc.fileName)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Baixar"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <Modal title="Enviar Documento" onClose={() => setShowUpload(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titulo</label>
              <input
                type="text"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                placeholder="Ex: Declaracao de Geracao de Sucata"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={uploadForm.type}
                onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="DECLARACAO">Declaracao</option>
                <option value="CONTRATO">Contrato</option>
                <option value="NDA">NDA</option>
                <option value="CERTIDAO">Certidao</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowUpload(false)}>Cancelar</Button>
              <Button onClick={handleUpload}>
                <Upload className="w-4 h-4 mr-2" />
                Enviar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Sign Modal */}
      {showSign && (
        <Modal title="Assinar Documento" onClose={() => { setShowSign(null); clearSignature(); }}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Desenhe sua assinatura no quadro abaixo:</p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white">
              <canvas
                ref={canvasRef}
                width={500}
                height={200}
                className="w-full cursor-crosshair rounded-lg"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <div className="flex justify-between items-center">
              <button
                onClick={clearSignature}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Limpar
              </button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => { setShowSign(null); clearSignature(); }}>
                  Cancelar
                </Button>
                <Button onClick={handleSign} disabled={!signatureSvg}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Assinatura
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
