<template>
  <div class="announcement-detail-view">
    <div class="header-bar">
      <button class="back-button" @click="goBack">
        ← Retour aux annonces
      </button>
      <h1 class="page-title">{{ announcement?.title || 'Annonce' }}</h1>
    </div>

    <div class="announcement-content">
      <div v-if="loading" class="loading-container">
        <div class="loading-message">Chargement de l'annonce...</div>
      </div>

      <div v-else-if="error" class="error-container">
        <div class="error-message">{{ error }}</div>
        <button class="retry-button" @click="loadAnnouncement">Réessayer</button>
      </div>

      <div v-else-if="announcement" class="announcement-detail">
        <div class="announcement-header">
          <div class="announcement-meta">
            <span class="announcement-date">{{ formatDate(announcement.date) }}</span>
            <span class="announcement-version">Version {{ announcement.version }}</span>
          </div>

          <div class="announcement-image" v-if="announcement.image">
            <img :src="getImageUrl(announcement.image)" :alt="announcement.title" />
          </div>
        </div>

        <div class="announcement-body">
          <div class="markdown-content" v-html="renderMarkdown(announcement.content)"></div>
          <!-- Fallback pour les images qui ne se chargent pas -->
          <div v-if="announcement.content && announcement.content.includes('![')" class="image-fallback-notice" style="display: none;">
            Si les images ne s'affichent pas, essayez de rafraîchir la page.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { apiGet } from '@/utils/api'
import { getApiBaseUrl } from '@/utils/api'
import { useSound } from '@/composables/useSound'

const router = useRouter()
const route = useRoute()
const { click } = useSound()

const announcement = ref(null)
const loading = ref(true)
const error = ref(null)

onMounted(() => {
  loadAnnouncement()
  
  // Gérer les erreurs d'images après le rendu
  nextTick(() => {
    const images = document.querySelectorAll('.markdown-image')
    images.forEach(img => {
      img.addEventListener('error', function() {
        console.log('❌ Erreur de chargement d\'image, retry:', this.src)
        // Retry avec un timestamp pour éviter le cache
        setTimeout(() => {
          this.src = this.src.split('?')[0] + '?t=' + Date.now()
        }, 1000)
      })
      img.addEventListener('load', function() {
        console.log('✅ Image chargée:', this.src)
      })
    })
  })
})

const loadAnnouncement = async () => {
  try {
    loading.value = true
    error.value = null
    const slug = route.params.slug
    console.log('📄 Chargement de l\'annonce:', slug)
    const data = await apiGet(`/api/announcements/${slug}`)
    console.log('📄 Données reçues:', data)
    announcement.value = data
  } catch (err) {
    console.error('❌ Erreur lors du chargement de l\'annonce:', err)
    error.value = 'Impossible de charger l\'annonce. Veuillez réessayer.'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  click()
  router.push('/announcements')
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getImageUrl = (imageName) => {
  // Utiliser la même URL de base que l'API
  const url = `${getApiBaseUrl()}/api/announcements/images/${imageName}`
  console.log('🔗 Image URL générée:', url)
  return url
}

const renderMarkdown = (markdown) => {
  if (!markdown) return ''

  console.log('📝 Rendering markdown:', markdown.substring(0, 100) + '...')

  // Simple markdown renderer (basic implementation)
  let html = markdown

  // Images - doit être traité en premier pour éviter les conflits
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
    const imageUrl = getImageUrl(src)
    console.log('🖼️ Image markdown trouvée:', match, '->', imageUrl)
    return `<img src="${imageUrl}" alt="${alt}" class="markdown-image" />`
  })

  // Tables - approche plus simple et robuste
  html = html.replace(/^\|(.+)\|\s*$/gm, (match, content) => {
    // Cette regex capture les lignes de tableau individuelles
    return match
  })

  // Maintenant traiter les blocs de tableau complets
  html = html.replace(/((?:^\|.*\|\s*$[\r\n]?)+)/gm, (match) => {
    const lines = match.trim().split('\n').filter(line => line.trim())
    if (lines.length < 2) return match // Pas assez de lignes pour un tableau

    // Vérifier si la deuxième ligne est une ligne de séparation
    const secondLine = lines[1].trim()
    if (!/^[\s|:-]+$/.test(secondLine)) return match // Pas une ligne de séparation

    const headers = lines[0].split('|').slice(1, -1).map(h => h.trim())
    const bodyLines = lines.slice(2)

    let tableHtml = '<table class="markdown-table">'

    // Header row
    tableHtml += '<thead><tr>'
    headers.forEach(header => {
      tableHtml += `<th>${header}</th>`
    })
    tableHtml += '</tr></thead>'

    // Body rows
    if (bodyLines.length > 0) {
      tableHtml += '<tbody>'
      bodyLines.forEach(line => {
        const cells = line.split('|').slice(1, -1).map(cell => cell.trim())
        tableHtml += '<tr>'
        cells.forEach(cell => {
          tableHtml += `<td>${cell}</td>`
        })
        tableHtml += '</tr>'
      })
      tableHtml += '</tbody>'
    }

    tableHtml += '</table>'
    return tableHtml
  })

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

  // Lists
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>')
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>')

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="markdown-code-block"><code>$1</code></pre>')
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="markdown-code-inline">$1</code>')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="markdown-link">$1</a>')

  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>')
  html = html.replace(/\n/g, '<br>')

  // Wrap in paragraphs
  html = html.replace(/^([^<].*)$/gm, '<p>$1</p>')

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '')
  html = html.replace(/<p><br><\/p>/g, '')

  return html
}
</script>

<style scoped>
.announcement-detail-view {
  padding: 24px;
  background: var(--bg-primary);
  font-family: 'Fredoka', sans-serif;
  height: 100vh;
  overflow-y: auto;
}

.header-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back-button {
  background: var(--button-bg);
  color: var(--button-text);
  border: 2px solid var(--border-primary);
  border-radius: 8px;
  padding: 8px 16px;
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: var(--button-hover);
  transform: translateY(-1px);
}

.page-title {
  font-size: 28px;
  color: var(--text-header);
  margin: 0;
  flex: 1;
}

.announcement-content {
  max-width: 800px;
  margin: 0 auto;
}

.loading-container, .error-container {
  text-align: center;
  padding: 60px 20px;
}

.loading-message {
  font-size: 18px;
  color: var(--text-primary);
}

.error-message {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.retry-button {
  background: var(--button-bg);
  color: var(--button-text);
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-family: 'Fredoka', sans-serif;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer;
  transition: all 0.2s ease;
}

.retry-button:hover {
  background: var(--button-hover);
  transform: translateY(-1px);
}

.announcement-detail {
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: 12px;
  overflow: hidden;
}

.announcement-header {
  padding: 24px;
  border-bottom: 1px solid var(--border-tertiary);
}

.announcement-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  font-size: 14px;
  color: var(--text-secondary);
}

.announcement-date, .announcement-version {
  background: var(--bg-primary);
  padding: 6px 12px;
  border-radius: 12px;
}

.announcement-image {
  margin-top: 16px;
}

.announcement-image img {
  width: 100%;
  max-width: 400px;
  height: auto;
  border-radius: 8px;
  box-shadow: var(--shadow-primary);
}

.announcement-body {
  padding: 24px;
}

.markdown-content {
  color: var(--text-primary);
  line-height: 1.6;
}

.markdown-content :deep(h1) {
  font-size: 24px;
  color: var(--text-header);
  margin: 24px 0 16px 0;
  border-bottom: 2px solid var(--border-primary);
  padding-bottom: 8px;
}

.markdown-content :deep(h2) {
  font-size: 20px;
  color: var(--text-header);
  margin: 20px 0 12px 0;
}

.markdown-content :deep(h3) {
  font-size: 18px;
  color: var(--text-header);
  margin: 16px 0 8px 0;
}

.markdown-content :deep(p) {
  margin: 12px 0;
}

.markdown-content :deep(strong) {
  font-weight: bold;
  color: var(--text-accent);
}

.markdown-content :deep(em) {
  font-style: italic;
}

.markdown-content :deep(li) {
  margin: 4px 0;
  padding-left: 16px;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid var(--border-tertiary);
  padding: 8px 12px;
  text-align: left;
}

.markdown-content :deep(th) {
  background: var(--bg-primary);
  font-weight: bold;
}

.markdown-content :deep(.markdown-table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  border: 1px solid var(--border-tertiary);
}

.markdown-content :deep(.markdown-table th),
.markdown-content :deep(.markdown-table td) {
  border: 1px solid var(--border-tertiary);
  padding: 8px 12px;
  text-align: left;
}

.markdown-content :deep(.markdown-table th) {
  background: var(--bg-primary);
  font-weight: bold;
}

.markdown-content :deep(.markdown-image) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 16px 0;
  box-shadow: var(--shadow-primary);
}

.markdown-content :deep(.markdown-code-block) {
  background: var(--bg-primary);
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
}

.markdown-content :deep(.markdown-code-block code) {
  font-family: monospace;
}

.markdown-content :deep(.markdown-code-inline) {
  background: var(--bg-primary);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
}

.markdown-content :deep(.markdown-link) {
  color: var(--text-accent);
  text-decoration: underline;
}

.markdown-content :deep(.markdown-link:hover) {
  opacity: 0.8;
}

/* Responsive Design */
@media (max-width: 768px) {
  .announcement-detail-view {
    padding: 16px;
  }

  .header-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .page-title {
    font-size: 24px;
  }

  .announcement-header,
  .announcement-body {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .announcement-detail-view {
    padding: 12px;
  }

  .announcement-header,
  .announcement-body {
    padding: 12px;
  }

  .page-title {
    font-size: 20px;
  }
}
</style>