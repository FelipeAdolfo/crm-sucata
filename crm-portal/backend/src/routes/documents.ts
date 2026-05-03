import { Router } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth';
import { documentUpload, uploadToCloudinary, uploadConfig } from '../utils/upload';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// LISTAR DOCUMENTOS
// ============================================
router.get('/', authenticate, async (req, res) => {
  try {
    const { opportunityId, status, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (opportunityId) where.opportunityId = String(opportunityId);
    if (status) where.status = String(status);

    // Comprador so ve seus documentos ou da oportunidade vinculada
    if (req.user!.role === UserRole.BUYER || req.user!.role === UserRole.PARTNER) {
      where.OR = [
        { uploadedById: req.user!.id },
        { opportunity: { assignedToId: req.user!.id } },
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          uploadedBy: { select: { id: true, name: true } },
          opportunity: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.document.count({ where }),
    ]);

    res.json({ documents, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({ error: 'Erro ao listar documentos' });
  }
});

// ============================================
// UPLOAD DE DOCUMENTO
// ============================================
router.post('/', authenticate, documentUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const { title, type, opportunityId } = req.body;
    let fileUrl = req.file.filename;
    let cloudinaryPublicId: string | undefined;

    // Se estiver em producao com Cloudinary, fazer upload para la
    if (uploadConfig.useCloudinary) {
      try {
        const result = await uploadToCloudinary(req.file, 'documents');
        fileUrl = result.url;
        cloudinaryPublicId = result.publicId;
      } catch (cloudError) {
        console.error('Erro no upload Cloudinary:', cloudError);
        return res.status(500).json({ error: 'Erro ao enviar arquivo para nuvem' });
      }
    } else {
      fileUrl = `/uploads/documents/${req.file.filename}`;
    }

    const document = await prisma.document.create({
      data: {
        title: title || req.file.originalname,
        type: type || 'DECLARACAO',
        fileName: req.file.originalname,
        fileUrl: fileUrl,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        status: 'PENDING',
        opportunityId: opportunityId || null,
        uploadedById: req.user!.id,
      },
      include: {
        uploadedBy: { select: { id: true, name: true } },
        opportunity: { select: { id: true, name: true } },
      },
    });

    // Registrar atividade
    await prisma.activity.create({
      data: {
        type: 'DOCUMENT_UPLOADED',
        description: `Documento "${document.title}" enviado`,
        userId: req.user!.id,
        opportunityId: opportunityId || null,
        metadata: { documentId: document.id, fileName: req.file.originalname },
      },
    });

    res.status(201).json(document);
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Erro ao enviar documento' });
  }
});

// ============================================
// DOWNLOAD DE DOCUMENTO
// ============================================
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({ error: 'Documento nao encontrado' });
    }

    // Se for URL do Cloudinary, redirecionar
    if (document.fileUrl.startsWith('http')) {
      return res.redirect(document.fileUrl);
    }

    // Download local
    const filePath = path.join(process.cwd(), document.fileUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo nao encontrado no servidor' });
    }
    res.download(filePath, document.fileName);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ error: 'Erro ao baixar documento' });
  }
});

// ============================================
// ASSINAR DOCUMENTO
// ============================================
router.post('/:id/sign', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { signature } = req.body;

    if (!signature) {
      return res.status(400).json({ error: 'Assinatura obrigatoria' });
    }

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({ error: 'Documento nao encontrado' });
    }

    if (document.status === 'SIGNED') {
      return res.status(400).json({ error: 'Documento ja foi assinado' });
    }

    const updated = await prisma.document.update({
      where: { id },
      data: {
        status: 'SIGNED',
        signedAt: new Date(),
        signedBy: req.user!.name,
        signatureData: signature,
      },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    // Registrar atividade
    await prisma.activity.create({
      data: {
        type: 'DOCUMENT_SIGNED',
        description: `Documento "${document.title}" assinado por ${req.user!.name}`,
        userId: req.user!.id,
        opportunityId: document.opportunityId,
        metadata: { documentId: document.id, signedBy: req.user!.id },
      },
    });

    res.json({ message: 'Documento assinado com sucesso', document: updated });
  } catch (error) {
    console.error('Sign document error:', error);
    res.status(500).json({ error: 'Erro ao assinar documento' });
  }
});

// ============================================
// EXCLUIR DOCUMENTO
// ============================================
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      return res.status(404).json({ error: 'Documento nao encontrado' });
    }

    // Verificar permissao
    if (
      req.user!.role !== UserRole.ADMIN &&
      req.user!.role !== UserRole.MANAGER &&
      req.user!.role !== UserRole.DIRECTOR &&
      document.uploadedById !== req.user!.id
    ) {
      return res.status(403).json({ error: 'Sem permissao' });
    }

    // Se for arquivo local, remover do disco
    if (!document.fileUrl.startsWith('http')) {
      const filePath = path.join(process.cwd(), document.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.document.delete({ where: { id } });
    res.json({ message: 'Documento removido' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Erro ao remover documento' });
  }
});

export default router;
