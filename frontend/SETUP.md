# 🚀 Guía de Configuración - Galaksio Frontend

## Cambios Implementados

He transformado completamente el frontend de Galaksio para tener un estilo similar a Vercel con las siguientes características:

### ✅ Completado

1. **Autenticación con GitHub OAuth** (NextAuth v5)
2. **Landing page rediseñada** estilo Vercel
3. **Dashboard de proyectos** con diseño moderno
4. **Página de importación de repositorios** desde GitHub
5. **Navbar actualizado** con gestión de sesión
6. **Componentes UI** siguiendo el estilo de Vercel

## 🔧 Configuración Rápida

### 1. Instalar dependencias

Las dependencias ya están instaladas, pero si necesitas reinstalar:

```bash
npm install
```

### 2. Crear GitHub OAuth App

1. Ve a: https://github.com/settings/developers
2. Click en "New OAuth App"
3. Configura:
   - **Application name**: `Galaksio`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Guarda y copia el `Client ID` y `Client Secret`

### 3. Configurar variables de entorno

Crea el archivo `.env.local`:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=tu_github_client_id
GITHUB_CLIENT_SECRET=tu_github_client_secret

# NextAuth
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
```

O genera el secret manualmente:
```bash
openssl rand -base64 32
```

### 4. Ejecutar el proyecto

```bash
npm run dev
```

Visita: http://localhost:3000

## 📁 Archivos Creados/Modificados

### Nuevos Archivos

- `src/lib/auth.ts` - Configuración de NextAuth con GitHub
- `src/app/api/auth/[...nextauth]/route.ts` - API routes de autenticación
- `src/types/next-auth.d.ts` - Types para NextAuth
- `src/components/NavbarNew.tsx` - Navbar con GitHub auth
- `src/components/AuthProvider.tsx` - Provider de sesión
- `src/app/new/page.tsx` - Página de importar repositorios
- `.env.example` - Template de variables de entorno

### Archivos Modificados

- `src/app/layout.tsx` - Actualizado para usar AuthProvider
- `src/app/page.tsx` - Landing page rediseñada estilo Vercel
- `src/app/dashboard/page.tsx` - Dashboard modernizado

## 🎨 Características del Diseño

### Landing Page
- Hero section con gradientes
- Preview del dashboard
- Cards de features
- CTA section
- Responsive design

### Dashboard
- Lista de proyectos con estados (Building, Ready, Error)
- Búsqueda de repositorios
- Estadísticas rápidas
- Empty states informativos

### Importar Proyectos
- Conexión con GitHub API
- Lista de repositorios del usuario
- Búsqueda y filtrado
- Import desde URL de Git

## 🔌 Integración con Backend (Pendiente)

Cuando tengas los endpoints listos, modifica estos archivos:

### 1. Importar Proyecto (`src/app/new/page.tsx`)

```typescript
const handleImport = async (repo: GitHubRepo) => {
  setImporting(repo.id);
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/import`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session?.accessToken}`
    },
    body: JSON.stringify({
      repoUrl: repo.html_url,
      repoName: repo.name,
      branch: repo.default_branch,
      githubId: session?.user.id
    }),
  });

  if (response.ok) {
    const project = await response.json();
    router.push(`/projects/${project.id}`);
  }
  
  setImporting(null);
};
```

### 2. Listar Proyectos (`src/app/dashboard/page.tsx`)

```typescript
const fetchProjects = async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
      headers: {
        "Authorization": `Bearer ${session?.accessToken}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      setProjects(data);
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
  }
};
```

## 🔐 Scopes de GitHub

La app solicita estos permisos:
- `read:user` - Información básica del usuario
- `user:email` - Email del usuario
- `repo` - Acceso a repositorios (público y privado)

## 📝 Próximos Pasos

1. **Configurar GitHub OAuth** ⚠️ (Requerido)
2. **Definir endpoints del backend**
3. **Conectar API de proyectos**
4. **Implementar sistema de builds**
5. **Agregar logs de deployment**
6. **Configuración de environment variables**
7. **Dominios personalizados**

## 🐛 Troubleshooting

### Error: "NEXTAUTH_SECRET missing"
```bash
# Genera un nuevo secret
openssl rand -base64 32
# Agrégalo a .env.local
```

### Error: "GitHub OAuth not configured"
Verifica que tengas `GITHUB_CLIENT_ID` y `GITHUB_CLIENT_SECRET` en `.env.local`

### Error: Redirect URI mismatch
Asegúrate que la callback URL en GitHub sea exactamente:
`http://localhost:3000/api/auth/callback/github`

## 📞 Contacto

Si tienes dudas o necesitas ayuda con la integración del backend, avísame!

---

**Estado Actual**: ✅ Frontend completo, esperando integración con backend
