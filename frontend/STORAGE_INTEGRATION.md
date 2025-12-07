# Galaksio Storage Integration

Integration con el API de storage permanente de Galaksio, powered por Arweave y x402 payment protocol.

## 🌐 API Base URL

```
https://storage.galaksio.cloud
```

## 📋 Características Implementadas

### 1. **Cliente de API** (`src/lib/storage-api.ts`)

Cliente TypeScript completo para interactuar con el API de Galaksio Storage:

- **Operaciones Gratuitas:**
  - `health()` - Health check del API
  - `getBalance()` - Balance AR de la wallet
  - `getTransaction(txId)` - Información de transacción

- **Operaciones Pagadas (x402):**
  - `uploadData()` - Subir datos ($0.01 + costo Arweave)
  - `uploadFile()` - Subir archivo ($0.01 + costo Arweave)
  - `getData(txId)` - Descargar datos ($0.001 USDC)
  - `query()` - Buscar transacciones ($0.005 USDC)

### 2. **Hook Personalizado** (`src/hooks/useStorage.ts`)

React hook que simplifica el uso del storage API:

```tsx
const {
  uploadFile,
  uploadData,
  downloadData,
  getTransactionInfo,
  queryByOwner,
  getBalance,
  uploading,
  downloading,
  querying,
  error,
  isWalletConnected
} = useStorage(walletAddress);
```

### 3. **UI de Storage** (`src/app/storage/page.tsx`)

Página completa con:

- ✅ Conexión de wallet
- ✅ Drag & drop para subir archivos
- ✅ Vista previa del costo estimado
- ✅ Lista de archivos subidos
- ✅ Descarga de archivos
- ✅ Balance AR
- ✅ Estados de carga/error

### 4. **Componente de Estimación de Costos** (`src/components/StorageCostEstimate.tsx`)

Muestra el costo estimado antes de subir:
- Base fee: $0.01 USDC
- Storage cost: ~$0.005 USDC por MB
- Total estimado

## 🔑 Autenticación x402

El API usa el protocolo x402 para pagos. **Pendiente de implementar:**

```typescript
// En useStorage.ts, línea ~14
const getX402Headers = useCallback(async () => {
  // TODO: Integrar con wallet real para generar headers x402
  // Debe retornar headers de autenticación/pago
  return {};
}, []);
```

## 💰 Costos

| Operación | Costo |
|-----------|-------|
| Upload data/file | $0.01 + costo Arweave dinámico |
| Download data | $0.001 USDC |
| Query transactions | $0.005 USDC |
| Get balance | Gratis |
| Get transaction | Gratis |

## 🎨 Navegación

La página de Storage está accesible desde:
- Navbar: `/storage`
- Dashboard: Card de "Permanent Storage"

## 🔧 Configuración

Agregar a tu archivo `.env.local`:

```bash
NEXT_PUBLIC_STORAGE_API_URL=https://storage.galaksio.cloud
```

## 📦 Tipos TypeScript

Todos los tipos están definidos en `src/lib/storage-api.ts`:

```typescript
interface UploadResponse {
  tx_id: string;
  status: string;
  data_size: number;
  ar_cost: string;
  gateway_url: string;
}

interface TransactionInfo {
  tx_id: string;
  owner: string;
  data_size: number;
  tags: Record<string, string>[];
  block_timestamp: number | null;
  // ...
}
```

## 🚀 Uso Básico

### Subir un archivo:

```tsx
const { uploadFile, uploading } = useStorage(walletAddress);

const handleUpload = async (file: File) => {
  const response = await uploadFile(file);
  if (response) {
    console.log('File uploaded:', response.tx_id);
    console.log('Gateway URL:', response.gateway_url);
  }
};
```

### Descargar datos:

```tsx
const { downloadData } = useStorage(walletAddress);

const handleDownload = async (txId: string) => {
  const data = await downloadData(txId);
  // data puede ser JSON, texto, o binario
};
```

### Buscar archivos propios:

```tsx
const { queryByOwner } = useStorage(walletAddress);

const loadMyFiles = async () => {
  const txIds = await queryByOwner(walletAddress);
  // Array de transaction IDs
};
```

## 📝 Notas Técnicas

1. **Storage Permanente:** Los archivos se almacenan permanentemente en Arweave (no se pueden eliminar)
2. **Gateway URLs:** Los archivos son accesibles vía `https://arweave.net/{tx_id}`
3. **Tags:** Se pueden agregar tags personalizados para filtrado/búsqueda
4. **Content-Type:** Se detecta automáticamente al subir archivos

## 🔜 Próximos Pasos

1. **Integrar wallet real** - Reemplazar `mock-wallet-address` con wallet de verdad
2. **Implementar x402 headers** - Generar headers de pago con la wallet
3. **Agregar more features:**
   - Búsqueda avanzada con ArQL
   - Filtros por Content-Type
   - Preview de archivos (imágenes, PDFs)
   - Compartir links públicos

## 🐛 Estado Actual

- ✅ API client completo
- ✅ UI funcional
- ⚠️ Wallet connection es mock
- ⚠️ x402 headers no implementados
- ⚠️ Pagos reales requieren wallet real

## 📚 Documentación API

API docs completa: https://storage.galaksio.cloud/docs

OpenAPI spec incluido en el código.
