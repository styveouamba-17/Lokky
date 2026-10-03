import { AwsClient } from 'aws4fetch';

// Avatars sur Cloudflare R2 (spec backend §11) : l'app envoie l'image directement à R2 avec
// une URL PUT signée, valable 5 minutes et limitée au type d'image annoncé.
export const UPLOAD_URL_TTL_SECONDS = 5 * 60;
// L'URL signée ne peut pas imposer de taille : elle est vérifiée avant d'accepter la photo.
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export interface AvatarStorage {
  presignUpload(
    key: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; headers: Record<string, string> }>;
  publicUrl(key: string): string;
  // Une URL d'avatar acceptable pour cet utilisateur : la nôtre, dans son dossier.
  ownsUrl(userId: string, url: string): boolean;
  // Taille du fichier envoyé (null s'il n'existe pas), et suppression d'un fichier refusé.
  sizeOf(url: string): Promise<number | null>;
  remove(url: string): Promise<void>;
}

export interface R2Settings {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string; // ex. https://pub-xxxx.r2.dev (puis un domaine à nous)
}

export const avatarPrefix = (userId: string) => `avatars/${userId}/`;

export function createR2AvatarStorage(settings: R2Settings): AvatarStorage {
  const client = new AwsClient({
    accessKeyId: settings.accessKeyId,
    secretAccessKey: settings.secretAccessKey,
    service: 's3',
    region: 'auto',
  });
  const endpoint = `https://${settings.accountId}.r2.cloudflarestorage.com/${settings.bucket}`;
  const base = settings.publicBaseUrl.replace(/\/+$/, '');

  return {
    async presignUpload(key, contentType) {
      const url = new URL(`${endpoint}/${key}`);
      url.searchParams.set('X-Amz-Expires', String(UPLOAD_URL_TTL_SECONDS));
      const signed = await client.sign(url, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        aws: { signQuery: true },
      });
      return { uploadUrl: signed.url, headers: { 'Content-Type': contentType } };
    },
    publicUrl: (key) => `${base}/${key}`,
    ownsUrl: (userId, url) => url.startsWith(`${base}/${avatarPrefix(userId)}`),
    async sizeOf(url) {
      const res = await client.fetch(`${endpoint}/${url.slice(base.length + 1)}`, {
        method: 'HEAD',
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`R2 : lecture impossible (${res.status}).`);
      return Number(res.headers.get('content-length') ?? 0);
    },
    async remove(url) {
      await client.fetch(`${endpoint}/${url.slice(base.length + 1)}`, { method: 'DELETE' });
    },
  };
}
