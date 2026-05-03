/**
 * Utilitario de Upload
 * 
 * Em producao (Railway), usa Cloudinary para persistencia de arquivos
 * Em desenvolvimento, usa disco local
 */

import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

// Detectar ambiente
const isProduction = process.env.NODE_ENV === 'production';
const useCloudinary = isProduction && process.env.CLOUDINARY_CLOUD_NAME;

// Configurar Cloudinary
if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('[Upload] Cloudinary configurado para producao');
}

// Diretorio de uploads local
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

// Criar diretorios se nao existirem
const createUploadDirs = () => {
  const dirs = [
    `${UPLOAD_DIR}/documents`,
    `${UPLOAD_DIR}/photos`,
  ];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

if (!useCloudinary) {
  createUploadDirs();
}

// ============================================
// Multer Storage (desenvolvimento ou fallback)
// ============================================
const diskStorage = (folder: string) => multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = `${UPLOAD_DIR}/${folder}`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// ============================================
// Memory Storage (para upload no Cloudinary)
// ============================================
const memoryStorage = multer.memoryStorage();

// ============================================
// Upload para Cloudinary
// ============================================
export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder: string
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `crm-sucata/${folder}`,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error('Upload result is undefined'));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    uploadStream.end(file.buffer);
  });
};

// ============================================
// Deletar do Cloudinary
// ============================================
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

// ============================================
// Factory de upload do Multer
// ============================================
export const createUploader = (folder: string, options: multer.Options = {}) => {
  const storage = useCloudinary ? memoryStorage : diskStorage(folder);

  return multer({
    storage,
    limits: { fileSize: options.limits?.fileSize || 10 * 1024 * 1024 }, // 10MB default
    fileFilter: options.fileFilter,
  });
};

// ============================================
// Obter URL do arquivo
// ============================================
export const getFileUrl = (file: Express.Multer.File, cloudinaryResult?: { url: string; publicId: string }): string => {
  if (useCloudinary && cloudinaryResult) {
    return cloudinaryResult.url;
  }
  return `/uploads/${file.filename}`;
};

// ============================================
// Upload configurado para documentos
// ============================================
export const documentUpload = createUploader('documents', {
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo nao suportado. Use PDF, DOC, DOCX, TXT, JPG ou PNG.'));
    }
  },
});

// ============================================
// Upload configurado para fotos
// ============================================
export const photoUpload = createUploader('photos', {
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens sao permitidas.'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB para fotos
});

// ============================================
// Middleware para servir arquivos estaticos
// ============================================
export const serveUploads = (app: any) => {
  if (!useCloudinary) {
    app.use('/uploads', require('express').static(UPLOAD_DIR));
  }
};

// Exportar configuracao
export const uploadConfig = {
  useCloudinary,
  uploadDir: UPLOAD_DIR,
};
